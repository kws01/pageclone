import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { parseHtmlFromUrl } from "@/parser/htmlParser";
import { extractFromHtml, type ExtractedPage } from "@/parser/extractPage";
import {
  generateQuizFunnel,
  angleOptions,
  isAiConfigured,
  type QuizAngle,
  type QuizFunnelData,
  type QuizStyle,
  type QuizFacts,
} from "@/services/quizAnalyzer";
import { detectLanguage, type DetectedLanguage } from "@/services/detectLanguage";
import { generateQuizHtml } from "@/export/quizTemplate";
import { generateCleanQuizHtml } from "@/export/quizTemplateClean";
import { downloadHtmlFile, slugify } from "@/export/downloadZip";
import { TrackingModal } from "@/components/TrackingModal";
import { QuizEditPanel } from "@/components/QuizEditPanel";
import JSZip from "jszip";
import {
  Globe, Loader2, AlertCircle, Sparkles, Download,
  Smartphone, Tablet, Monitor, CheckCircle2, Target, ExternalLink,
  Settings, Package,
} from "lucide-react";

type Device = "mobile" | "tablet" | "desktop";

const DEVICES: { id: Device; label: string; width: number; icon: typeof Smartphone }[] = [
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
];

const PREVIEW_HEIGHT = 720;

const AI_NOT_CONFIGURED_MESSAGE = "A IA ainda não está configurada neste projeto. Adicione a chave do Gemini para gerar o quiz.";

function buildFactsFromPage(page: ExtractedPage): QuizFacts {
  const facts: QuizFacts = {};
  const offer = page.facts.offers[0];
  if (offer) {
    if (offer.perUnit) facts.price = offer.perUnit;
    else if (offer.total) facts.price = offer.total;
    if (offer.currency && offer.perUnit) facts.priceNote = `${offer.currency}`;
  }
  if (page.facts.guarantee) {
    const g = page.facts.guarantee;
    if (g.days) facts.guarantee = `${g.days} dias`;
    else if (g.evidence) facts.guarantee = g.evidence;
  }
  if (page.facts.rating?.score) {
    facts.proofs = [`${page.facts.rating.score}`];
  }
  return facts;
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function QuizFunnelPage() {
  const navigate = useNavigate();
  const [productUrl, setProductUrl] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [angle, setAngle] = useState<QuizAngle>("guided_discovery");
  const [quizStyle, setQuizStyle] = useState<QuizStyle>("clean");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [funnelData, setFunnelData] = useState<QuizFunnelData | null>(null);
  const [device, setDevice] = useState<Device>("mobile");
  const [exporting, setExporting] = useState(false);
  const [headCode, setHeadCode] = useState("");
  const [bodyCode, setBodyCode] = useState("");
  const [editing, setEditing] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [testTabWindow, setTestTabWindow] = useState<Window | null>(null);
  const [originalData, setOriginalData] = useState<QuizFunnelData | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [fallbackError, setFallbackError] = useState("");
  const [detectedLang, setDetectedLang] = useState<DetectedLanguage | null>(null);
  const [extractedPage, setExtractedPage] = useState<ExtractedPage | null>(null);
  const onGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setFallbackError("");
    setUsedFallback(false);
    if (!productUrl.trim()) return;
    if (!affiliateUrl.trim()) {
      setError("Insira o link de afiliado para gerar o funil.");
      return;
    }
    setLoading(true);
    setFunnelData(null);
    try {
      const parsed = await parseHtmlFromUrl(productUrl);
      const page = extractFromHtml(parsed.rawHtml, parsed.url, parsed);
      setExtractedPage(page);

      const detected = detectLanguage(parsed.rawHtml, page);
      setDetectedLang(detected);

      const pageFacts = buildFactsFromPage(page);

      const result = await generateQuizFunnel(page, affiliateUrl.trim(), angle, {
        style: quizStyle,
        heroImageUrl: page.heroImage,
        language: detected.code,
        facts: pageFacts,
      });

      if (result.usedFallback && quizStyle === "clean") {
        setUsedFallback(true);
        setFallbackError(isAiConfigured() ? "A IA está sobrecarregada ou não respondeu desta vez. Aguarde alguns segundos e clique em Tentar de novo." : AI_NOT_CONFIGURED_MESSAGE);
        setFunnelData(null);
      } else {
        setFunnelData(result.data);
        setOriginalData(result.data);
        if (result.warning) setWarning(result.warning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar funil");
    } finally {
      setLoading(false);
    }
  }, [productUrl, affiliateUrl, angle, quizStyle]);

  const html = useMemo(() => {
    if (!funnelData) return "";
    return quizStyle === "clean"
      ? generateCleanQuizHtml(funnelData, { headCode, bodyCode })
      : generateQuizHtml(funnelData, { headCode, bodyCode });
  }, [funnelData, headCode, bodyCode, quizStyle]);

  const previewHtml = useMemo(() => {
    if (!funnelData) return "";
    return quizStyle === "clean"
      ? generateCleanQuizHtml(funnelData, {})
      : generateQuizHtml(funnelData, { headCode: "", bodyCode: "" });
  }, [funnelData, quizStyle]);

  const htmlRef = useRef(html);
  htmlRef.current = html;

  const onDownloadHtml = useCallback(() => {
    downloadHtmlFile(htmlRef.current, "quiz-funnel.html");
  }, []);

  const onDownloadZip = useCallback(async () => {
    setExporting(true);
    try {
      const quizHtml = htmlRef.current;
      const zip = new JSZip();

      let finalHtml = quizHtml;
      const imgUrl = funnelData?.landingImageUrl;
      if (imgUrl && imgUrl.startsWith("data:image/")) {
        const blob = dataUrlToBlob(imgUrl);
        if (blob) {
          const ext = blob.type.split("/")[1] || "jpg";
          const fileName = `abertura.${ext}`;
          zip.file(`assets/${fileName}`, blob);
          finalHtml = quizHtml.replace(
            new RegExp(imgUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            `assets/${fileName}`,
          );
        }
      }

      zip.file("index.html", finalHtml);
      zip.file("netlify.toml", "[build]\n  publish = \".\"\n\n[[redirects]]\n  from = \"/*\"\n  to = \"/index.html\"\n  status = 200\n");
      zip.file("_redirects", "/*    /index.html   200\n");
      zip.file("README.md", `# ${funnelData?.productName || "Quiz Funnel"}\n\nQuiz funnel generated by PageClone AI.\n\n## Deploy\n1. Extract this ZIP\n2. Upload to Netlify Drop, Vercel, or any static host\n`);
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const name = slugify(funnelData?.productName || "quiz-funnel");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExporting(false);
    }
  }, [funnelData]);

  const onTestNewTab = useCallback(() => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(htmlRef.current);
      w.document.close();
      setTestTabWindow(w);
    }
  }, []);

  const deviceMeta = DEVICES.find((d) => d.id === device) ?? DEVICES[0];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-brand" />
            Funil de Descoberta
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere um quiz interativo com IA que conduz o visitante ate a oferta de afiliado.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Configuracao do Funil</h3>
              <form onSubmit={onGenerate} className="space-y-3">
                <label className="block">
                  <span className="block text-xs text-muted-foreground mb-1">URL do produto/oferta</span>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      required
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="https://exemplo.com/produto"
                      className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="block text-xs text-muted-foreground mb-1">Link de afiliado</span>
                  <input
                    type="url"
                    required
                    value={affiliateUrl}
                    onChange={(e) => setAffiliateUrl(e.target.value)}
                    placeholder="https://hotmart.com/seu-link"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs text-muted-foreground mb-1">Estilo do Quiz</span>
                  <select
                    value={quizStyle}
                    onChange={(e) => setQuizStyle(e.target.value as QuizStyle)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="clean">Padrão (claro)</option>
                    <option value="classic">Clássico (escuro)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs text-muted-foreground mb-1">Angulo de Direct Response</span>
                  <select
                    value={angle}
                    onChange={(e) => setAngle(e.target.value as QuizAngle)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    {angleOptions().map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Gerando funil..." : "Analisar e Gerar Funil com IA"}
                </button>
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
                  </div>
                )}
                {!isAiConfigured() && !error && (
                  <p className="text-xs text-amber-600">
                    {AI_NOT_CONFIGURED_MESSAGE}
                  </p>
                )}
              </form>
            </div>

            {funnelData && (
              <>
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Funil Gerado
                  </h3>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    <li><span className="font-medium text-foreground">{funnelData.productName}</span></li>
                    <li>Nicho: {funnelData.niche}</li>
                    <li>Perguntas: {funnelData.questions.length}</li>
                    <li>Angulo: {angleOptions().find((a) => a.value === angle)?.label}</li>
                    <li>Idioma: {detectedLang?.name}</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setEditing((v) => !v)}
                    className="mt-3 w-full text-xs text-brand hover:underline"
                  >
                    {editing ? "Fechar edicao" : "Editar conteudo do funil"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/prompts")}
                    className="mt-2 w-full text-xs rounded-md border border-border px-3 py-2 hover:bg-accent transition"
                  >
                    Abrir prompts de anuncios
                  </button>
                </div>

                {editing && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-3">Editar Funil</h3>
                    <QuizEditPanel
                      data={funnelData}
                      onChange={setFunnelData}
                      style={quizStyle}
                      initialData={originalData || undefined}
                      imageCandidates={extractedPage?.imageCandidates}
                    />
                  </div>
                )}
              </>
            )}
          </aside>

          <section className="min-w-0">
            {!funnelData && !loading && !usedFallback && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-16 text-center" style={{ minHeight: 400 }}>
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold">Nenhum funil gerado ainda</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Cole a URL do produto, seu link de afiliado e clique em gerar. A IA criara um quiz interativo completo.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 p-16 text-center" style={{ minHeight: 400 }}>
                <Loader2 className="h-10 w-10 animate-spin text-brand mb-4" />
                <h2 className="text-lg font-semibold">Gerando funil com IA...</h2>
                <p className="mt-2 text-sm text-muted-foreground">Analisando o produto e criando perguntas, copy e visual.</p>
              </div>
            )}

            {usedFallback && !loading && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/40 bg-destructive/5 p-16 text-center" style={{ minHeight: 400 }}>
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-lg font-semibold text-destructive">Nao foi possivel gerar o funil</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">{fallbackError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setUsedFallback(false);
                    setFallbackError("");
                    const fakeEvent = { preventDefault() {} } as React.FormEvent;
                    void onGenerate(fakeEvent);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90"
                >
                  <Loader2 className="h-4 w-4" /> Tentar de novo
                </button>
              </div>
            )}

            {funnelData && !usedFallback && (
              <>
                {warning && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{warning}</span>
                  </div>
                )}

                {/* Action buttons bar */}
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
                  <button
                    type="button"
                    onClick={() => void onDownloadZip()}
                    disabled={exporting}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    {exporting ? "Empacotando..." : "Exportar HTML / Baixar ZIP"}
                  </button>
                  <button
                    type="button"
                    onClick={onDownloadHtml}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    <Download className="h-4 w-4" /> Baixar HTML
                  </button>
                  <button
                    type="button"
                    onClick={onTestNewTab}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    <ExternalLink className="h-4 w-4" /> Testar em nova aba
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    <Settings className="h-4 w-4" /> Rastreamento & Pixels
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div
                    role="radiogroup"
                    aria-label="Dispositivo"
                    className="inline-flex rounded-lg border border-border bg-card p-1"
                  >
                    {DEVICES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={device === item.id}
                        onClick={() => setDevice(item.id)}
                        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          device === item.id ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Preview ao vivo · {deviceMeta.width}px</span>
                  </div>
                </div>
                <QuizPreview html={previewHtml} width={deviceMeta.width} device={device} />
              </>
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

      {/* keep ref to avoid unused warning */}
      <span hidden>{testTabWindow ? 1 : 0}</span>
    </div>
  );
}

function QuizPreview({ html, width, device }: { html: string; width: number; device: Device }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [available, setAvailable] = useState(width);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setAvailable(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) iframe.srcdoc = html;
  }, [html]);

  const scale = Math.min(1, available > 0 ? available / width : 1);
  const radius = device === "mobile" ? 24 : device === "tablet" ? 16 : 8;

  return (
    <div ref={hostRef} className="rounded-xl border border-border bg-muted/30 p-4 overflow-hidden">
      <div className="flex justify-center">
        <div style={{ width: width * scale, height: PREVIEW_HEIGHT * scale, transition: "width 320ms ease, height 320ms ease" }}>
          <div
            className="overflow-hidden bg-white shadow-lg"
            style={{
              width,
              height: PREVIEW_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              transition: "transform 320ms ease, border-radius 320ms ease",
              borderRadius: radius,
            }}
          >
            <iframe
              ref={iframeRef}
              title="Quiz funnel preview"
              srcDoc={html || ""}
              sandbox="allow-scripts allow-popups"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
