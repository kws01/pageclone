import type { ExtractedPage } from "@/parser/extractPage";

export type LanguageConfidence = "alta" | "media" | "baixa";

export interface DetectedLanguage {
  code: string;
  name: string;
  confidence: LanguageConfidence;
  source: string;
}

const LANG_NAMES: Record<string, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

const COMMON_WORDS: Record<string, string[]> = {
  pt: ["de", "que", "para", "com", "uma", "você", "sua", "são", "como", "mais", "mas", "seu", "tem", "sem", "não", "sou", "nos", "lhe", "pode", "esse", "foi", "ser", "aos", "pelo", "aqui"],
  en: ["the", "and", "for", "you", "your", "are", "with", "this", "that", "have", "from", "they", "will", "would", "there", "their", "what", "about", "which", "when", "make", "more", "than", "also", "been"],
  es: ["de", "que", "para", "con", "una", "por", "son", "como", "más", "pero", "sus", "tiene", "sin", "sobre", "este", "ser", "hay", "puede", "esto", "le", "lo", "las", "los", "ese", "esa"],
  fr: ["le", "la", "les", "des", "que", "pour", "vous", "votre", "sont", "avec", "ce", "cette", "dans", "sur", "plus", "mais", "nous", "notre", "leur", "son", "être", "avoir", "peut", "tout", "sans"],
  de: ["der", "die", "das", "und", "mit", "für", "sie", "ihr", "ist", "auf", "ein", "eine", "nicht", "auch", "sich", "wir", "nach", "von", "zu", "dem", "als", "bei", "hat", "können", "wird"],
  it: ["il", "la", "di", "che", "per", "con", "una", "sono", "come", "più", "ma", "suo", "anche", "questo", "quello", "suo", "nostro", "essere", "avere", "sul", "nel", "gli", "sia", "tutto", "senza"],
};

const SUPPORTED = ["pt", "en", "es", "fr", "de", "it"];

function normalizeLang(raw: string): string {
  const lower = raw.toLowerCase().trim();
  const primary = lower.split(/[-_]/)[0];
  return SUPPORTED.includes(primary) ? primary : lower.split(/[-_]/)[0];
}

function countWords(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const w of words) {
    const re = new RegExp(`\\b${w}\\b`, "g");
    const matches = lower.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

export function detectLanguage(rawHtml: string, page: ExtractedPage): DetectedLanguage {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");

  const htmlLang = doc.documentElement.getAttribute("lang") || "";
  const ogLocale = doc.querySelector('meta[property="og:locale"]')?.getAttribute("content") || "";
  const contentLang = doc.querySelector('meta[http-equiv="content-language"]')?.getAttribute("content") || "";

  let jsonLdLang = "";
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    if (jsonLdLang) return;
    try {
      const obj = JSON.parse(s.textContent || "");
      const lang = obj.inLanguage || obj.language || (Array.isArray(obj) ? obj[0]?.inLanguage : undefined);
      if (lang) jsonLdLang = lang;
    } catch { /* ignore */ }
  });

  const attrLang = normalizeLang(htmlLang || ogLocale || contentLang || jsonLdLang || "");

  const textBlob = [page.title, page.headline, page.subheadline, page.description, ...page.benefits, ...page.ctas.map((c) => c.text)].join(" ");

  const counts: Record<string, number> = {};
  for (const code of SUPPORTED) {
    counts[code] = countWords(textBlob, COMMON_WORDS[code]);
  }

  const sorted = SUPPORTED.slice().sort((a, b) => counts[b] - counts[a]);
  const topLang = sorted[0];
  const secondLang = sorted[1];
  const topCount = counts[topLang];
  const secondCount = counts[secondLang];

  const textStrong = topCount >= 8 && topCount >= secondCount * 2;

  let code: string;
  let source: string;
  let confidence: LanguageConfidence;

  if (textStrong) {
    code = topLang;
    source = "texto";
    confidence = attrLang === topLang ? "alta" : "media";
  } else if (attrLang && SUPPORTED.includes(attrLang)) {
    code = attrLang;
    source = htmlLang ? "html[lang]" : ogLocale ? "og:locale" : contentLang ? "content-language" : jsonLdLang ? "json-ld" : "atributo";
    confidence = topCount >= 3 ? "alta" : "media";
  } else if (topCount >= 3) {
    code = topLang;
    source = "texto";
    confidence = "media";
  } else {
    code = "pt";
    source = "padrão";
    confidence = "baixa";
  }

  return {
    code,
    name: LANG_NAMES[code] || code,
    confidence,
    source,
  };
}

export function detectTextLanguage(text: string): string | null {
  const counts = SUPPORTED
    .map((code) => ({ code, n: countWords(text, COMMON_WORDS[code]) }))
    .sort((a, b) => b.n - a.n);
  const [top, second] = counts;
  return top.n >= 6 && top.n >= second.n * 2 ? top.code : null;
}
