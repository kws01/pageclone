import { Link } from "react-router-dom";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { loadCurrent } from "@/utils/storage";
import { buildHtml } from "@/editor/buildClone";
import type { CloneMode } from "@/editor/buildClone";
import type { ExtractedPage } from "@/parser/extractPage";
import { analyzePageContent, isAiConfigured, type AiAnalysis } from "@/services/aiAnalyzer";
import { downloadHtmlFile, downloadZipPackage } from "@/export/downloadZip";
import {
  Smartphone, Tablet, Monitor, Download, FileArchive, Link2, CheckCircle2,
  Copy, Sparkles, Loader2, AlertCircle, Code2, Cookie,
} from "lucide-react";

type Device = "mobile" | "tablet" | "desktop";

const DEVICES: { id: Device; label: string; width: number; icon: typeof Smartphone }[] = [
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
];

const PREVIEW_HEIGHT = 720;

export default function EditorPage() {
  const [page, setPage] = useState<ExtractedPage | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [logo, setLogo] = useState("");
  const [mode, setMode] = useState<CloneMode>("full");
  const [exporting, setExporting] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);
  const [replaceFlash, setReplaceFlash] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [headTrackingCode, setHeadTrackingCode] = useState("");
  const [bodyTrackingCode, setBodyTrackingCode] = useState("");
  const [enableCookieBanner, setEnableCookieBanner] = useState(false);
  const [cookieText, setCookieText] = useState("We use cookies to improve your experience and analyze site traffic.");
  const [acceptBtnText, setAcceptBtnText] = useState("Accept All");
  const [rejectBtnText, setRejectBtnText] = useState("Decline");
  const [redirectOnAction, setRedirectOnAction] = useState(true);
  const [redirectTarget, setRedirectTarget] = useState<"_self" | "_blank">("_self");
  const aiRanRef = useRef(false);

  useEffect(() => {
    const p = loadCurrent();
    if (p) {
      setPage(p);
      setHeadline(p.headline);
      setSubheadline(p.subheadline);
      setCtaText(p.ctas[0]?.text ?? "Quero garantir agora");
    }
  }, []);

  const html = useMemo(() => {
    if (!page) return "";
    return buildHtml(page, {
      affiliateUrl,
      headline,
      subheadline,
      ctaText,
      logo,
      mode,
      aiAnalysis: aiAnalysis ?? undefined,
      headTrackingCode,
      bodyTrackingCode,
      enableCookieBanner,
      cookieText,
      acceptBtnText,
      rejectBtnText,
      redirectOnAction,
      redirectTarget,
    });
  }, [page, affiliateUrl, headline, subheadline, ctaText, logo, mode, aiAnalysis, headTrackingCode, bodyTrackingCode, enableCookieBanner, cookieText, acceptBtnText, rejectBtnText, redirectOnAction, redirectTarget]);

  const htmlRef = useRef(html);
  htmlRef.current = html;

  useEffect(() => {
    if (!page) return;
    setLiveFlash(true);
    const t = window.setTimeout(() => setLiveFlash(false), 450);
    return () => window.clearTimeout(t);
  }, [html, page]);

  const onReplaceCtas = useCallback(() => {
    setAffiliateUrl((v) => v.trim());
    if (affiliateUrl.trim()) {
      setReplaceFlash(true);
      window.setTimeout(() => setReplaceFlash(false), 2000);
    }
  }, [affiliateUrl]);

  const onDownloadHtml = useCallback(() => {
    downloadHtmlFile(htmlRef.current);
  }, []);

  const onDownloadZip = useCallback(async () => {
    setExporting(true);
    try {
      await downloadZipPackage(htmlRef.current);
    } finally {
      setExporting(false);
    }
  }, []);

  const runAiAnalysis = useCallback(async () => {
    if (!page || aiLoading) return;
    if (!isAiConfigured()) {
      setAiError("Configure VITE_GEMINI_API_KEY no arquivo .env para usar a IA.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const result = await analyzePageContent(page);
      setAiAnalysis(result);
      setHeadline(result.headline);
      setSubheadline(result.subheadline);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erro ao analisar com IA.");
    } finally {
      setAiLoading(false);
    }
  }, [page, aiLoading]);

  useEffect(() => {
    if (mode === "reconstruct" && page && !aiRanRef.current && !aiAnalysis && !aiLoading) {
      aiRanRef.current = true;
      void runAiAnalysis();
    }
  }, [mode, page, aiAnalysis, aiLoading, runAiAnalysis]);

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <h1 className="text-2xl font-bold">Nenhuma pagina clonada ainda</h1>
            <p className="mt-2 text-muted-foreground">Cole uma URL para comecar.</p>
            <Link to="/clone" className="mt-6 inline-flex rounded-md bg-brand px-5 py-2.5 font-medium text-brand-foreground hover:opacity-90">
              Ir para clonador
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const deviceMeta = DEVICES.find((d) => d.id === device) ?? DEVICES[2];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-semibold truncate max-w-md" title={page.url}>
              {page.title || "Pagina clonada"}
            </h1>
            <p className="text-xs text-muted-foreground truncate max-w-md">{page.url}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-4">
            <Card title="Modo de geracao">
              <div className="grid grid-cols-1 gap-2">
                <ModeBtn
                  active={mode === "full"}
                  onClick={() => setMode("full")}
                  icon={Copy}
                  label="Clonar pagina original"
                  desc="Preserva o HTML e estilo do site"
                />
                <ModeBtn
                  active={mode === "reconstruct"}
                  onClick={() => setMode("reconstruct")}
                  icon={Sparkles}
                  label="Reconstruir (Direct Response)"
                  desc="Landing page nova em estilo presell"
                />
              </div>
              {mode === "reconstruct" && (
                <div className="mt-3">
                  {aiLoading && (
                    <div className="flex items-center gap-2 rounded-lg bg-brand/5 border border-brand/20 px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-brand" />
                      <span className="text-xs font-medium text-brand">Analisando com IA...</span>
                    </div>
                  )}
                  {!aiLoading && aiError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                      <span className="text-xs text-red-600">{aiError}</span>
                    </div>
                  )}
                  {!aiLoading && !aiError && aiAnalysis && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">IA analisou: {aiAnalysis.productName}</span>
                    </div>
                  )}
                  {!aiLoading && !aiError && !aiAnalysis && (
                    <button
                      type="button"
                      onClick={() => void runAiAnalysis()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
                    >
                      <Sparkles className="h-4 w-4" /> Analisar com IA
                    </button>
                  )}
                </div>
              )}
            </Card>

            <Card title="Link de afiliado">
              <input
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://hotmart.com/seu-link"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={onReplaceCtas}
                disabled={!affiliateUrl.trim()}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replaceFlash ? <CheckCircle2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {replaceFlash ? "Links substituidos!" : "Substituir todos CTAs"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{page.ctas.length}</span> CTAs detectados
                {affiliateUrl.trim() ? " — substituindo no preview e no ZIP" : " — insira um link para substituir"}.
              </p>
            </Card>

            <Card title="Conteudo">
              <Field label="Headline" value={headline} onChange={setHeadline} />
              <Field label="Subheadline" value={subheadline} onChange={setSubheadline} />
              <Field label="Texto do CTA" value={ctaText} onChange={setCtaText} />
              <Field label="URL do Logo" value={logo} onChange={setLogo} placeholder="https://.../logo.png" />
              <p className="text-xs text-muted-foreground">Cada campo atualiza o preview ao digitar.</p>
            </Card>

            <Card title="Rastreamento & Pixels">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="h-4 w-4 text-brand" />
                <span className="text-xs text-muted-foreground">Cole scripts de anúncios, analytics ou tags personalizadas.</span>
              </div>
              <TextAreaField label="Código no <head>" value={headTrackingCode} onChange={setHeadTrackingCode} placeholder={'<script>...</script>'} />
              <TextAreaField label="Código no final do <body>" value={bodyTrackingCode} onChange={setBodyTrackingCode} placeholder={'<script>...</script>'} />
              <p className="text-xs text-muted-foreground">Os códigos entram no preview e no HTML/ZIP exportado.</p>
            </Card>

            <Card title="Banner de Cookies & Redirecionamento">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Cookie className="h-4 w-4 text-brand" />
                  <span className="text-sm font-medium">Ativar banner de cookies</span>
                </div>
                <Toggle checked={enableCookieBanner} onChange={setEnableCookieBanner} label="Ativar banner de cookies" />
              </div>
              {enableCookieBanner && (
                <div className="space-y-3">
                  <TextAreaField label="Texto do banner" value={cookieText} onChange={setCookieText} />
                  <Field label="Texto do botão de aceite" value={acceptBtnText} onChange={setAcceptBtnText} />
                  <Field label="Texto do botão de rejeição" value={rejectBtnText} onChange={setRejectBtnText} />
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                    <span className="text-xs font-medium">Redirecionar ao clicar em uma ação</span>
                    <Toggle checked={redirectOnAction} onChange={setRedirectOnAction} label="Redirecionar ao clicar em uma ação" />
                  </div>
                  <label className="block">
                    <span className="block text-xs text-muted-foreground mb-1">Abrir link de afiliado</span>
                    <select value={redirectTarget} onChange={(e) => setRedirectTarget(e.target.value as "_self" | "_blank")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand">
                      <option value="_self">Na mesma aba</option>
                      <option value="_blank">Em nova aba</option>
                    </select>
                  </label>
                  {!affiliateUrl.trim() && <p className="text-xs text-amber-700">Adicione um link de afiliado acima para ativar o redirecionamento.</p>}
                </div>
              )}
            </Card>

            <Card title="Exportar">
              <button
                type="button"
                onClick={onDownloadHtml}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                <Download className="h-4 w-4" /> Baixar HTML
              </button>
              <button
                type="button"
                onClick={() => void onDownloadZip()}
                disabled={exporting || !html}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-60"
              >
                <FileArchive className="h-4 w-4" /> {exporting ? "Empacotando..." : "Baixar ZIP (Netlify)"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                O arquivo e gerado a partir do preview atual ({deviceMeta.label.toLowerCase()}).
              </p>
            </Card>

            <Card title="Detectado">
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Imagens: {page.images.length}</li>
                <li>Videos: {page.videos.length}</li>
                <li>CTAs: {page.ctas.length}</li>
                <li>Beneficios: {page.benefits.length}</li>
                <li>Depoimentos: {page.testimonials.length}</li>
              </ul>
            </Card>
          </aside>

          <section className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div
                role="radiogroup"
                aria-label="Visualizacao do preview"
                className="inline-flex rounded-lg border border-border bg-card p-1"
              >
                {DEVICES.map((item) => (
                  <DeviceBtn
                    key={item.id}
                    active={device === item.id}
                    onClick={() => setDevice(item.id)}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${liveFlash ? "bg-brand" : "bg-emerald-500"}`}
                  aria-hidden
                />
                <span>Preview ao vivo · {deviceMeta.width}px</span>
              </div>
            </div>
            <PreviewFrame html={html} width={deviceMeta.width} device={device} />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PreviewFrame({ html, width, device }: { html: string; width: number; device: Device }) {
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
    if (!iframe) return;
    iframe.srcdoc = html;
  }, [html]);

  const scale = Math.min(1, available > 0 ? available / width : 1);
  const radius = device === "mobile" ? 24 : device === "tablet" ? 16 : 8;

  return (
    <div
      ref={hostRef}
      className="rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex justify-center">
        <div
          style={{
            width: width * scale,
            height: PREVIEW_HEIGHT * scale,
            transition: "width 320ms ease, height 320ms ease",
          }}
        >
          <div
            className="overflow-hidden bg-white shadow-lg"
            style={{
              width,
              height: PREVIEW_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              transition: "width 320ms ease, transform 320ms ease, border-radius 320ms ease",
              borderRadius: radius,
            }}
          >
            <iframe
              ref={iframeRef}
              title="Preview da pagina clonada"
              srcDoc={html || ""}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block mb-3 last:mb-0">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block mb-3 last:mb-0">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        spellCheck={false}
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-slate-300"}`}
    >
      <span className={`mt-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function DeviceBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Smartphone;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
        active ? "bg-brand text-brand-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function ModeBtn({
  active,
  onClick,
  icon: Icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Smartphone;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors duration-200 ${
        active
          ? "border-brand bg-brand/5 ring-1 ring-brand"
          : "border-border hover:border-muted-foreground/40"
      }`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-brand" : "text-muted-foreground"}`} />
      <span className="flex flex-col">
        <span className={`text-sm font-medium ${active ? "text-brand" : "text-foreground"}`}>{label}</span>
        <span className="text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
