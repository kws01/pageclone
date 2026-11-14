import { parseHtmlFromUrl, type ParsedHtml } from "@/parser/htmlParser";
import { extractFromHtml, type ExtractedPage } from "@/parser/extractPage";
import {
  generateQuizFunnel,
  angleOptions,
  type QuizAngle,
  type QuizFunnelData,
  type QuizFunnelResult,
} from "@/services/quizAnalyzer";
import { generateAds, generateAdBrief, type AdInput, type AdObjective, type AdGenerationResult, type AdBrief } from "@/services/adCopyGenerator";
import { isGeminiConfigured } from "@/services/geminiClient";
import { slugify } from "@/export/downloadZip";
import { generateQuizHtml } from "@/export/quizTemplate";
import { generateCleanQuizHtml } from "@/export/quizTemplateClean";

export interface PipelineFacts {
  price?: string;
  guarantee?: string;
  shipping?: string;
  proofs?: string[];
  benefits?: string[];
  painPoints?: string[];
}

export interface PipelineInput {
  productUrl?: string;
  kiwifyCheckoutUrl: string;
  specificTheme: string;
  angle: QuizAngle;
  language: string;
  generateQuiz: boolean;
  generateAds: boolean;
  facts: PipelineFacts;
  headCode?: string;
  bodyCode?: string;
  extraAvoid?: string[];
  productName?: string;
  niche?: string;
}

export type StepStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface StepInfo {
  id: string;
  label: string;
  status: StepStatus;
  message?: string;
  elapsedMs?: number;
}

export interface PipelinePartial {
  quizHtml?: string;
  quizData?: QuizFunnelData | null;
  adsResult?: AdGenerationResult | null;
}

export interface PipelineResult {
  quizHtml: string;
  quizData: QuizFunnelData | null;
  adsResult: AdGenerationResult | null;
  extractedPage: ExtractedPage | null;
  steps: StepInfo[];
  slug: string;
}

export function defaultSteps(): StepInfo[] {
  return [
    { id: "extract", label: "Extrair dados do produto", status: "pending" },
    { id: "quiz", label: "Gerar quiz interativo", status: "pending" },
    { id: "ads", label: "Gerar anuncios Meta/Google", status: "pending" },
  ];
}

export async function runPipeline(
  input: PipelineInput,
  onStep: (stepId: string, status: StepStatus, message?: string, elapsedMs?: number) => void,
  shouldCancel: () => boolean,
  onPartial: (partial: PipelinePartial) => void,
  signal?: AbortSignal,
): Promise<PipelineResult> {
  const steps = defaultSteps();
  const updateStep = (id: string, status: StepStatus, message?: string, elapsedMs?: number) => {
    const s = steps.find((st) => st.id === id);
    if (s) { s.status = status; s.message = message; s.elapsedMs = elapsedMs; }
    onStep(id, status, message, elapsedMs);
  };

  const stepSignal = (id: string): AbortSignal | undefined => {
    if (shouldCancel() || signal?.aborted) return undefined;
    return signal;
  };

  let extractedPage: ExtractedPage | null = null;
  const slug = slugify(input.specificTheme || input.productName || input.kiwifyCheckoutUrl || "funil-direto");

  // ── PASSO 1: Extrair (opcional) ──
  if (input.productUrl && input.productUrl.trim()) {
    updateStep("extract", "running");
    const t0 = performance.now();
    try {
      const parsed: ParsedHtml = await parseHtmlFromUrl(input.productUrl.trim());
      extractedPage = extractFromHtml(parsed.rawHtml, parsed.url, parsed);
      updateStep("extract", "done", extractedPage.title || "Pagina extraida", Math.round(performance.now() - t0));
    } catch (err) {
      updateStep("extract", "error", err instanceof Error ? err.message : "Extracao falhou", Math.round(performance.now() - t0));
    }
  } else {
    updateStep("extract", "skipped", "Sem URL — usando tema e dados manuais");
  }

  if (shouldCancel()) return buildResult(steps, "", null, null, extractedPage, slug);

  // ── PASSO 2+3: Quiz e Anuncios em paralelo ──
  const page = extractedPage || buildManualPage(input);
  const aiOk = isGeminiConfigured();

  let quizData: QuizFunnelData | null = null;
  let quizHtml = "";
  let adsResult: AdGenerationResult | null = null;
  let brief: AdBrief | null = null;

  const quizPromise = (async () => {
    if (!input.generateQuiz) {
      updateStep("quiz", "skipped");
      return;
    }
    updateStep("quiz", "running");
    const t0 = performance.now();
    try {
      const quizResult: QuizFunnelResult = await generateQuizFunnel(page, input.kiwifyCheckoutUrl, input.angle, {
        language: input.language,
        facts: {
          price: input.facts.price,
          delivery: input.facts.shipping,
          guarantee: input.facts.guarantee,
          proofs: input.facts.proofs,
        },
        signal: stepSignal("quiz"),
        style: "clean",
        heroImageUrl: page.heroImage,
      });
      quizData = quizResult.data;
      quizHtml = generateCleanQuizHtml(quizData, { headCode: input.headCode || "", bodyCode: input.bodyCode || "" });
      updateStep("quiz", "done", quizResult.usedFallback ? quizResult.warning || "Template basico" : "Quiz gerado", Math.round(performance.now() - t0));
      onPartial({ quizHtml, quizData });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar quiz";
      updateStep("quiz", "error", msg === "Cancelado" ? "Cancelado pelo usuario" : msg, Math.round(performance.now() - t0));
    }
  })();

  const adsPromise = (async () => {
    if (!input.generateAds) {
      updateStep("ads", "skipped");
      return;
    }
    updateStep("ads", "running");
    const t0 = performance.now();
    try {
      if (aiOk) {
        const adInput = buildAdInput(input, page, null);
        try {
          brief = await generateAdBrief(adInput, stepSignal("ads"));
        } catch {
          // brief failure is non-fatal
        }
      }
      const adInput = buildAdInput(input, page, quizData);
      adsResult = await generateAds({
        input: adInput,
        objective: "traffic",
        tone: "",
        count: 4,
        extraAvoid: input.extraAvoid,
        brief: brief || undefined,
        aiAudit: false,
      });
      updateStep("ads", "done", adsResult.usedFallback ? adsResult.warning || "Template basico" : `${adsResult.ads.length} anuncios gerados`, Math.round(performance.now() - t0));
      onPartial({ adsResult });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar anuncios";
      updateStep("ads", "error", msg === "Cancelado" ? "Cancelado pelo usuario" : msg, Math.round(performance.now() - t0));
    }
  })();

  await Promise.allSettled([quizPromise, adsPromise]);

  return buildResult(steps, quizHtml, quizData, adsResult, extractedPage, slug);
}

function buildAdInput(input: PipelineInput, page: ExtractedPage, quizData: QuizFunnelData | null): AdInput {
  return {
    source: "pipeline",
    productName: input.specificTheme || input.productName || quizData?.productName || page.title || "Produto",
    niche: input.niche || quizData?.niche || "geral",
    language: input.language || "pt",
    landingHeadline: quizData?.landingHeadline || page.headline || page.title || input.specificTheme,
    firstQuestion: quizData?.questions[0]?.question,
    benefits: input.facts.benefits || page.benefits.slice(0, 6),
    painPoints: input.facts.painPoints || [],
    offerFacts: {
      price: input.facts.price,
      guarantee: input.facts.guarantee,
      shipping: input.facts.shipping,
      proofs: input.facts.proofs,
    },
    ctaUrl: input.kiwifyCheckoutUrl,
    description: input.specificTheme,
  };
}

function buildManualPage(input: PipelineInput): ExtractedPage {
  const benefits = input.facts.benefits || [];
  return {
    url: input.productUrl || "",
    title: input.specificTheme || input.productName || "",
    headline: input.specificTheme || "",
    subheadline: "",
    description: input.specificTheme || "",
    images: [],
    imageCandidates: [],
    videos: [],
    ctas: [{ text: "Comprar", href: input.kiwifyCheckoutUrl }],
    benefits,
    testimonials: [],
    colors: [],
    rawHtml: "",
    cleanedHtml: "",
    mediaLogos: [],
    facts: {
      guarantee: input.facts.guarantee ? { days: null, evidence: input.facts.guarantee } : null,
      offers: input.facts.price ? [{ qty: 1, total: input.facts.price, perUnit: null, currency: null, discount: null, evidence: input.facts.price }] : [],
      rating: null,
      testimonials: [],
      unitSingular: "",
      unitPlural: "",
    },
  };
}

function buildResult(
  steps: StepInfo[],
  quizHtml: string,
  quizData: QuizFunnelData | null,
  adsResult: AdGenerationResult | null,
  extractedPage: ExtractedPage | null,
  slug: string,
): PipelineResult {
  return { steps, quizHtml, quizData, adsResult, extractedPage, slug };
}

export { angleOptions, slugify };
export type { QuizAngle };
