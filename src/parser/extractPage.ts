import { parseHtmlDocument, type ParsedHtml } from "@/parser/htmlParser";
import { isTrackerUrl, type RemovedTracker } from "@/cleaner/trackers";
import { absolutize } from "@/utils/url";

export interface ImageCandidate {
  id: string;
  src: string;
  alt: string;
  section: string;
  heading: string;
  nearbyText: string;
  urlFrequency: number;
  docIndex: number;
  w?: number;
  h?: number;
  score?: number;
}

export interface GuaranteeFact {
  days: number | null;
  evidence: string;
  conflict?: boolean;
}

export interface OfferFact {
  qty: number;
  total: string | null;
  perUnit: string | null;
  currency: string | null;
  discount: string | null;
  evidence: string;
}

export interface RatingFact {
  score: string;
  evidence: string;
}

export interface TestimonialFact {
  name: string;
  location: string;
  text: string;
}

export interface PageFacts {
  guarantee: GuaranteeFact | null;
  offers: OfferFact[];
  rating: RatingFact | null;
  testimonials: TestimonialFact[];
  unitSingular: string;
  unitPlural: string;
}

export interface ExtractedPage {
  url: string;
  title: string;
  headline: string;
  subheadline: string;
  description: string;
  images: { src: string; alt: string }[];
  imageCandidates: ImageCandidate[];
  videos: string[];
  ctas: { text: string; href: string }[];
  benefits: string[];
  testimonials: string[];
  colors: string[];
  rawHtml: string;
  cleanedHtml: string;
  removedTrackers?: RemovedTracker[];
  guaranteeDays?: string;
  guaranteeText?: string;
  mediaLogos: string[];
  logoImage?: string;
  heroImage?: string;
  facts: PageFacts;
}

const LOGO_REGEX = /(^|[/_.-])(logo|wordmark|logotype|favicon)([/_.-]|$)/i;
const NON_CONTENT_REGEX = /(flags?|countr(y|ies)|lang(uage)?s?|locale|bandeira|payment|visa|mastercard|paypal|social)/i;
const ANCESTOR_NON_CONTENT = /^(nav|footer|select)$/i;
const ANCESTOR_CLASS_NON_CONTENT = /(lang|locale)/i;
const DECORATIVE_FILE_RE = /(^|[/_.-])(step|num|number|bullet|divider|shape|bg|background|pattern|texture|arrow|check)([/_.-]|$)/i;
const SHORT_NUMBER_FILE_RE = /\/\d{1,2}\.(png|jpe?g|webp|gif|svg)$/i;

function isDecorativeFilename(src: string): boolean {
  const lower = src.toLowerCase().split("?")[0].split("#")[0];
  if (SHORT_NUMBER_FILE_RE.test(lower)) return true;
  if (DECORATIVE_FILE_RE.test(lower)) return true;
  return false;
}

function isExtremeAspectRatio(w?: number, h?: number): boolean {
  if (!w || !h) return false;
  const ratio = w / h;
  return ratio > 4 || ratio < 0.25;
}

export function isNonContentImage(
  src: string,
  alt: string,
  el?: Element | null,
): boolean {
  const combined = `${src} ${alt}`.toLowerCase();
  if (NON_CONTENT_REGEX.test(combined)) return true;
  if (!el) return false;
  let node: Element | null = el.parentElement;
  while (node && node.tagName.toLowerCase() !== "body") {
    const tag = node.tagName.toLowerCase();
    if (ANCESTOR_NON_CONTENT.test(tag)) return true;
    const cls = node.getAttribute("class") || "";
    const id = node.getAttribute("id") || "";
    if (ANCESTOR_CLASS_NON_CONTENT.test(cls) || ANCESTOR_CLASS_NON_CONTENT.test(id)) return true;
    node = node.parentElement;
  }
  return false;
}

function getClosestHeading(el: Element, maxChars = 80): string {
  let node: Element | null = el.parentElement;
  let attempts = 0;
  while (node && attempts < 6) {
    const heading = node.querySelector("h1, h2, h3, h4");
    if (heading) {
      const t = (heading.textContent || "").replace(/\s+/g, " ").trim();
      return t.slice(0, maxChars);
    }
    node = node.parentElement;
    attempts++;
  }
  return "";
}

function getNearbyText(el: Element, maxChars = 150): string {
  const parent = el.parentElement;
  if (!parent) return "";
  const t = (parent.textContent || "").replace(/\s+/g, " ").trim();
  return t.slice(0, maxChars);
}

function getAncestorSection(el: Element): string {
  let node: Element | null = el.parentElement;
  while (node && node.tagName.toLowerCase() !== "body") {
    const tag = node.tagName.toLowerCase();
    if (["header", "main", "section", "footer", "article"].includes(tag)) {
      return tag;
    }
    node = node.parentElement;
  }
  return "body";
}

function pickLargestSrcset(srcset: string): string | null {
  const items = srcset.split(",").map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) return null;
  let best: { url: string; w: number } | null = null;
  for (const item of items) {
    const parts = item.split(/\s+/);
    const url = parts[0];
    const wStr = parts.find((p) => p.endsWith("w"));
    const w = wStr ? parseInt(wStr, 10) : 0;
    if (!best || w > best.w) best = { url, w };
  }
  return best?.url || items[0].split(/\s+/)[0] || null;
}

function cleanUrlForDedupe(src: string): string {
  return src.split("?")[0].split("#")[0].replace(/\/+$/, "");
}

export function extractFromHtml(
  html: string,
  baseUrl: string,
  parsed: ParsedHtml = parseHtmlDocument(html, baseUrl),
): ExtractedPage {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const description =
    doc.querySelector('meta[name="description"]')?.getAttribute("content") ??
    doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    "";

  const rawCandidates: ImageCandidate[] = [];
  const mediaLogos: string[] = [];
  let logoImage: string | undefined;
  const urlFrequency = new Map<string, number>();
  let docIndex = 0;

  const imgEls = Array.from(doc.querySelectorAll("img"));
  for (const img of imgEls) {
    const lazySrc =
      img.getAttribute("data-src") ||
      img.getAttribute("data-original") ||
      img.getAttribute("data-lazy-src") ||
      "";
    const srcset = img.getAttribute("srcset") || "";
    let src = img.getAttribute("src") || "";

    if (lazySrc && (!src || src.includes("placeholder") || src.includes("blank") || src.startsWith("data:"))) {
      src = lazySrc;
    }
    if (srcset) {
      const largest = pickLargestSrcset(srcset);
      if (largest) src = largest;
    }
    if (!src && srcset) {
      src = srcset.split(",")[0]?.trim().split(/\s+/)[0] || "";
    }
    if (!src) continue;

    const abs = absolutize(baseUrl, src);
    if (abs.startsWith("data:") || isTrackerUrl(abs) || /1x1|pixel/i.test(abs)) continue;
    const alt = img.getAttribute("alt") ?? "";

    if (isNonContentImage(abs, alt, img)) continue;

    if (isDecorativeFilename(abs)) continue;

    const wAttr = img.getAttribute("width");
    const hAttr = img.getAttribute("height");
    if (wAttr && hAttr) {
      const wi = parseInt(wAttr, 10);
      const hi = parseInt(hAttr, 10);
      if (isExtremeAspectRatio(wi, hi)) continue;
    }

    if (isMediaLogo(abs, alt)) {
      mediaLogos.push(abs);
      continue;
    }

    if (!logoImage && isBrandLogo(abs, alt, img, parsed.title)) {
      logoImage = abs;
      continue;
    }

    const dedupeKey = cleanUrlForDedupe(abs);
    urlFrequency.set(dedupeKey, (urlFrequency.get(dedupeKey) || 0) + 1);
    if (urlFrequency.get(dedupeKey)! > 1) continue;

    if (isInvalidProductImage(abs, alt, img)) continue;

    const section = getAncestorSection(img);
    const heading = getClosestHeading(img);
    const nearbyText = getNearbyText(img);

    rawCandidates.push({
      id: `img_${rawCandidates.length + 1}`,
      src: abs,
      alt,
      section,
      heading,
      nearbyText,
      urlFrequency: 1,
      docIndex: docIndex++,
    });
  }

  urlFrequency.clear();
  for (const c of rawCandidates) {
    const k = cleanUrlForDedupe(c.src);
    urlFrequency.set(k, (urlFrequency.get(k) || 0) + 1);
  }
  for (const c of rawCandidates) {
    c.urlFrequency = urlFrequency.get(cleanUrlForDedupe(c.src)) || 1;
  }

  const images = rawCandidates.map((c) => ({ src: c.src, alt: c.alt }));

  const videos: string[] = [];
  doc.querySelectorAll("video source, video, iframe").forEach((el) => {
    const src = el.getAttribute("src");
    if (!src) return;
    if (/youtube|vimeo|wistia|vturb|player|\.mp4/i.test(src)) {
      videos.push(absolutize(baseUrl, src));
    }
  });

  const benefits: string[] = [];
  doc.querySelectorAll("ul li, ol li").forEach((li) => {
    const t = (li.textContent || "").replace(/\s+/g, " ").trim();
    if (t.length > 10 && t.length < 220) benefits.push(t);
  });

  const testimonials: string[] = [];
  doc
    .querySelectorAll(
      "[class*='testimonial' i], [class*='depoiment' i], [class*='review' i], blockquote",
    )
    .forEach((el) => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (t.length > 30 && t.length < 600) testimonials.push(t);
    });

  const fullText = doc.body?.textContent || "";
  const facts = extractFacts(doc, fullText, parsed.title);
  const guaranteeDays = facts.guarantee?.days ? String(facts.guarantee.days) : undefined;
  const guaranteeText = facts.guarantee?.evidence || undefined;

  const colorSet = new Set<string>();
  doc.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") || "";
    const matches = style.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
    matches?.forEach((c) => colorSet.add(c));
  });

  const candidates = rawCandidates.slice(0, 24);

  return {
    url: parsed.url,
    title: parsed.title,
    headline: parsed.headline,
    subheadline: parsed.subheadline || description,
    description,
    images: dedupeBy(images, (i) => i.src).slice(0, 24),
    imageCandidates: candidates,
    videos: Array.from(new Set(videos)).slice(0, 6),
    ctas: parsed.ctas.map(({ text, href }) => ({ text, href })),
    benefits: Array.from(new Set(benefits)).slice(0, 12),
    testimonials: Array.from(new Set(testimonials)).slice(0, 6),
    colors: Array.from(colorSet).slice(0, 8),
    rawHtml: html,
    cleanedHtml: parsed.cleanedHtml,
    removedTrackers: parsed.removedTrackers,
    guaranteeDays,
    guaranteeText,
    mediaLogos: Array.from(new Set(mediaLogos)).slice(0, 6),
    logoImage,
    heroImage: candidates[0]?.src,
    facts,
  };
}

function extractFacts(doc: Document, fullText: string, productName: string): PageFacts {
  return {
    guarantee: extractGuaranteeFact(fullText),
    offers: extractOffers(doc, fullText),
    rating: extractRating(fullText),
    testimonials: extractRealTestimonials(doc),
    unitSingular: detectUnit(doc, fullText, productName),
    unitPlural: detectUnitPlural(doc, fullText, productName),
  };
}

const GUARANTEE_CONTEXT = /(guarantee|garantia|money[ -]?back|reembolso|refund|risk[ -]?free)/i;
const GUARANTEE_DAYS_RE = /(\d{2,3})\s*[- ]?(?:day|dias|dia)s?/gi;

function extractGuaranteeFact(text: string): GuaranteeFact | null {
  const sentences = text.split(/[.!?\n]/).filter((s) => s.trim().length > 0);
  const matches: { days: number; evidence: string }[] = [];
  for (const s of sentences) {
    const trimmed = s.trim();
    if (!GUARANTEE_CONTEXT.test(trimmed)) continue;
    let m: RegExpExecArray | null;
    GUARANTEE_DAYS_RE.lastIndex = 0;
    while ((m = GUARANTEE_DAYS_RE.exec(trimmed)) !== null) {
      const n = parseInt(m[1], 10);
      if (n >= 7 && n <= 365) {
        matches.push({ days: n, evidence: trimmed.slice(0, 160) });
      }
    }
  }
  if (matches.length === 0) return null;
  const freq = new Map<number, number>();
  for (const m of matches) freq.set(m.days, (freq.get(m.days) || 0) + 1);
  let bestDays = matches[0].days;
  let bestCount = 0;
  for (const [days, count] of freq) {
    if (count > bestCount) { bestDays = days; bestCount = count; }
  }
  const bestMatch = matches.find((m) => m.days === bestDays)!;
  return {
    days: bestDays,
    evidence: bestMatch.evidence,
    conflict: freq.size > 1,
  };
}

const CURRENCY_RE = /(R\$|US\$|\$|€|£)\s*(\d[\d.,]*)/g;
const UNIT_KEYWORDS = /\b(\d+)\s*(bottle|pillow|kit|pack|unit|unidade|frasco|supply|jar|tube|box|bag|capsule|sachet)\b/gi;

function extractOffers(doc: Document, fullText: string): OfferFact[] {
  const offers: OfferFact[] = [];
  const seen = new Set<string>();

  const textChunks: string[] = [];
  doc.querySelectorAll("li, p, div, span, td, h1, h2, h3, h4, h5, h6").forEach((el) => {
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (t.length > 5 && t.length < 300) textChunks.push(t);
  });

  for (const chunk of textChunks) {
    let m: RegExpExecArray | null;
    CURRENCY_RE.lastIndex = 0;
    UNIT_KEYWORDS.lastIndex = 0;
    const unitMatch = UNIT_KEYWORDS.exec(chunk);
    const priceMatch = CURRENCY_RE.exec(chunk);
    if (!unitMatch || !priceMatch) continue;

    const qty = parseInt(unitMatch[1], 10);
    if (qty < 1 || qty > 100) continue;
    const currency = priceMatch[1].replace(/\s/g, "");
    const total = `${currency} ${priceMatch[2]}`;
    const perUnit = qty > 0 ? `${currency} ${(parseFloat(priceMatch[2].replace(/[,.]/g, "")) / qty).toFixed(2)}` : null;

    const discountMatch = chunk.match(/(\d{1,2})\s*%\s*(?:off|desconto|discount|save)/i) ||
      chunk.match(/save\s*(\d{1,2})\s*%/i);
    const discount = discountMatch ? `${discountMatch[1]}% off` : null;

    const key = `${qty}-${total}`;
    if (seen.has(key)) continue;
    seen.add(key);

    offers.push({
      qty,
      total,
      perUnit,
      currency,
      discount,
      evidence: chunk.slice(0, 160),
    });
    if (offers.length >= 4) break;
  }

  return offers;
}

const RATING_RE = /(\d(?:\.\d)?)\s*(?:\/\s*5|out\s+of\s+5|de\s+5)/i;

function extractRating(text: string): RatingFact | null {
  const m = text.match(RATING_RE);
  if (!m) return null;
  const score = m[1];
  const n = parseFloat(score);
  if (n < 1 || n > 5) return null;
  const start = Math.max(0, m.index! - 40);
  const end = Math.min(text.length, m.index! + m[0].length + 40);
  const evidence = text.slice(start, end).trim();
  return { score, evidence };
}

function extractRealTestimonials(doc: Document): TestimonialFact[] {
  const out: TestimonialFact[] = [];
  const seen = new Set<string>();
  doc.querySelectorAll(
    "[class*='testimonial' i], [class*='depoiment' i], [class*='review' i], blockquote",
  ).forEach((el) => {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length < 20 || text.length > 600) return;

    let name = "";
    let location = "";
    const nameEl = el.querySelector("[class*='name' i], [class*='author' i], .author, .reviewer, cite, strong, b");
    if (nameEl) {
      name = (nameEl.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
    }
    const locEl = el.querySelector("[class*='location' i], [class*='city' i], [class*='country' i], [class*='state' i]");
    if (locEl) {
      location = (locEl.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
    }
    if (!name) {
      const authorMatch = text.match(/^([A-Z][a-z]+ [A-Z]\.?\s*[A-Za-z.]+|—\s*(.+?))[,·]/);
      if (authorMatch) name = authorMatch[1].replace(/^[—-]\s*/, "").trim().slice(0, 60);
    }
    const bodyText = name ? text.replace(name, "").replace(location, "").trim() : text;
    if (bodyText.length < 20) return;
    const key = bodyText.slice(0, 80);
    if (seen.has(key)) return;
    seen.add(key);

    out.push({ name: name || "Customer", location, text: bodyText.slice(0, 300) });
    if (out.length >= 6) return;
  });
  return out;
}

const UNIT_SINGULAR_RE = /\b(bottle|pillow|kit|pack|unit|unidade|frasco|jar|tube|box|bag|capsule|sachet)\b/gi;

function detectUnit(doc: Document, text: string, productName: string): string {
  const pm = productName.match(/bottle|pillow|kit|pack|supplement|capsule|cream|serum|device|gadget/i);
  if (pm) return pm[0];
  let m: RegExpExecArray | null;
  UNIT_SINGULAR_RE.lastIndex = 0;
  m = UNIT_SINGULAR_RE.exec(text);
  if (m) return m[1];
  return "unit";
}

function detectUnitPlural(doc: Document, text: string, productName: string): string {
  const sg = detectUnit(doc, text, productName);
  const irreg: Record<string, string> = {
    unidade: "unidades",
    frasco: "frascos",
  };
  if (irreg[sg.toLowerCase()]) return irreg[sg.toLowerCase()];
  if (sg.endsWith("y")) return sg.slice(0, -1) + "ies";
  return sg + "s";
}

function detectGuaranteeDays(text: string): string | undefined {
  const patterns = [
    /([0-9]{2,3})\s*[- ]?(?:day|dias|dia)s?\s*(?:money[ -]?back|guarantee|guaranty|garantia|reembolso|reembols)/i,
    /(?:money[ -]?back|guarantee|guaranty|garantia)\s*(?:de|of)?\s*([0-9]{2,3})\s*(?:day|dias|dia)s?/i,
    /([0-9]{2,3})\s*[- ]?(?:day|dias|dia)s?\s*(?:warranty|reembolso|risco|risk)/i,
    /\b([0-9]{2,3})\s*(?:day|dias|dia)s?\s*(?:guarantee|garantia|reembolso|money[ -]?back)\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const n = parseInt(m[1], 10);
      if (n >= 7 && n <= 365) return String(n);
    }
  }
  return undefined;
}

function detectGuaranteeText(text: string): string | undefined {
  const patterns = [
    /((?:[0-9]{2,3})[- ]?(?:day|dias|dia)s?\s*(?:money[ -]?back|guarantee|guaranty|garantia|reembolso|risk[- ]?free(?:\s+trial)?)(?:\s+guarantee)?)/i,
    /((?:money[ -]?back|satisfaction)\s+guarantee(?:[^.]{0,60})?)/i,
    /((?:[0-9]{2,3})[- ]?(?:day|dias|dia)s?\s+(?:risk[- ]?free|no[- ]?risk)\s+trial)/i,
    /((?:garantia|reembolso)\s+(?:de\s+)?(?:[0-9]{2,3})\s*(?:dias|day)s?(?:[^.]{0,60})?)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const t = m[1].trim();
      if (t.length >= 5 && t.length <= 120) return t;
    }
  }
  return undefined;
}

export function isMediaLogo(src: string, alt: string): boolean {
  const combined = `${src} ${alt}`.toLowerCase();
  return MEDIA_LOGOS.test(combined);
}

const LOGO_KEYWORDS = [
  "logo", "brand", "header-logo", "site-logo",
  "payment", "visa", "mastercard", "paypal", "trust-seal",
];

export function isLogoUrl(url: string, brandName?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  const brandLower = brandName?.toLowerCase().trim();

  if (LOGO_REGEX.test(lower)) return true;
  if (LOGO_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  if (brandLower && brandLower.length > 2 && lower.includes(brandLower) && LOGO_REGEX.test(lower)) return true;

  return false;
}

const LOGO_ALT = /\b(logo|brand|company)\b/i;

export function isBrandLogo(
  src: string,
  alt: string,
  imgEl?: Element | null,
  brandName?: string,
): boolean {
  if (!imgEl) return false;

  if (!LOGO_REGEX.test(src) && !LOGO_ALT.test(alt.toLowerCase()) && !LOGO_REGEX.test(imgEl.getAttribute("class") || "")) {
    return false;
  }

  const isInHeader = imgEl.closest("header") !== null;
  const isInHomeLink = (() => {
    const a = imgEl.closest("a");
    if (!a) return false;
    const href = a.getAttribute("href") || "";
    return href === "/" || href === "" || /\/(home|index)\.html?$/i.test(href) || a.href === window.location.origin + "/";
  })();
  const altMatchesBrand = !!brandName && alt.toLowerCase().includes(brandName.toLowerCase());

  if (!isInHeader && !isInHomeLink && !altMatchesBrand) return false;

  const w = imgEl.getAttribute("width");
  const h = imgEl.getAttribute("height");
  if (w && h) {
    const wi = parseInt(w), hi = parseInt(h);
    if (wi < 30 || hi < 15) return false;
    if (wi / hi > 12) return false;
  }

  return true;
}

export function isProductPhoto(src: string, alt: string): boolean {
  if (isBrandLogo(src, alt)) return false;
  if (isMediaLogo(src, alt)) return false;
  if (isInvalidProductImage(src, alt)) return false;
  return true;
}

const UNSPLASH_FALLBACKS: Record<string, string> = {
  sleep: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1000&q=80",
  pillow: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80",
  cognition: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1000&q=80",
  memory: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1000&q=80",
  focus: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1000&q=80",
  health: "https://images.unsplash.com/photo-1506126613408-eca97ce269d9?auto=format&fit=crop&w=1000&q=80",
  wellness: "https://images.unsplash.com/photo-1506126613408-eca97ce269d9?auto=format&fit=crop&w=1000&q=80",
  beauty: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80",
  skincare: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80",
  fitness: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80",
  weight: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=80",
  nutrition: "https://images.unsplash.com/photo-1490645935967-10de6d17062e?auto=format&fit=crop&w=1000&q=80",
  finance: "https://images.unsplash.com/photo-1554224155-6726b0ff8d6e?auto=format&fit=crop&w=1000&q=80",
  relationships: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1000&q=80",
};

export function getUnsplashFallback(niche: string): string {
  const key = niche.toLowerCase().trim();
  for (const [k, v] of Object.entries(UNSPLASH_FALLBACKS)) {
    if (key.includes(k)) return v;
  }
  return "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80";
}

function dedupeBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

const FLAG_KEYWORDS = /\b(brazil|brasil|bandeira|flag|country|patria)\b/i;
const MEDIA_LOGOS = /\b(nbc|usa.?today|fox|cnn|forbes|abc|cbs|nbc|reuters|bloomberg|wall.?street|ny.?times|washington.?post)\b/i;
const SOCIAL_ICONS = /\b(facebook|instagram|twitter|x\.com|youtube|tiktok|linkedin|whatsapp|telegram|pinterest|snapchat|reddit|vimeo)\b/i;
const CARD_BADGES = /\b(visa|mastercard|amex|american.?express|elo|hipercard|paypal|pix|boleto|stripe|mastercard|maestro)\b/i;
const ICON_BADGE = /\b(icon|badge|seal|stamp|logo|brand|footer|trust|secure|verified|certif|award|shield|lock|checkmark)\b/i;
const SMALL_SIZE = /[-_](\d{1,3})x(\d{1,3})\b/;
const TINY_DIMS = /\b(\d{1,2})x(\d{1,2})\b/;

export function isInvalidProductImage(src: string, alt: string, imgEl?: Element | null): boolean {
  const combined = `${src} ${alt}`.toLowerCase();

  if (FLAG_KEYWORDS.test(combined)) return true;
  if (MEDIA_LOGOS.test(combined)) return true;
  if (SOCIAL_ICONS.test(combined)) return true;
  if (CARD_BADGES.test(combined)) return true;

  if (ICON_BADGE.test(combined)) {
    const w = imgEl?.getAttribute("width");
    const h = imgEl?.getAttribute("height");
    if (w && h && (parseInt(w) < 80 || parseInt(h) < 80)) return true;
    const sizeMatch = src.match(SMALL_SIZE);
    if (sizeMatch && (parseInt(sizeMatch[1]) < 80 || parseInt(sizeMatch[2]) < 80)) return true;
    if (TINY_DIMS.test(src)) return true;
    return true;
  }

  const w = imgEl?.getAttribute("width");
  const h = imgEl?.getAttribute("height");
  if (w && h && (parseInt(w) < 50 || parseInt(h) < 50)) return true;

  const sizeMatch = src.match(SMALL_SIZE);
  if (sizeMatch && (parseInt(sizeMatch[1]) < 50 || parseInt(sizeMatch[2]) < 50)) return true;

  return false;
}

export function filterProductImages(
  images: { src: string; alt: string }[],
  brandName?: string,
  fallbackNiche?: string,
): { src: string; alt: string }[] {
  const filtered = images.filter((img) => {
    if (isLogoUrl(img.src, brandName)) return false;
    return !isInvalidProductImage(img.src, img.alt);
  });
  if (filtered.length === 0) {
    const fallback = getUnsplashFallback(fallbackNiche || "wellness");
    return [{ src: fallback, alt: "Product image" }];
  }
  return filtered;
}

export function filterProductImageUrls(
  urls: string[],
  brandName?: string,
  fallbackNiche?: string,
): string[] {
  const cleaned = urls.filter((url) => url && !isLogoUrl(url, brandName));
  if (cleaned.length === 0) {
    return [getUnsplashFallback(fallbackNiche || "wellness")];
  }
  return cleaned;
}

export type ImageClass = "lifestyle" | "product" | "infographic" | "unknown";

const PRODUCT_HINTS = [
  "product", "pack", "package", "item", "bottle", "jar", "pillow", "pill",
  "supplement", "device", "gadget", "kit", "unit", "shot", "hero-product",
];
const INFOGRAPHIC_HINTS = [
  "diagram", "anatomy", "spine", "chart", "infographic", "schematic",
  "how-it-works", "guide", "blueprint", "scheme", "label", "fact-sheet",
];
const LIFESTYLE_HINTS = [
  "lifestyle", "person", "people", "model", "woman", "man", "user",
  "bed", "room", "scene", "ambient", "happy", "smile", "portrait",
  "using", "action", "demo",
];

export function classifyImage(src: string, alt = ""): ImageClass {
  const combined = `${src} ${alt}`.toLowerCase();
  if (INFOGRAPHIC_HINTS.some((kw) => combined.includes(kw))) return "infographic";
  if (LIFESTYLE_HINTS.some((kw) => combined.includes(kw))) return "lifestyle";
  if (PRODUCT_HINTS.some((kw) => combined.includes(kw))) return "product";
  return "unknown";
}

export function scoreImageCandidate(c: ImageCandidate): number {
  let score = 0;
  const area = (c.w || 0) * (c.h || 0);
  if (area > 0) score += Math.min(area / 50000, 10);
  const ctx = `${c.alt} ${c.heading} ${c.nearbyText}`.toLowerCase();
  if (/(preco|price|buy|comprar|cta|add.to.cart|order|shop)/i.test(ctx)) score += 5;
  if (c.urlFrequency >= 2) score += 3;
  if (c.section === "header" || c.section === "footer") score -= 5;
  if ((c.w || 0) > 0 && (c.h || 0) > 0) {
    const ratio = c.w! / c.h!;
    if (ratio > 3.5) score -= 4;
    if (c.w! < 200 || c.h! < 200) score -= 6;
  }
  return score;
}
