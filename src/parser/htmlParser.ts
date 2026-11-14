import { stripTrackers, type RemovedTracker } from "@/cleaner/trackers";
import { stripUnnecessaryScripts } from "@/cleaner/scripts";
import { findCtas, type CtaNode } from "@/dom/ctas";
import {
  findHeadlines,
  primaryHeadline,
  primarySubheadline,
  type HeadlineNode,
} from "@/dom/headlines";
import { absolutize, normalizeHttpUrl } from "@/utils/url";

export interface ParsedHtml {
  url: string;
  title: string;
  headline: string;
  subheadline: string;
  headlines: HeadlineNode[];
  ctas: CtaNode[];
  removedTrackers: RemovedTracker[];
  cleanedHtml: string;
  rawHtml: string;
}

export interface ParseHtmlOptions {
  aggressiveScriptStrip?: boolean;
}

const SKIP_PROTOCOL = /^(data:|blob:|mailto:|tel:|javascript:|#)/i;

/**
 * Converts ALL relative resource URLs (CSS, JS, images, fonts) in the document
 * to absolute URLs based on the original page URL. This runs BEFORE the HTML
 * is serialized as cleanedHtml, ensuring stylesheets and scripts load
 * correctly in both the preview iframe and exported files.
 */
function normalizeResourceUrls(doc: Document, baseUrl: string): void {
  if (!baseUrl) return;

  // <link> tags — stylesheets, preload, icons, fonts
  doc.querySelectorAll("link[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || SKIP_PROTOCOL.test(href) || /^https?:\/\//i.test(href)) return;
    const abs = absolutize(baseUrl, href);
    if (abs && abs !== href) link.setAttribute("href", abs);
  });

  // <script src="...">
  doc.querySelectorAll("script[src]").forEach((script) => {
    const src = script.getAttribute("src") || "";
    if (!src || SKIP_PROTOCOL.test(src) || /^https?:\/\//i.test(src)) return;
    const abs = absolutize(baseUrl, src);
    if (abs && abs !== src) script.setAttribute("src", abs);
  });

  // <img src="..."> and lazy-load attributes
  doc.querySelectorAll("img").forEach((img) => {
    for (const attr of ["src", "data-src", "data-original", "data-lazy-src"]) {
      const val = img.getAttribute(attr);
      if (!val || SKIP_PROTOCOL.test(val) || /^https?:\/\//i.test(val)) continue;
      const abs = absolutize(baseUrl, val);
      if (abs && abs !== val) img.setAttribute(attr, abs);
    }
    const srcset = img.getAttribute("srcset");
    if (srcset && !SKIP_PROTOCOL.test(srcset)) {
      const fixed = srcset.split(",").map((part) => {
        const bits = part.trim().split(/\s+/);
        if (!bits[0] || SKIP_PROTOCOL.test(bits[0]) || /^https?:\/\//i.test(bits[0])) return part.trim();
        bits[0] = absolutize(baseUrl, bits[0]);
        return bits.join(" ");
      }).join(", ");
      if (fixed !== srcset) img.setAttribute("srcset", fixed);
    }
  });

  // <source srcset="..."]
  doc.querySelectorAll("source[srcset]").forEach((source) => {
    const srcset = source.getAttribute("srcset") || "";
    if (!srcset || SKIP_PROTOCOL.test(srcset)) return;
    const fixed = srcset.split(",").map((part) => {
      const bits = part.trim().split(/\s+/);
      if (!bits[0] || SKIP_PROTOCOL.test(bits[0]) || /^https?:\/\//i.test(bits[0])) return part.trim();
      bits[0] = absolutize(baseUrl, bits[0]);
      return bits.join(" ");
    }).join(", ");
    if (fixed !== srcset) source.setAttribute("srcset", fixed);
  });

  // <video src>, <audio src>, <iframe src>, <embed src>, <object data>
  doc.querySelectorAll("video, audio, iframe, embed").forEach((el) => {
    const src = el.getAttribute("src") || "";
    if (!src || SKIP_PROTOCOL.test(src) || /^https?:\/\//i.test(src)) return;
    const abs = absolutize(baseUrl, src);
    if (abs && abs !== src) el.setAttribute("src", abs);
  });
  doc.querySelectorAll("object").forEach((el) => {
    const data = el.getAttribute("data") || "";
    if (!data || SKIP_PROTOCOL.test(data) || /^https?:\/\//i.test(data)) return;
    const abs = absolutize(baseUrl, data);
    if (abs && abs !== data) el.setAttribute("data", abs);
  });

  // Inline <style> blocks — absolutize url() and @import
  doc.querySelectorAll("style").forEach((style) => {
    const css = style.textContent || "";
    if (!css) return;
    const fixed = css
      .replace(/url\((['"]?)([^'")]+)\1\)/gi, (full, quote: string, url: string) => {
        const trimmed = (url || "").trim();
        if (!trimmed || SKIP_PROTOCOL.test(trimmed) || /^https?:\/\//i.test(trimmed)) return full;
        return `url(${quote}${absolutize(baseUrl, trimmed)}${quote})`;
      })
      .replace(/@import\s+(['"])([^'"]+)\1/gi, (full, quote: string, url: string) => {
        const trimmed = (url || "").trim();
        if (!trimmed || SKIP_PROTOCOL.test(trimmed) || /^https?:\/\//i.test(trimmed)) return full;
        return `@import ${quote}${absolutize(baseUrl, trimmed)}${quote}`;
      });
    if (fixed !== css) style.textContent = fixed;
  });

  // Inline style="" attributes — absolutize url()
  doc.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") || "";
    if (!style || !style.includes("url(")) return;
    const fixed = style.replace(/url\((['"]?)([^'")]+)\1\)/gi, (full, quote: string, url: string) => {
      const trimmed = (url || "").trim();
      if (!trimmed || SKIP_PROTOCOL.test(trimmed) || /^https?:\/\//i.test(trimmed)) return full;
      return `url(${quote}${absolutize(baseUrl, trimmed)}${quote})`;
    });
    if (fixed !== style) el.setAttribute("style", fixed);
  });
}

function asFullDocument(html: string): string {
  const t = (html || "").trim();
  if (!t) return "<!DOCTYPE html><html><head></head><body></body></html>";
  if (/^<!doctype/i.test(t)) return t;
  if (/^<html[\s>]/i.test(t)) return `<!DOCTYPE html>${t}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${t}</body></html>`;
}

export function parseHtmlDocument(
  html: string,
  pageUrl: string,
  options: ParseHtmlOptions = {},
): ParsedHtml {
  const url = normalizeHttpUrl(pageUrl);
  const doc = new DOMParser().parseFromString(asFullDocument(html), "text/html");

  const removedTrackers = [...stripTrackers(doc), ...stripUnnecessaryScripts(doc)];

  // Absolutize ALL resource URLs before serializing — this ensures CSS, JS,
  // images, and fonts load correctly in the preview iframe and exported files.
  normalizeResourceUrls(doc, url);

  if (options.aggressiveScriptStrip) {
    doc.querySelectorAll("script, noscript").forEach((n) => n.remove());
  }

  const title = doc.querySelector("title")?.textContent?.trim() ?? "";
  const description =
    doc.querySelector('meta[name="description"]')?.getAttribute("content") ??
    doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    "";

  const headlines = findHeadlines(doc);
  const ctas = findCtas(doc, url);

  return {
    url,
    title,
    headline: primaryHeadline(headlines, title),
    subheadline: primarySubheadline(headlines, description),
    headlines,
    ctas,
    removedTrackers,
    cleanedHtml: doc.documentElement?.outerHTML ?? html,
    rawHtml: html,
  };
}

async function fetchPageHtml(targetUrl: string): Promise<string> {
  // Normalizar URL
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // Lista de Proxies CORS públicos e resilientes
  const proxies = [
    (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  ];

  let lastError = "";

  // 1. Tentar Netlify Function (roda no mesmo domínio, sem CORS)
  try {
    const res = await fetch(`/.netlify/functions/fetch-page?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.html) return data.html;
    }
  } catch (e) {
    console.warn("Netlify function fetch failed, trying Supabase...", e);
  }

  // 2. Tentar Supabase Edge Function se configurado
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/fetch-page`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ url: cleanUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.html) return data.html;
      }
    } catch (e) {
      console.warn("Supabase fetch failed, trying CORS fallbacks...", e);
    }
  }

  // 3. Tentar proxies públicos em sequência
  for (const getProxyUrl of proxies) {
    try {
      const proxyUrl = getProxyUrl(cleanUrl);
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;
      if (proxyUrl.includes("allorigins")) {
        const data = await response.json();
        if (data.contents) return data.contents;
      } else {
        const text = await response.text();
        if (text && text.length > 200) return text;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Erro no proxy CORS";
    }
  }

  throw new Error(
    `Não foi possível carregar a página (${lastError || "Bloqueio de CORS/Rede"}). Verifique a URL e tente novamente.`,
  );
}

export async function parseHtmlFromUrl(
  pageUrl: string,
  options: ParseHtmlOptions = {},
): Promise<ParsedHtml> {
  const url = normalizeHttpUrl(pageUrl);
  const html = await fetchPageHtml(url);
  return parseHtmlDocument(html, url, options);
}
