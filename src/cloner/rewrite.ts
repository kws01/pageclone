import type { CloneContext } from "./types";
import { escapeHtml } from "./escape";
import { absolutize } from "@/utils/url";

export { applyGlobalAffiliate } from "./affiliate";

const SKIP_PROTOCOL = /^(data:|blob:|mailto:|tel:|javascript:|#)/i;

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Script injected into the cloned page (inside the iframe) to intercept clicks
 * on <a> tags. Internal/anchor links get preventDefault + smooth scroll instead
 * of navigating to the official site. Affiliate CTA links open normally.
 */
const INTERCEPTOR_SCRIPT = `(function(){
  var pageDomain = (function(){
    try { return new URL(document.baseURI).hostname.replace(/^www\\./,''); }
    catch(e){ return ''; }
  })();
  document.addEventListener('click', function(e){
    var el = e.target;
    while(el && el.tagName !== 'A'){ el = el.parentElement; }
    if(!el || el.tagName !== 'A') return;
    var href = el.getAttribute('href') || '';
    // Affiliate CTA links — let them open normally
    if(el.hasAttribute('data-affiliate-cta') || el.target === '_blank'){ return; }
    // Pure anchor links (#section) — smooth scroll, prevent navigation
    if(href.charAt(0) === '#' && href.length > 1){
      e.preventDefault();
      var target = document.getElementById(href.slice(1));
      if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
      return;
    }
    // Same-domain links (full URL to official site) — prevent navigation
    if(href && href.charAt(0) !== '#'){
      try {
        var linkUrl = new URL(href, document.baseURI);
        var linkDomain = linkUrl.hostname.replace(/^www\\./,'');
        if(pageDomain && linkDomain === pageDomain){
          // If it has an anchor, scroll to it; otherwise just block navigation
          if(linkUrl.hash && linkUrl.hash.length > 1){
            e.preventDefault();
            var t = document.getElementById(linkUrl.hash.slice(1));
            if(t){ t.scrollIntoView({behavior:'smooth', block:'start'}); }
          } else {
            e.preventDefault();
          }
        }
      } catch(e2){}
    }
  }, true);
})();`;

function ensureHead(doc: Document): HTMLHeadElement {
  if (doc.head) return doc.head;
  const head = doc.createElement("head");
  doc.documentElement.insertBefore(head, doc.body);
  return head;
}

export function injectBaseAndViewport(doc: Document, pageUrl: string): void {
  const head = ensureHead(doc);

  // Remove any existing base tags to avoid duplicates
  doc.querySelectorAll("base").forEach((b) => b.remove());

  // <base> must be the VERY FIRST element in <head> so the browser resolves
  // all relative CSS/font/image/script paths against the original page URL.
  if (pageUrl) {
    const base = doc.createElement("base");
    base.setAttribute("href", pageUrl);
    head.insertBefore(base, head.firstChild);
  }

  // charset and viewport come after <base>
  if (!head.querySelector("meta[charset]")) {
    const charset = doc.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    // Insert after base if it exists, otherwise first
    const baseEl = head.querySelector("base");
    if (baseEl && baseEl.nextSibling) {
      head.insertBefore(charset, baseEl.nextSibling);
    } else {
      head.insertBefore(charset, head.firstChild);
    }
  }
  if (!head.querySelector('meta[name="viewport"]')) {
    const meta = doc.createElement("meta");
    meta.setAttribute("name", "viewport");
    meta.setAttribute("content", "width=device-width, initial-scale=1");
    head.appendChild(meta);
  }
}

export function injectStyle(doc: Document, css: string, marker: string): void {
  const head = ensureHead(doc);
  if (head.querySelector(`style[${marker}]`)) return;
  const style = doc.createElement("style");
  style.setAttribute(marker, "true");
  style.textContent = css;
  head.appendChild(style);
}

export function stripScripts(doc: Document): void {
  doc.querySelectorAll("script:not([data-pageclone-interceptor]):not([data-pageclone-custom]):not([data-pageclone-cookie-script]), noscript:not([data-pageclone-custom])").forEach((n) => n.remove());
}

function markCustomNode(node: Node): void {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as Element;
  if (element.matches("script, noscript")) element.setAttribute("data-pageclone-custom", "true");
  element.querySelectorAll("script, noscript").forEach((child) => child.setAttribute("data-pageclone-custom", "true"));
}

function appendMarkup(doc: Document, parent: Element, code: string): void {
  const trimmed = code.trim();
  if (!trimmed) return;
  const template = doc.createElement("template");
  template.innerHTML = trimmed;
  if (template.content.childNodes.length === 1 && template.content.firstChild?.nodeType === Node.TEXT_NODE) {
    const script = doc.createElement("script");
    script.textContent = trimmed;
    script.setAttribute("data-pageclone-custom", "true");
    parent.appendChild(script);
    return;
  }
  const nodes = Array.from(template.content.childNodes);
  nodes.forEach(markCustomNode);
  parent.append(...nodes);
}

const COOKIE_BANNER_STYLE = `
.pc-pageclone-cookie-banner{position:fixed;z-index:2147483647;left:16px;right:16px;bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:920px;margin:0 auto;padding:18px 20px;background:#fff;color:#0f172a;border:1px solid #cbd5e1;border-radius:14px;box-shadow:0 16px 40px rgba(15,23,42,.2);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.pc-pageclone-cookie-copy{flex:1}.pc-pageclone-cookie-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.pc-pageclone-cookie-actions button{border:0;border-radius:8px;padding:9px 14px;font:600 13px inherit;cursor:pointer}.pc-pageclone-cookie-accept{background:#16a34a;color:#fff}.pc-pageclone-cookie-reject{background:#e2e8f0;color:#0f172a}.pc-pageclone-cookie-close{align-self:flex-start;background:transparent;color:#475569;padding:0 4px!important;font-size:20px!important;line-height:1}
@media(max-width:640px){.pc-pageclone-cookie-banner{bottom:8px;left:8px;right:8px;flex-direction:column;align-items:stretch;gap:12px;padding:16px}.pc-pageclone-cookie-actions{justify-content:stretch}.pc-pageclone-cookie-actions button{flex:1}}
`;

export function injectCustomFeatures(doc: Document, ctx: CloneContext): void {
  const head = ensureHead(doc);
  const body = doc.body || doc.documentElement;
  const bodyTrackingCode = ctx.opts.bodyTrackingCode || "";
  appendMarkup(doc, head, ctx.opts.headTrackingCode || "");

  if (!ctx.opts.enableCookieBanner) {
    appendMarkup(doc, body, bodyTrackingCode);
    return;
  }

  injectStyle(doc, COOKIE_BANNER_STYLE, "data-pageclone-cookie-style");
  const affiliateUrl = (ctx.ctaHref || "#").trim();
  const cookieText = ctx.opts.cookieText?.trim() || "We use cookies to improve your experience and analyze site traffic.";
  const acceptText = ctx.opts.acceptBtnText?.trim() || "Accept All";
  const rejectText = ctx.opts.rejectBtnText?.trim() || "Decline";
  const redirectOnAction = ctx.opts.redirectOnAction !== false;
  const redirectTarget = ctx.opts.redirectTarget === "_blank" ? "_blank" : "_self";
  const banner = doc.createElement("div");
  banner.id = "custom-cookie-banner";
  banner.className = "pc-pageclone-cookie-banner";
  banner.setAttribute("data-pageclone-cookie-banner", "true");
  banner.innerHTML = `<div class="pc-pageclone-cookie-copy">${escapeHtml(cookieText)}</div><div class="pc-pageclone-cookie-actions"><button type="button" class="pc-pageclone-cookie-accept">${escapeHtml(acceptText)}</button><button type="button" class="pc-pageclone-cookie-reject">${escapeHtml(rejectText)}</button><button type="button" class="pc-pageclone-cookie-close" aria-label="Close">&times;</button></div>`;
  doc.body?.appendChild(banner);

  const script = doc.createElement("script");
  script.setAttribute("data-pageclone-cookie-script", "true");
  const config = JSON.stringify({ affiliateUrl, redirectOnAction, redirectTarget }).replace(/<\//g, "<\\/");
  script.textContent = `(function(){var c=${config};var b=document.getElementById("custom-cookie-banner");if(!b)return;function act(){if(!c.redirectOnAction||!c.affiliateUrl||c.affiliateUrl==="#"){b.remove();return;}if(c.redirectTarget==="_blank")window.open(c.affiliateUrl,"_blank","noopener,noreferrer");else window.location.href=c.affiliateUrl;}b.querySelectorAll("button").forEach(function(x){x.addEventListener("click",act);});})();`;
  body.appendChild(script);
  appendMarkup(doc, body, bodyTrackingCode);
}

/**
 * Injects a click-interception script into the cloned document that prevents
 * the iframe from navigating to the official site when internal/anchor links
 * are clicked. Affiliate CTA links (marked with data-affiliate-cta) are
 * allowed to open normally in a new tab.
 */
export function injectClickInterceptor(doc: Document): void {
  const script = doc.createElement("script");
  script.setAttribute("data-pageclone-interceptor", "true");
  script.textContent = INTERCEPTOR_SCRIPT;
  doc.body?.appendChild(script);
}

export function normalizeImages(doc: Document, baseUrl: string): void {
  doc.querySelectorAll("img").forEach((img) => {
    const lazySrc =
      img.getAttribute("data-src") ||
      img.getAttribute("data-original") ||
      img.getAttribute("data-lazy-src") ||
      "";
    const srcset = img.getAttribute("srcset") || "";
    let src = img.getAttribute("src") || "";

    if (lazySrc && (!src || src.includes("placeholder") || src.includes("blank") || src.startsWith("data:"))) {
      src = lazySrc;
      img.setAttribute("src", src);
    }
    if (!src && srcset) {
      src = srcset.split(",")[0]?.trim().split(/\s+/)[0] || "";
      if (src) img.setAttribute("src", src);
    }

    if (src && baseUrl) {
      const abs = absolutize(baseUrl, src);
      if (abs !== src) img.setAttribute("src", abs);
    }

    if (srcset && baseUrl) {
      const fixed = srcset
        .split(",")
        .map((part) => {
          const bits = part.trim().split(/\s+/);
          if (!bits[0]) return part.trim();
          bits[0] = absolutize(baseUrl, bits[0]);
          return bits.join(" ");
        })
        .join(", ");
      img.setAttribute("srcset", fixed);
    }

    img.removeAttribute("data-src");
    img.removeAttribute("data-original");
    img.removeAttribute("data-lazy-src");
  });

  doc.querySelectorAll("source[srcset]").forEach((source) => {
    const srcset = source.getAttribute("srcset") || "";
    if (!srcset || !baseUrl) return;
    const fixed = srcset
      .split(",")
      .map((part) => {
        const bits = part.trim().split(/\s+/);
        if (!bits[0]) return part.trim();
        bits[0] = absolutize(baseUrl, bits[0]);
        return bits.join(" ");
      })
      .join(", ");
    source.setAttribute("srcset", fixed);
  });
}

/**
 * Absolutizes all CSS/stylesheet/font relative paths so styles render
 * correctly when the page is displayed in the preview iframe or exported
 * as a standalone HTML/ZIP file.
 */
export function normalizeAssets(doc: Document, baseUrl: string): void {
  if (!baseUrl) return;

  // <link rel="stylesheet" href="/css/app.css"> -> absolute URL
  doc.querySelectorAll('link[rel~="stylesheet"]').forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || SKIP_PROTOCOL.test(href)) return;
    if (/^https?:\/\//i.test(href)) return;
    const abs = absolutize(baseUrl, href);
    if (abs && abs !== href) link.setAttribute("href", abs);
  });

  // <link rel="preload" as="font" href="/fonts/..."> and icon links
  doc.querySelectorAll("link[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!href || SKIP_PROTOCOL.test(href)) return;
    if (/^https?:\/\//i.test(href)) return;
    const abs = absolutize(baseUrl, href);
    if (abs && abs !== href) link.setAttribute("href", abs);
  });

  // Inline <style> blocks: absolutize url() and @import references
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

  // Inline style="" attributes: absolutize url() references
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

/**
 * Converts same-domain anchor links (e.g. href="https://site.com/page/#checkout")
 * to local anchor references (e.g. href="#checkout") so clicking them scrolls
 * within the cloned page instead of navigating to the live official site.
 */
export function normalizeInternalLinks(doc: Document, pageUrl: string): void {
  const pageDomain = getDomain(pageUrl);
  if (!pageDomain) return;

  doc.querySelectorAll("a[href]").forEach((a) => {
    const raw = (a.getAttribute("href") || "").trim();
    if (!raw || SKIP_PROTOCOL.test(raw)) return;

    // Parse the URL to check if it's same-domain with an anchor
    try {
      const linkUrl = new URL(raw, pageUrl);
      const linkDomain = linkUrl.hostname.replace(/^www\./, "");

      if (linkDomain === pageDomain && linkUrl.hash) {
        // Same domain + has anchor → convert to local #anchor
        const anchor = linkUrl.hash;
        a.setAttribute("href", anchor);
        a.removeAttribute("target");
      }
    } catch {
      // Not a valid URL, skip
    }
  });
}

/**
 * Applies fallback CSS classes to CTA buttons and internal scroll links so they
 * have visible styling (green pulse button, blue button with arrow) even when
 * the original site's external CSS files are blocked by CORS or hotlinking.
 *
 * - Affiliate CTA elements (data-affiliate-cta) get the pc-cta-fallback class.
 * - Internal #anchor scroll links get the pc-scroll-fallback class + a down arrow.
 * - Existing classes and inline styles are preserved — the fallback class only
 *   adds styling via !important rules, so if the original CSS loads, it takes
 *   precedence visually and the fallback is invisible.
 */
/** Tags whose contents should never receive fallback button styling */
const NO_STYLING_PARENTS = "header, nav, footer, [class*='cookie' i], [class*='privacy' i], [class*='term' i], [class*='social' i], [class*='footer' i], [id*='cookie' i], [id*='privacy' i], [id*='term' i], [aria-label*='cookie' i], [aria-label*='footer' i]";

/** Keywords in link text that indicate navigation/informational, not CTA */
const NAV_TEXT = /politic|privac|term|cookie|suport|contato|contact|faq|sobre|about|login|entrar|cadastr|blog|início|home|menu|redes soci|instagram|facebook|twitter|linkedin|youtube|whats/i;

function isInNoStylingZone(el: Element): boolean {
  return !!el.closest(NO_STYLING_PARENTS);
}

function hasExistingStyles(el: Element): boolean {
  const cls = (el.getAttribute("class") || "").trim();
  const style = (el.getAttribute("style") || "").trim();
  // Has a meaningful class (not just whitespace) — original CSS likely styles it
  if (cls && cls.length > 0) return true;
  // Has inline styles with visual properties
  if (style && /background|border|padding|color|display|font/i.test(style)) return true;
  return false;
}

export function styleCtaButtons(doc: Document): void {
  const CTA_CLASS = "pc-cta-fallback";
  const SCROLL_CLASS = "pc-scroll-fallback";

  // Style affiliate CTA links/buttons — ONLY if they have no existing styling
  // and are not inside header/nav/footer/cookie/privacy/social sections
  doc.querySelectorAll("[data-affiliate-cta]").forEach((el) => {
    if (el.tagName.toLowerCase() === "form") return;
    if (isInNoStylingZone(el)) return;

    const text = (el.textContent || "").trim();
    if (NAV_TEXT.test(text)) return;

    // If the element already has CSS classes or inline styles, the original
    // page's CSS will style it — don't override with fallback
    if (hasExistingStyles(el)) return;

    const existing = el.getAttribute("class") || "";
    if (!existing.includes(CTA_CLASS)) {
      el.setAttribute("class", existing ? `${existing} ${CTA_CLASS}` : CTA_CLASS);
    }
  });

  // Style internal #anchor scroll links — ONLY if unstyled and not in nav/footer
  doc.querySelectorAll("a[href^='#']").forEach((a) => {
    if (a.hasAttribute("data-affiliate-cta")) return;
    const href = a.getAttribute("href") || "";
    if (href === "#" || href.length < 2) return;
    if (isInNoStylingZone(a)) return;

    const text = (a.textContent || "").trim();
    if (NAV_TEXT.test(text)) return;
    if (hasExistingStyles(a)) return;

    const existing = a.getAttribute("class") || "";
    if (!existing.includes(SCROLL_CLASS)) {
      a.setAttribute("class", existing ? `${existing} ${SCROLL_CLASS}` : SCROLL_CLASS);
    }
    if (text && !text.includes("\u2193") && !text.includes("↓")) {
      a.textContent = `${text.trim()} \u2193`;
    }
  });
}

export function applyEditorOverrides(doc: Document, ctx: CloneContext): void {
  const titleEl = doc.querySelector("title");
  if (titleEl && ctx.title) titleEl.textContent = ctx.title;
  else if (ctx.title) {
    const t = doc.createElement("title");
    t.textContent = ctx.title;
    ensureHead(doc).appendChild(t);
  }

  const h1 = doc.querySelector("h1");
  if (h1 && ctx.headline) h1.textContent = ctx.headline;

  if (ctx.subheadline) {
    const h2 = doc.querySelector("h2");
    if (h2) h2.textContent = ctx.subheadline;
  }

  if (ctx.logo) {
    const logo = doc.querySelector(
      "header img, .logo img, img[alt*='logo' i], img[class*='logo' i]",
    );
    if (logo) logo.setAttribute("src", ctx.logo);
  }
}
