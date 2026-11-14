import { absolutize, collapseWhitespace } from "@/utils/url";

export interface CtaNode {
  text: string;
  href: string;
  tag: string;
}

/**
 * Known checkout/affiliate platforms — used to flag links as CTAs even when
 * they lack button-like class names. Matching is domain-based, not
 * language-based, so it works across all locales.
 */
const CHECKOUT_DOMAINS =
  /checkout-ds24|digistore24|pay\.hotmart|hotmart\.com|buygoods|buygoods\.com|clickbank|clkbank|stripe|stripe\.com|paypal\.com|pay\.clickbank|checkout\.clickbank|2checkout|avangate|fastspring|gumroad|gumroad\.com|shopify|shopify\.com|woocommerce|wpcheckout|jvzoo|clicksure|paydotcom|swipe\.pages|paytrack|paymet|pagamentos|pagseguro|mercadopago|mercadolivre|amazon\.com|amazon\.com\.br|kiwify|kiwify\.app|eduzz|eduzz\.com|braip|braip\.com|monetizze|monetizze\.com\.br|perfectpay|perfectpay\.com\.br|greenn|greenn\.com\.br|ticto|ticto\.com/i;

export { CHECKOUT_DOMAINS };

function isExternalUrl(raw: string): boolean {
  const t = (raw || "").trim().toLowerCase();
  if (!t || t.startsWith("#") || t.startsWith("javascript:") || t.startsWith("mailto:") || t.startsWith("tel:")) {
    return false;
  }
  return true;
}

function isCheckoutUrl(raw: string): boolean {
  const t = (raw || "").trim().toLowerCase();
  if (!t) return false;
  return CHECKOUT_DOMAINS.test(t);
}

/**
 * Language-agnostic CTA class detection — matches structural patterns
 * (class names, button types, roles) rather than language-specific copy.
 */
const CTA_CLASS = /btn|button|cta|buy|purchase|checkout|hero-cta|primary|action|submit|order|pay|cart|product/i;

export { CTA_CLASS };

/**
 * Detects whether an element looks like a CTA button based on structure,
 * not language. Checks: button tag, role=button, submit type, CTA classes,
 * data-href/data-url attributes, OR an external/checkout URL in href.
 */
export function looksLikeCta(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  const className = el.getAttribute("class") || "";
  const type = el.getAttribute("type") || "";
  const href = el.getAttribute("href") || "";

  // Structural patterns (no language dependency)
  if (
    tag === "button" ||
    CTA_CLASS.test(className) ||
    type === "submit" ||
    type === "button" ||
    type === "image" ||
    el.getAttribute("role") === "button" ||
    !!el.getAttribute("data-href") ||
    !!el.getAttribute("data-url") ||
    !!el.getAttribute("data-link") ||
    !!el.getAttribute("data-redirect")
  ) {
    return true;
  }

  // Any <a> with an external href is a CTA (includes checkout links)
  if (tag === "a" && isExternalUrl(href)) {
    return true;
  }

  // Elements with onclick handlers
  if (el.hasAttribute("onclick")) {
    return true;
  }

  return false;
}

/**
 * Finds all CTA-like elements on the page — language-agnostic.
 * Collects:
 *  - Any <a> with an external href (includes all checkout/payment links)
 *  - Any <a> with data-href/data-url/data-link/data-redirect attributes
 *  - Any button, role=button, submit/button/image input
 *  - Any element with onclick, data-href, data-url, data-link, data-redirect
 *  - Any <form> with an external action
 *
 * Checkout-domain links are prioritized and always included.
 */
export function findCtas(document: Document, baseUrl: string): CtaNode[] {
  const out: CtaNode[] = [];
  const seen = new Set<string>();

  const selector = [
    "a[href]",
    "a[data-href]",
    "a[data-url]",
    "a[data-link]",
    "a[data-redirect]",
    "button",
    "[role='button']",
    "input[type='submit']",
    "input[type='button']",
    "input[type='image']",
    "[data-href]",
    "[data-url]",
    "[data-link]",
    "[data-redirect]",
    "[onclick]",
    "form[action]",
  ].join(", ");

  document.querySelectorAll(selector).forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const text =
      tag === "input"
        ? collapseWhitespace(el.getAttribute("value") || el.getAttribute("aria-label"))
        : tag === "form"
          ? collapseWhitespace(el.getAttribute("aria-label") || el.getAttribute("data-cta-label") || "")
          : collapseWhitespace(el.textContent || el.getAttribute("aria-label"));

    // For forms, get the action URL
    const hrefRaw =
      tag === "form"
        ? el.getAttribute("action") || ""
        : el.getAttribute("href") ||
          el.getAttribute("data-href") ||
          el.getAttribute("data-url") ||
          el.getAttribute("data-link") ||
          el.getAttribute("data-redirect") ||
          "";
    const href = hrefRaw ? absolutize(baseUrl, hrefRaw) : "";

    // Skip internal anchor links (scroll-to-section)
    const rawTrimmed = (hrefRaw || "").trim().toLowerCase();
    if (rawTrimmed.startsWith("#") && rawTrimmed.length > 1) return;

    // Skip empty text + empty href (non-actionable elements)
    if (!text && !href) return;
    if (text && text.length > 120) return;

    if (!looksLikeCta(el) && !isCheckoutUrl(href)) return;

    const label = text || (isCheckoutUrl(href) ? "Checkout" : "CTA");
    const key = `${label.toLowerCase()}|${href}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ text: label, href, tag });
  });

  // Sort: checkout-domain CTAs first, then by text
  out.sort((a, b) => {
    const aCheckout = isCheckoutUrl(a.href) ? 0 : 1;
    const bCheckout = isCheckoutUrl(b.href) ? 0 : 1;
    return aCheckout - bCheckout;
  });

  return out.slice(0, 12);
}
