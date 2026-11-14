import { detectTextLanguage } from "@/services/detectLanguage";
import { callGeminiJson, isGeminiConfigured } from "@/services/geminiClient";
import { THEMES } from "@/config/themes";
import {
  HYBRID_NICHES,
  HYBRID_STAGE_IDS,
  type HybridGuideData,
  type HybridImage,
  type HybridNiche,
  type HybridStageId,
} from "@/types/hybridGuide";

export interface HybridGuideInput {
  offerUrl: string;
  ctaUrl: string;
  strategicAngle: string;
  niche?: HybridNiche;
  productContext?: string;
  detectedLanguage?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  pt: "português",
  en: "inglês",
  es: "espanhol",
  fr: "francês",
  de: "alemão",
  it: "italiano",
};


function buildHybridPrompt(input: HybridGuideInput): string {
  const langCode = input.detectedLanguage || "pt";
  const lang = LANGUAGE_NAMES[langCode] || langCode;
  const nicheRule = input.niche
    ? `Nicho definido: "${input.niche}".`
    : `Identifique o nicho entre: ${HYBRID_NICHES.join(", ")}.`;
  const context = input.productContext?.trim()
    ? `\nFATOS DA PÁGINA (única fonte):\n${input.productContext.trim().slice(0, 4000)}`
    : "\nSem contexto extraído. Não invente fatos.";

  return `Estrategista de direct response. Gere guia híbrido em ${lang}.

REGRAS:
- Use só os fatos fornecidos. Campos sem dados = "" ou [].
- Não invente depoimentos, números, preços, prazos, bônus, estudos.
- Sem diagnóstico médico, promessa de cura, escassez ou urgência falsa.
- Divulgação de afiliado obrigatória no finalCta.
- Quiz: perguntas neutras sobre contexto do visitante.
- Tudo em ${lang}. ${nicheRule}
- Responda SÓ JSON válido.

JSON:
{"niche":"beauty|health|finance|relationship","cover":{"headline":"max90","subheadline":"max160","buttonText":"max30","mainImageAlt":"","mainImagePrompt":""},"educationalCards":[{"title":"max60","body":"2-3 frases","practicalExample":"","imageAlt":"","imagePrompt":""}],"quiz":[{"question":"max80","options":["","",""],"progressLabel":""}],"transition":{"title":"","body":""},"preOffer":[{"title":"","transitionContent":"","imageAlt":"","imagePrompt":""}],"solution":{"productName":"","realBenefits":[""],"confirmedDifferentials":[""]},"finalCta":{"transitionText":"","buttonText":"max35","productImageAlt":"","productImagePrompt":""},"visualSpec":[{"stage":"","visualConcept":"","imagePrompt":""}]}

QTD: educationalCards 2-4; quiz 3-5 (3-4 opções); preOffer 1-2; visualSpec uma por etapa.

OFERTA:
URL: ${input.offerUrl || "não informada"}
CTA: ${input.ctaUrl || "não informada"}
Ângulo: ${input.strategicAngle}${context}`;
}

type Raw = Record<string, unknown>;

const obj = (v: unknown): Raw => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : {});
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strList = (v: unknown): string[] => list(v).map(str).filter(Boolean);

function isNiche(v: string): v is HybridNiche {
  return (HYBRID_NICHES as readonly string[]).includes(v);
}

function makeImage(prompt: string, alt: string): HybridImage {
  return { url: null, alt, imagePrompt: prompt };
}

function normalizeGuide(raw: unknown, input: HybridGuideInput): HybridGuideData {
  const r = obj(raw);
  const niche = input.niche ?? (isNiche(str(r.niche)) ? (str(r.niche) as HybridNiche) : null);
  if (!niche) throw new Error("A IA não identificou o nicho da oferta. Tente novamente.");

  const cover = obj(r.cover);
  const headline = str(cover.headline);
  if (!headline) throw new Error("A IA retornou um guia incompleto. Tente novamente.");

  const educationalCards = list(r.educationalCards).map((c) => {
    const card = obj(c);
    return {
      title: str(card.title),
      body: str(card.body),
      practicalExample: str(card.practicalExample),
      image: makeImage(str(card.imagePrompt), str(card.imageAlt)),
    };
  }).filter((c) => c.title);

  const quiz = list(r.quiz).map((q) => {
    const item = obj(q);
    return {
      question: str(item.question),
      options: strList(item.options).map((label, i) => ({ id: `opt_${i + 1}`, label })),
      progressLabel: str(item.progressLabel),
    };
  }).filter((q) => q.question && q.options.length >= 2);

  const preOffer = list(r.preOffer).map((p) => {
    const card = obj(p);
    return {
      title: str(card.title),
      transitionContent: str(card.transitionContent),
      image: makeImage(str(card.imagePrompt), str(card.imageAlt)),
    };
  }).filter((p) => p.title);

  const solution = obj(r.solution);
  const transition = obj(r.transition);
  const finalCta = obj(r.finalCta);

  const visualSpec = list(r.visualSpec).map((v) => {
    const item = obj(v);
    const stage = str(item.stage) as HybridStageId;
    return {
      stage,
      visualConcept: str(item.visualConcept),
      imagePrompt: str(item.imagePrompt),
    };
  }).filter((v) => HYBRID_STAGE_IDS.includes(v.stage));

  const sampleText = [
    headline,
    str(cover.subheadline),
    ...educationalCards.map((c) => `${c.title} ${c.body}`),
    ...quiz.map((q) => q.question),
    str(transition.body),
  ].join(" ");
  const contentLanguage = detectTextLanguage(sampleText) ?? input.detectedLanguage ?? "pt";
  console.info("[hybrid-guide] idioma pedido:", input.detectedLanguage, "| idioma detectado no texto:", detectTextLanguage(sampleText), "| salvo:", contentLanguage);

  return {
    stageOrder: [...HYBRID_STAGE_IDS],
    project: {
      offerUrl: input.offerUrl,
      ctaUrl: input.ctaUrl,
      affiliateUrl: "",
      language: contentLanguage,
      country: "",
      strategicAngle: input.strategicAngle,
      niche,
    },
    cover: {
      headline,
      subheadline: str(cover.subheadline),
      mainImage: makeImage(str(cover.mainImagePrompt), str(cover.mainImageAlt)),
      buttonText: str(cover.buttonText),
    },
    educationalCards,
    quiz,
    transition: { title: str(transition.title), body: str(transition.body) },
    preOffer,
    solution: {
      productName: str(solution.productName),
      realBenefits: strList(solution.realBenefits),
      confirmedDifferentials: strList(solution.confirmedDifferentials),
    },
    finalCta: {
      transitionText: str(finalCta.transitionText),
      buttonText: str(finalCta.buttonText),
      productImage: makeImage(str(finalCta.productImagePrompt), str(finalCta.productImageAlt)),
    },
    tracking: { metaPixelId: "", googleAdsTagId: "" },
    visualSpec,
    theme: THEMES[niche],
  };
}

const MODEL_CHAIN = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
const SWITCH_MODEL = /sobrecarregado|Limite por minuto|Cota diária|não encontrado/i;

export async function generateHybridGuide(input: HybridGuideInput): Promise<HybridGuideData> {
  if (!isGeminiConfigured()) throw new Error("A IA ainda não está configurada neste projeto.");
  const prompt = buildHybridPrompt(input);
  let lastErr: unknown;
  for (const model of MODEL_CHAIN) {
    try {
      const raw = await callGeminiJson<unknown>(prompt, {
        timeoutMs: 180000,
        maxOutputTokens: 8192,
        retries: 2,
        label: "hybrid-guide",
        model,
        useCache: false,
      });
      return normalizeGuide(raw, input);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : "";
      if (msg === "Cancelado" || !SWITCH_MODEL.test(msg)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Todos os modelos estão indisponíveis. Tente em alguns minutos.");
}
