import type { ExtractedPage } from "@/parser/extractPage";
import { collapseWhitespace } from "@/utils/url";
import { escapeAttr, escapeHtml } from "./escape";
import type { CloneContext } from "./types";

function ensureAbsoluteUrl(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function resolveAffiliateHref(page: ExtractedPage, affiliateUrl?: string): string {
  const trimmed = (affiliateUrl || "").trim();
  if (trimmed) return ensureAbsoluteUrl(trimmed);
  return page.ctas[0]?.href || "#";
}

export function resolveCtaText(page: ExtractedPage, ctaText?: string): string {
  const trimmed = (ctaText || "").trim();
  if (trimmed) return trimmed;
  return page.ctas[0]?.text || "Quero garantir agora";
}

function isInternalAnchor(raw: string): boolean {
  const t = (raw || "").trim().toLowerCase();
  return t.startsWith("#");
}

function applyAffiliateHref(el: Element, href: string): void {
  el.setAttribute("href", href);
  el.setAttribute("target", "_blank");
  el.setAttribute("rel", "noopener noreferrer");
  el.setAttribute("data-affiliate-cta", "true");
}

function applyAffiliateAttr(el: Element, attr: string, href: string): void {
  el.setAttribute(attr, href);
  el.setAttribute("data-affiliate-cta", "true");
}

function copyVisualAttrs(from: Element, to: Element): void {
  for (const attr of ["class", "style", "id", "aria-label", "title"]) {
    const value = from.getAttribute(attr);
    if (value) to.setAttribute(attr, value);
  }
}

function replaceControlWithAffiliateLink(el: Element, href: string): Element {
  const parentLink = el.closest("a");
  if (parentLink) {
    applyAffiliateHref(parentLink, href);
    return parentLink;
  }

  const tag = el.tagName.toLowerCase();
  if (tag === "a") {
    applyAffiliateHref(el, href);
    return el;
  }

  const doc = el.ownerDocument;
  const a = doc.createElement("a");
  applyAffiliateHref(a, href);
  copyVisualAttrs(el, a);
  if (tag === "input") {
    a.textContent = el.getAttribute("value") || el.getAttribute("aria-label") || "";
  } else {
    a.innerHTML = el.innerHTML;
  }
  el.replaceWith(a);
  return a;
}

function setCtaCopy(el: Element, text: string): void {
  if (el.tagName.toLowerCase() === "input") el.setAttribute("value", text);
  else el.textContent = text;
}

/**
 * Universal affiliate link replacement — language-agnostic.
 * Replaces ALL external links, form actions, data-href/data-url attributes,
 * and clickable elements. Internal #anchors are left as scroll targets,
 * but forms/buttons inside those sections still get the affiliate link.
 */
export function applyGlobalAffiliate(doc: Document, ctx: CloneContext): void {
  const href = ensureAbsoluteUrl((ctx.ctaHref || "").trim());
  if (!href || href === "#") return;

  const marked: Element[] = [];
  const seen = new Set<Element>();
  const mark = (el: Element) => {
    if (seen.has(el)) return;
    seen.add(el);
    marked.push(el);
  };

  // 1) ALL <a> tags with external or non-href URLs
  doc.querySelectorAll("a[href], area[href]").forEach((a) => {
    const raw = (a.getAttribute("href") || "").trim();
    if (isInternalAnchor(raw)) return;
    applyAffiliateHref(a, href);
    mark(a);
  });

  // 2) ALL <a> tags with NO href but that look clickable (role, class, data-href)
  doc.querySelectorAll("a:not([href])").forEach((a) => {
    if (a.getAttribute("role") === "button" || a.getAttribute("data-href") || a.getAttribute("data-url")) {
      applyAffiliateHref(a, href);
      mark(a);
    }
  });

  // 3) ALL <form> elements — replace action with affiliate URL
  doc.querySelectorAll("form").forEach((form) => {
    form.setAttribute("action", href);
    form.setAttribute("data-affiliate-cta", "true");
    form.setAttribute("method", "get");
    mark(form);
  });

  // 4) Elements with data-href, data-url, data-link attributes
  doc.querySelectorAll("[data-href], [data-url], [data-link], [data-redirect]").forEach((el) => {
    for (const attr of ["data-href", "data-url", "data-link", "data-redirect"]) {
      if (el.hasAttribute(attr)) {
        applyAffiliateAttr(el, attr, href);
      }
    }
    mark(el);
  });

  // 5) ALL buttons, submit inputs, and role=button elements — convert to affiliate links
  doc
    .querySelectorAll("button, [role='button'], input[type='submit'], input[type='button'], input[type='image']")
    .forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === "input") {
        const inpType = (el.getAttribute("type") || "").toLowerCase();
        if (inpType === "submit" || inpType === "button" || inpType === "image") {
          mark(replaceControlWithAffiliateLink(el, href));
        }
      } else {
        mark(replaceControlWithAffiliateLink(el, href));
      }
    });

  // 6) Elements with onclick handlers that navigate — replace with affiliate URL
  doc.querySelectorAll("[onclick]").forEach((el) => {
    if (seen.has(el)) return;
    const onclick = el.getAttribute("onclick") || "";
    if (/window\.location|document\.location|location\.href|window\.open|location\.assign|location\.replace/i.test(onclick)) {
      el.setAttribute("onclick", `window.location.href=${JSON.stringify(href)};return false;`);
      el.setAttribute("data-affiliate-cta", "true");
      // If it's an <a> without href, add one
      if (el.tagName.toLowerCase() === "a" && !el.getAttribute("href")) {
        applyAffiliateHref(el, href);
      }
      mark(el);
    }
  });

  // 7) Internal #anchor links — find forms/buttons inside target sections and apply affiliate
  doc.querySelectorAll("a[href^='#']").forEach((a) => {
    const anchor = a.getAttribute("href") || "";
    if (anchor === "#" || anchor.length < 2) return;
    const targetId = anchor.slice(1);
    const target = doc.getElementById(targetId);
    if (!target) return;

    // Find actionable elements inside the anchor target section
    target.querySelectorAll("a[href], form, button, [role='button'], input[type='submit'], [data-href], [data-url]").forEach((inner) => {
      if (seen.has(inner)) return;
      const innerTag = inner.tagName.toLowerCase();
      if (innerTag === "a") {
        const innerHref = (inner.getAttribute("href") || "").trim();
        if (isInternalAnchor(innerHref)) return;
        applyAffiliateHref(inner, href);
        mark(inner);
      } else if (innerTag === "form") {
        inner.setAttribute("action", href);
        inner.setAttribute("data-affiliate-cta", "true");
        mark(inner);
      } else {
        mark(replaceControlWithAffiliateLink(inner, href));
      }
    });
  });

  // 8) Apply CTA text to the first marked element (if provided)
  if (!ctx.ctaText || !marked.length) return;
  const original = collapseWhitespace(ctx.page.ctas[0]?.text).toLowerCase();
  const preferred =
    marked.find((el) => collapseWhitespace(el.textContent).toLowerCase() === original) || marked[0];
  if (preferred.tagName.toLowerCase() === "form") return;
  setCtaCopy(preferred, ctx.ctaText);
}

export function affiliateCtas(
  page: ExtractedPage,
  href: string,
  primaryText: string,
): { text: string; href: string }[] {
  const seen = new Set<string>();
  const out: { text: string; href: string }[] = [];
  const push = (text: string) => {
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);
    out.push({ text, href });
  };
  push(primaryText);
  for (const c of page.ctas) push(c.text);
  return out;
}

export function ctaAnchor(text: string, href: string, extraClass = ""): string {
  const safeHref = ensureAbsoluteUrl(href);
  const cls = extraClass ? `cta pc-cta-fallback ${extraClass}` : "cta pc-cta-fallback";
  return `<a class="${cls}" data-affiliate-cta="true" href="${escapeAttr(safeHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
}
