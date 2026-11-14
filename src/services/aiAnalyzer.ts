import type { ExtractedPage } from "@/parser/extractPage";

export interface AiKit {
  label: string;
  qty: number;
  perUnit: string;
  total: string;
  badge?: string;
  highlight?: boolean;
}

export interface AiComparison {
  us: string[];
  them: string[];
}

export interface AiFaqItem {
  q: string;
  a: string;
}

export interface AiReview {
  author: string;
  rating: number;
  title: string;
  text: string;
  location: string;
}

export interface AiAnalysis {
  productName: string;
  productType: string;
  unitSingular: string;
  unitPlural: string;
  headline: string;
  subheadline: string;
  benefits: string[];
  primaryProductImage: string;
  secondaryImages: string[];
  kits: AiKit[];
  guaranteeDays: string;
  uniqueMechanism: string;
  comparison: AiComparison;
  faq: AiFaqItem[];
  reviews: AiReview[];
  urgencyText: string;
}

// Modelo ativo na API v1 oficial do Google Gemini
const GEMINI_MODEL = "gemini-3.8-flash";

function getApiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
}

export function isAiConfigured(): boolean {
  return getApiKey().length > 0;
}

function buildPrompt(page: ExtractedPage): string {
  const imageUrls = page.images.slice(0, 15).map((img) => img.src);
  const textContent = [
    `Title: ${page.title}`,
    `Headline: ${page.headline}`,
    `Subheadline: ${page.subheadline}`,
    `Description: ${page.description}`,
    `Benefits: ${page.benefits.slice(0, 8).join(" | ")}`,
    `Testimonials: ${page.testimonials.slice(0, 4).join(" | ")}`,
    `CTAs: ${page.ctas.map((c) => c.text).join(" | ")}`,
    `Images list: ${imageUrls.join("\n")}`,
  ].join("\n");

  return `You are an expert Direct Response copywriter. Analyze the following product page data and extract/reconstruct clean data for a high-converting presell landing page.

Return ONLY a valid JSON object (no markdown, no code fences) with these fields:

{
  "productName": "The exact product name",
  "productType": "One of: pillow, gadget, supplement, cream, device, course, ebook, other",
  "unitSingular": "Singular unit name (e.g. Item, Pillow, Bottle, Tube, Pack)",
  "unitPlural": "Plural unit name (e.g. Items, Pillows, Bottles, Tubes, Packs)",
  "headline": "A highly persuasive Direct Response headline focused on the main pain point or mechanism. Max 90 chars.",
  "subheadline": "Supporting subheadline explaining the new discovery/solution. Max 150 chars.",
  "benefits": ["4 to 6 clear, specific product benefits"],
  "primaryProductImage": "Select the SINGLE BEST URL of the physical product from the images list. DO NOT choose credit card icons, payment logos, SSL badges, or guarantee seals.",
  "secondaryImages": ["2 to 4 additional product photos from the list, excluding the primary image"],
  "kits": [
    {"label": "Trial", "qty": 1, "perUnit": "$XX", "total": "$XX"},
    {"label": "Popular", "qty": 3, "perUnit": "$XX", "total": "$XX", "badge": "MOST POPULAR", "highlight": true},
    {"label": "Best Value", "qty": 6, "perUnit": "$XX", "total": "$XX", "badge": "BEST VALUE"}
  ],
  "guaranteeDays": "Exact guarantee days if mentioned (e.g. 30, 60, 90, 365) or '100% Risk-Free'",
  "uniqueMechanism": "2-sentence explanation of the unique mechanism behind the product (why it works better than conventional alternatives).",
  "comparison": {
    "us": ["3 strong points of this product"],
    "them": ["3 weaknesses of common market alternatives"]
  },
  "faq": [
    {"q": "Objection 1 about how to use or who it's for?", "a": "High-value objection-overcoming answer."},
    {"q": "Objection 2 about results or time to see effects?", "a": "High-value objection-overcoming answer."},
    {"q": "Objection 3 about safety or side effects?", "a": "High-value objection-overcoming answer."},
    {"q": "Objection 4 about shipping time or guarantee?", "a": "High-value trust-building answer."},
    {"q": "Objection 5 about price or value?", "a": "High-value objection-overcoming answer."}
  ],
  "reviews": [
    {
      "author": "Buyer name (e.g. Sarah M.)",
      "rating": 5,
      "title": "Short testimonial headline",
      "text": "Testimonial focused on the benefit and pain point resolved by the product.",
      "location": "Verified Customer - USA"
    }
  ],
  "urgencyText": "Scarcity/urgency phrase (e.g. Due to high demand, stock is extremely limited today)."
}

Rules:
- All generated text (faq, reviews, urgencyText, headline, subheadline, benefits, uniqueMechanism, comparison) MUST be in native English.
- Respect the page's original currency for prices.
- Generate 4 to 6 reviews with realistic buyer names, 5-star ratings, and benefit-focused testimonials.
- Respect the page's original language and currency for prices and text.
- Do NOT classify non-supplements as bottles. If it's a pillow, unitSingular is 'Pillow' and unitPlural is 'Pillows'.
- FILTER OUT payment badge icons (Mastercard, Visa, Paypal) and trust seals from 'primaryProductImage'. Pick ONLY photos showing the actual product.
- Return ONLY the JSON object.

Page Data:
${textContent}`;
}

function extractJson(text: string): unknown {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}

function normalizeAnalysis(raw: unknown, page: ExtractedPage): AiAnalysis {
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v.trim() : fallback;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => String(x).trim()) : [];

  const productName = str(r.productName, page.title);
  const unitSingular = str(r.unitSingular, "Unit");
  const unitPlural = str(r.unitPlural, "Units");

  const allImages = page.images.map((i) => i.src);
  const primaryProductImage = str(r.primaryProductImage, allImages[0] || "");
  const secondaryImages = arr(r.secondaryImages).filter((u) => u !== primaryProductImage);

  const rawKits = Array.isArray(r.kits) ? r.kits : [];
  const kits: AiKit[] = rawKits.slice(0, 3).map((k, i) => {
    const kObj = k as Record<string, unknown>;
    return {
      label: str(kObj.label, ["Trial", "Popular", "Best Value"][i] || "Kit"),
      qty: typeof kObj.qty === "number" ? kObj.qty : [1, 3, 6][i] || 1,
      perUnit: str(kObj.perUnit, "$59"),
      total: str(kObj.total, "$59"),
      badge: str(kObj.badge, undefined),
      highlight: !!kObj.highlight,
    };
  });

  if (kits.length === 0) {
    kits.push(
      { label: "Trial", qty: 1, perUnit: "$59", total: "$59" },
      { label: "Popular", qty: 3, perUnit: "$49", total: "$147", badge: "MOST POPULAR", highlight: true },
      { label: "Best Value", qty: 6, perUnit: "$39", total: "$234", badge: "BEST VALUE" },
    );
  }

  const rawComparison = r.comparison as Record<string, unknown> | undefined;
  const comparison: AiComparison = {
    us: rawComparison ? arr(rawComparison.us) : [],
    them: rawComparison ? arr(rawComparison.them) : [],
  };

  const rawFaq = Array.isArray(r.faq) ? r.faq : [];
  const faq: AiFaqItem[] = rawFaq.slice(0, 5).map((f) => {
    const fObj = f as Record<string, unknown>;
    return {
      q: str(fObj.q, ""),
      a: str(fObj.a, ""),
    };
  }).filter((f) => f.q && f.a);

  const rawReviews = Array.isArray(r.reviews) ? r.reviews : [];
  const reviews: AiReview[] = rawReviews.slice(0, 6).map((rv) => {
    const rvObj = rv as Record<string, unknown>;
    return {
      author: str(rvObj.author, "Verified Customer"),
      rating: typeof rvObj.rating === "number" ? rvObj.rating : 5,
      title: str(rvObj.title, ""),
      text: str(rvObj.text, ""),
      location: str(rvObj.location, "Verified Customer"),
    };
  }).filter((rv) => rv.text);

  return {
    productName,
    productType: str(r.productType, "other"),
    unitSingular,
    unitPlural,
    headline: str(r.headline, page.headline || page.title),
    subheadline: str(r.subheadline, page.subheadline || page.description),
    benefits: arr(r.benefits).length >= 2 ? arr(r.benefits) : page.benefits.slice(0, 6),
    primaryProductImage,
    secondaryImages,
    kits,
    guaranteeDays: str(r.guaranteeDays, page.guaranteeDays || "100% Risk-Free"),
    uniqueMechanism: str(r.uniqueMechanism, ""),
    comparison,
    faq,
    reviews,
    urgencyText: str(r.urgencyText, ""),
  };
}

export async function analyzePageContent(page: ExtractedPage): Promise<AiAnalysis> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Chave VITE_GEMINI_API_KEY não configurada no arquivo .env");
  }

  const prompt = buildPrompt(page);
  const body = JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  });

  let lastError = "";
  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      console.warn(`Gemini API retornou ${res.status}:`, errText);
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ||
      "";

    if (!text) {
      throw new Error("Resposta vazia do modelo Gemini");
    }

    const parsed = extractJson(text);
    return normalizeAnalysis(parsed, page);
  } catch (err) {
    lastError = err instanceof Error ? err.message : "Erro de conexão com Gemini API";
  }

  throw new Error(lastError || "Falha ao analisar a página com a API do Gemini.");
}
