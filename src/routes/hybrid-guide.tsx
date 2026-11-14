import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { HybridGuideForm, type HybridFormValues } from "@/components/hybrid/HybridGuideForm";
import { HybridSplitEditor } from "@/components/hybrid/HybridSplitEditor";
import { parseHtmlFromUrl } from "@/parser/htmlParser";
import { extractFromHtml } from "@/parser/extractPage";
import { buildProductContext } from "@/lib/hybridProductContext";
import { detectLanguage } from "@/services/detectLanguage";
import { generateHybridGuide } from "@/services/geminiHybridService";
import type { HybridGuideData, HybridImage } from "@/types/hybridGuide";

const STORAGE_KEY = "pageclone:hybrid-guide";

const EMPTY_IMAGE: HybridImage = { url: null, alt: "", imagePrompt: "" };

function migrateGuide(parsed: Partial<HybridGuideData>): HybridGuideData | null {
  if (!parsed?.cover?.headline || !Array.isArray(parsed.stageOrder)) return null;
  if (!parsed.tracking) parsed.tracking = { metaPixelId: "", googleAdsTagId: "" };
  if (!parsed.finalCta) return null;
  if (!parsed.finalCta.productImage) parsed.finalCta.productImage = { ...EMPTY_IMAGE };
  if (!parsed.cover.mainImage) parsed.cover.mainImage = { ...EMPTY_IMAGE };
  if (!Array.isArray(parsed.educationalCards)) parsed.educationalCards = [];
  parsed.educationalCards.forEach((c) => { if (!c.image) c.image = { ...EMPTY_IMAGE }; });
  if (!Array.isArray(parsed.preOffer)) parsed.preOffer = [];
  parsed.preOffer.forEach((c) => { if (!c.image) c.image = { ...EMPTY_IMAGE }; });
  if (!parsed.project) {
    parsed.project = {
      offerUrl: "", ctaUrl: "", affiliateUrl: "", language: "pt", country: "",
      strategicAngle: "", niche: parsed.theme?.id ?? "beauty",
    };
  }
  if (!parsed.theme) parsed.theme = { id: "beauty", label: "Beleza", colors: { background: "#faf8f5", surface: "#fff", primary: "#b85c7e", primaryText: "#fff", accent: "#e8b4bc", text: "#3d2a2e", textMuted: "#8a7075", border: "#e8ddd8" }, fonts: { heading: "'Georgia', serif", body: "'Inter', sans-serif", googleFontsUrl: "" }, radius: "12px", shadow: "0 4px 24px rgba(184,92,126,0.12)" };
  return parsed as HybridGuideData;
}

function loadSavedGuide(): HybridGuideData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateGuide(JSON.parse(raw) as Partial<HybridGuideData>);
  } catch {
    return null;
  }
}

async function readProductContext(offerUrl: string): Promise<{ context: string; language: string }> {
  const parsed = await parseHtmlFromUrl(offerUrl);
  const page = extractFromHtml(parsed.rawHtml, parsed.url, parsed);
  const detected = detectLanguage(parsed.rawHtml, page);
  return { context: buildProductContext(page, ""), language: detected.code };
}

export default function HybridGuidePage() {
  const [guide, setGuide] = useState<HybridGuideData | null>(() => loadSavedGuide());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (guide) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(guide));
      } catch {
        // localStorage may be full from data-URL images; silently skip.
      }
    }
  }, [guide]);

  const handleGenerate = async (values: HybridFormValues) => {
    setLoading(true);
    setError("");
    try {
      const offerUrl = values.offerUrl.trim();
      const { context, language: detectedLanguage } = await readProductContext(offerUrl);
      const language = values.language === "auto" ? detectedLanguage : values.language;
      const generated = await generateHybridGuide({
        offerUrl,
        ctaUrl: values.ctaUrl.trim(),
        strategicAngle: values.angle,
        niche: values.niche === "auto" ? undefined : values.niche,
        productContext: context,
        detectedLanguage: language,
      });
      setGuide(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o guia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.confirm("Voltar ao formulário? As edições feitas no guia serão perdidas.")) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      setGuide(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        {guide ? (
          <HybridSplitEditor guide={guide} onChange={setGuide} onBack={handleBack} />
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Hybrid Discovery Guide</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Gere um guia híbrido com cartões educativos, mini quiz e pré-oferta, pronto para editar antes de publicar.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <HybridGuideForm loading={loading} error={error} onSubmit={handleGenerate} />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
