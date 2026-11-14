import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import {
  angleOptions,
  generateQuizFunnel,
  isAiConfigured,
  type QuizAngle,
  type QuizFacts,
  type QuizFunnelData,
} from "@/services/quizAnalyzer";
import type { ExtractedPage } from "@/parser/extractPage";
import { generateCleanQuizHtml } from "@/export/quizTemplateClean";
import { TrackingModal } from "@/components/TrackingModal";
import { QuizEditPanel } from "@/components/QuizEditPanel";
import { parseHtmlFromUrl, extractFromHtml } from "@/parser";
import {
  Zap, Loader2, AlertCircle, Download,
  Smartphone, Tablet, Monitor, Settings, PencilLine,
  Link as LinkIcon,
} from "lucide-react";

const STORAGE_KEY = "create-quiz-form";

interface SavedForm {
  specificTheme: string;
  angle: string;
  language: string;
  headCode: string;
  bodyCode: string;
  checkoutUrl: string;
  factPrice: string;
  factGuarantee: string;
  factShipping: string;
  factDifferentials: string;
  productContext: string;
  productPageUrl: string;
}

function loadSavedForm(): Partial<SavedForm> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Partial<SavedForm>;
    localStorage.removeItem(STORAGE_KEY);
    return {};
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return {};
  }
}

function saveSavedForm(data: SavedForm): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

type Device = "mobile" | "tablet" | "desktop";

const DEVICES: { id: Device; label: string; width: number; icon: typeof Smartphone }[] = [
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
];

function buildSyntheticPage(theme: string): ExtractedPage {
  return {
    url: "",
    title: theme,
    headline: theme,
    subheadline: "",
    description: "",
    images: [],
    imageCandidates: [],
    videos: [],
    ctas: [],
    benefits: [],
    testimonials: [],
    colors: [],
    rawHtml: "",
    cleanedHtml: "",
    mediaLogos: [],
    facts: {
      guarantee: null,
      offers: [],
      rating: null,
      testimonials: [],
      unitSingular: "",
      unitPlural: "",
    },
  };
}

const BUSY_MESSAGE = "A IA esta ocupada no momento. Aguarde 10 segundos e tente novamente.";

function isBusyError(warning: string): boolean {
  return /429|503|Limite da API|Limite por minuto|Cota di\u00e1ria|sobrecarregado|Servidor|server error/i.test(warning);
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CreateAllPage() {
  const saved = useMemo(() => loadSavedForm(), []);
  const [specificTheme, setSpecificTheme] = useState(saved.specificTheme || "");
  const [angle, setAngle] = useState<QuizAngle>((saved.angle as QuizAngle) || "educational");
  const [language, setLanguage] = useState(saved.language || "pt");
  const [headCode, setHeadCode] = useState(saved.headCode || "");
  const [bodyCode, setBodyCode] = useState(saved.bodyCode || "");
  const [checkoutUrl, setCheckoutUrl] = useState(saved.checkoutUrl || "");
  const [factPrice, setFactPrice] = useState(saved.factPrice || "");
  const [factGuarantee, setFactGuarantee] = useState(saved.factGuarantee || "");
  const [factShipping, setFactShipping] = useState(saved.factShipping || "");
  const [factDifferentials, setFactDifferentials] = useState(saved.factDifferentials || "");
  const [productContext, setProductContext] = useState(saved.productContext || "");
  const [productPageUrl, setProductPageUrl] = useState(saved.productPageUrl || "");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [showFacts, setShowFacts] = useState(
    () => !!(saved.factPrice || saved.factGuarantee || saved.factShipping || saved.factDifferentials),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [quizData, setQuizData] = useState<QuizFunnelData | null>(null);
  const [originalQuizData, setOriginalQuizData] = useState<QuizFunnelData | null>(null);
  const [device, setDevice] = useState<Device>("mobile");
  const [editQuiz, setEditQuiz] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const angles = useMemo(() => angleOptions(), []);

  const onSuggestFromUrl = useCallback(async () => {
    setSuggestError("");
    const url = productPageUrl.trim();
    if (!url) return;
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setSuggestError("Insira uma URL começando com http(s)://");
      return;
    }
    setSuggesting(true);
    try {
      const parsed = await parseHtmlFromUrl(url);
      const page = extractFromHtml(parsed.rawHtml, parsed.url, parsed);
      if (page.title) setSpecificTheme(page.title);
      const benefits = page.benefits.slice(0, 5);
      if (benefits.length) setFactDifferentials(benefits.join("\n"));
      if (page.facts?.offers?.[0]?.perUnit) setFactPrice(page.facts.offers[0].perUnit);
      else if (page.facts?.offers?.[0]?.total) setFactPrice(page.facts.offers[0].total);
      if (page.facts?.guarantee?.evidence) setFactGuarantee(page.facts.guarantee.evidence);
      if (page.description) setProductContext(page.description);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Não foi possível carregar a página.");
    } finally {
      setSuggesting(false);
    }
  }, [productPageUrl]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const onGenerate = useCallback(async () => {
    setError("");
    setWarning("");
    setShowErrors(true);
    if (!specificTheme.trim()) {
      setError("Insira o nome do produto / tema.");
      return;
    }
    if (!isHttpUrl(checkoutUrl.trim())) {
      setError("Insira o link do produto / checkout, começando com https://.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setQuizData(null);
    setOriginalQuizData(null);

    try {
      saveSavedForm({
        specificTheme: specificTheme.trim(),
        angle,
        language,
        headCode: headCode.trim(),
        bodyCode: bodyCode.trim(),
        checkoutUrl: checkoutUrl.trim(),
        factPrice: factPrice.trim(),
        factGuarantee: factGuarantee.trim(),
        factShipping: factShipping.trim(),
        factDifferentials: factDifferentials.trim(),
        productContext: productContext.trim(),
        productPageUrl: productPageUrl.trim(),
      });
      const page = buildSyntheticPage(specificTheme.trim());
      const facts: QuizFacts = {
        price: factPrice.trim() || undefined,
        guarantee: factGuarantee.trim() || undefined,
        delivery: factShipping.trim() || undefined,
        proofs: factDifferentials.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      const result = await generateQuizFunnel(page, checkoutUrl.trim(), angle, {
        language,
        style: "clean",
        facts,
        signal: controller.signal,
        productContext: productContext.trim(),
      });
      if (result.usedFallback && result.warning && isBusyError(result.warning)) {
        setError(BUSY_MESSAGE);
        return;
      }
      setQuizData(result.data);
      setOriginalQuizData(result.data);
      if (result.warning) setWarning(result.warning);
    } catch (err) {
      if (err instanceof Error && err.message === "Cancelado") {
        // user cancelled
      } else {
        const msg = err instanceof Error ? err.message : "Erro ao gerar quiz";
        if (isBusyError(msg)) {
          setError(BUSY_MESSAGE);
        } else {
          setError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [specificTheme, checkoutUrl, angle, language, headCode, bodyCode, factPrice, factGuarantee, factShipping, factDifferentials, productContext, productPageUrl]);

  const onCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const liveQuizHtml = useMemo(() => {
    if (quizData) {
      return generateCleanQuizHtml(quizData, { headCode: headCode.trim(), bodyCode: bodyCode.trim() });
    }
    return "";
  }, [quizData, headCode, bodyCode]);

  const quizSlug = specificTheme.trim().toLowerCase().replace(/\s+/g, "-") || "quiz";

  const onDownloadHtml = useCallback(() => {
    if (!liveQuizHtml) return;
    triggerDownload(new Blob([liveQuizHtml], { type: "text/html;charset=utf-8" }), `${quizSlug}.html`);
  }, [liveQuizHtml, quizSlug]);

  const deviceMeta = DEVICES.find((d) => d.id === device) ?? DEVICES[0];
  const quizReady = !!liveQuizHtml;

  const [quizHtml, setQuizHtml] = useState(liveQuizHtml);
  const appliedQuizHtmlRef = useRef(liveQuizHtml);
  const quizFrameRef = useRef<HTMLIFrameElement>(null);
  const lastQuizScreenRef = useRef("landing");
  const pendingQuizRestoreRef = useRef<string | null>(null);

  useEffect(() => {
    if (liveQuizHtml === appliedQuizHtmlRef.current) return;
    if (!appliedQuizHtmlRef.current) {
      appliedQuizHtmlRef.current = liveQuizHtml;
      setQuizHtml(liveQuizHtml);
      return;
    }
    const timer = window.setTimeout(() => {
      appliedQuizHtmlRef.current = liveQuizHtml;
      pendingQuizRestoreRef.current = lastQuizScreenRef.current;
      setQuizHtml(liveQuizHtml);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [liveQuizHtml]);

  useEffect(() => {
    function onQuizMessage(e: MessageEvent) {
      if (e.source !== quizFrameRef.current?.contentWindow) return;
      if (e.data?.type !== "quiz-state" || typeof e.data.screen !== "string") return;
      const restore = pendingQuizRestoreRef.current;
      if (restore !== null) {
        pendingQuizRestoreRef.current = null;
        if (restore !== "landing") {
          quizFrameRef.current?.contentWindow?.postMessage({ type: "quiz-nav", action: "goto", screen: restore }, "*");
        }
        return;
      }
      lastQuizScreenRef.current = e.data.screen;
    }
    window.addEventListener("message", onQuizMessage);
    return () => window.removeEventListener("message", onQuizMessage);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-brand" />
            Criar Quiz Interativo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere um quiz interativo completo com IA a partir do nome do produto e do angulo escolhido.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(320px,400px)_1fr] lg:items-start">
          {/* Formulario (esquerda no desktop) */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:h-[calc(100vh-80px)] lg:overflow-y-auto lg:pr-1">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h3 className="text-sm font-semibold mb-3">Dados do Quiz</h3>
              <div className="space-y-3">
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">
                    Link do Produto / Checkout (Kiwify, Hotmart, etc.)<span className="text-red-500"> *</span>
                  </span>
                  <input
                    type="url"
                    value={checkoutUrl}
                    onChange={(e) => setCheckoutUrl(e.target.value)}
                    placeholder="https://pay.kiwify.com.br/..."
                    className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand ${showErrors && !isHttpUrl(checkoutUrl.trim()) ? "border-red-500" : "border-input"}`}
                  />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">
                    Nome do Produto / Tema<span className="text-red-500"> *</span>
                  </span>
                  <textarea
                    value={specificTheme}
                    onChange={(e) => setSpecificTheme(e.target.value)}
                    rows={2}
                    placeholder="Ex: Planilha de Controle Financeiro para Familias / Curso de Renda Extra com Croche"
                    className={`w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand ${showErrors && !specificTheme.trim() ? "border-red-500" : "border-input"}`}
                  />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Ângulo do quiz</span>
                  <select
                    value={angle}
                    onChange={(e) => setAngle(e.target.value as QuizAngle)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    {angles.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Contexto do produto (opcional)</span>
                  <textarea
                    value={productContext}
                    onChange={(e) => setProductContext(e.target.value)}
                    rows={4}
                    placeholder={"Público, problema principal e 3 a 5 benefícios reais, um por linha.\nEx: Para casais que querem organizar a vida financeira juntos.\nAjuda a planejar metas e dividir despesas.\n- Planilha compartilhada\n- Categorias automáticas\n- Resumo mensal do casal"}
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">URL da página do produto (opcional)</span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={productPageUrl}
                      onChange={(e) => setProductPageUrl(e.target.value)}
                      placeholder="https://seu-produto.com.br"
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button
                      type="button"
                      onClick={onSuggestFromUrl}
                      disabled={suggesting || !productPageUrl.trim()}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium transition hover:bg-accent disabled:opacity-50"
                    >
                      {suggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                      Sugerir
                    </button>
                  </div>
                  {suggestError && (
                    <p className="mt-1 text-xs text-amber-600">{suggestError}</p>
                  )}
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Idioma</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="pt">Portugues (pt)</option>
                    <option value="en">English (en)</option>
                    <option value="es">Espanol (es)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Fatos Verificados do Produto (opcional)</h3>
                <button type="button" onClick={() => setShowFacts((v) => !v)} className="text-xs font-medium text-brand hover:underline">
                  {showFacts ? "Ocultar" : "Adicionar"}
                </button>
              </div>
              {showFacts && (
              <>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Somente estes dados serao usados no quiz. Deixe em branco o que nao souber.</p>
              <div className="space-y-3">
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Preco</span>
                  <input
                    value={factPrice}
                    onChange={(e) => setFactPrice(e.target.value)}
                    placeholder="Ex: 12x de R$ 19,90"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Garantia</span>
                  <input
                    value={factGuarantee}
                    onChange={(e) => setFactGuarantee(e.target.value)}
                    placeholder="Ex: 7 dias incondicionais"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Frete / Entrega</span>
                  <input
                    value={factShipping}
                    onChange={(e) => setFactShipping(e.target.value)}
                    placeholder="Ex: Acesso imediato por e-mail"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">Diferenciais (um por linha)</span>
                  <textarea
                    value={factDifferentials}
                    onChange={(e) => setFactDifferentials(e.target.value)}
                    rows={3}
                    placeholder={"Ex: Metodo passo a passo\nSuporte por WhatsApp"}
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
              </>
              )}
            </div>

            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {loading ? "Criando..." : "Criar Quiz com IA"}
            </button>
            {loading && (
              <button type="button" onClick={onCancel} className="w-full text-xs text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
            )}
            {!isAiConfigured() && !error && (
              <p className="text-xs text-amber-600">
                Sem chave de IA configurada, os resultados usarao templates basicos.
              </p>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}
            {warning && !error && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {warning}
              </div>
            )}
          </aside>

          {/* Pre-visualizacao (direita no desktop) */}
          <section className="min-w-0">
            {!quizReady && !loading && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-16 text-center" style={{ minHeight: 400 }}>
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold">Pronto para criar seu quiz</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Preencha o nome do produto, escolha o angulo e o idioma, e clique em Criar Quiz com IA.
                </p>
              </div>
            )}

            {loading && !quizReady && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-16 text-center" style={{ minHeight: 400 }}>
                <Loader2 className="h-10 w-10 text-brand animate-spin mb-4" />
                <h2 className="text-lg font-semibold">Gerando seu quiz...</h2>
                <p className="mt-2 text-sm text-muted-foreground">A IA esta montando a estrutura do quiz.</p>
              </div>
            )}

            {quizReady && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-semibold">Pre-visualizacao do Quiz</h3>
                  <div className="flex items-center gap-2">
                    {DEVICES.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDevice(d.id)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${device === d.id ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-accent"}`}
                      >
                        <d.icon className="h-3.5 w-3.5" /> {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onDownloadHtml}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                    >
                      <Download className="h-3.5 w-3.5" /> Exportar / Baixar Quiz
                    </button>
                    {originalQuizData && (
                      <button
                        type="button"
                        onClick={() => setEditQuiz((v) => !v)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${editQuiz ? "bg-brand text-brand-foreground" : "border border-border hover:bg-accent"}`}
                      >
                        <PencilLine className="h-3.5 w-3.5" /> {editQuiz ? "Fechar edicao" : "Editar quiz"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTrackingOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
                    >
                      <Settings className="h-3.5 w-3.5" /> Rastreamento
                    </button>
                  </div>
                </div>

                {editQuiz && originalQuizData && (
                  <QuizEditPanel
                    data={quizData || originalQuizData}
                    onChange={setQuizData}
                    style="clean"
                    initialData={originalQuizData}
                  />
                )}

                <div className="flex justify-center rounded-lg border border-border bg-muted/20 overflow-hidden" style={{ minHeight: 500 }}>
                  <iframe
                    ref={quizFrameRef}
                    srcDoc={quizHtml}
                    sandbox="allow-scripts allow-popups"
                    title="Quiz Preview"
                    style={{
                      width: device === "desktop" ? "100%" : deviceMeta.width,
                      maxWidth: device === "desktop" ? 800 : "100%",
                      height: 500,
                      border: "none",
                    }}
                  />
                </div>

              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
      {trackingOpen && (
        <TrackingModal
          headCode={headCode}
          bodyCode={bodyCode}
          onHeadCode={setHeadCode}
          onBodyCode={setBodyCode}
          onClose={() => setTrackingOpen(false)}
        />
      )}
    </div>
  );
}
