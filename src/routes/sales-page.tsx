import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { parseHtmlFromUrl } from "@/parser/htmlParser";
import { extractFromHtml, type ImageCandidate } from "@/parser/extractPage";
import {
  generateSalesPage,
  isAiConfigured,
  type SalesPageData,
  type FieldSource,
  type Review,
} from "@/services/salesPageAnalyzer";
import { generateSalesPageHtml } from "@/export/salesPageTemplate";
import { downloadHtmlFile, slugify } from "@/export/downloadZip";
import JSZip from "jszip";
import {
  Globe, Loader2, AlertCircle, Sparkles, Download,
  Smartphone, Tablet, Monitor, CheckCircle2, FileText,
  ExternalLink, Settings, X, Package, Image as ImageIcon,
} from "lucide-react";

type Device = "mobile" | "tablet" | "desktop";

const DEVICES: { id: Device; label: string; width: number; icon: typeof Smartphone }[] = [
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
];

const PREVIEW_HEIGHT = 720;

async function probeImages(
  candidates: ImageCandidate[],
  max = 12,
  timeoutMs = 4000,
): Promise<ImageCandidate[]> {
  if (candidates.length === 0) return [];
  const subset = candidates.slice(0, max);
  const results = await Promise.all(
    subset.map(
      (c) =>
        new Promise<ImageCandidate>((resolve) => {
          const img = new Image();
          let settled = false;
          const finish = (updated: ImageCandidate) => {
            if (settled) return;
            settled = true;
            resolve(updated);
          };
          img.onload = () => {
            finish({
              ...c,
              w: img.naturalWidth || undefined,
              h: img.naturalHeight || undefined,
            });
          };
          img.onerror = () => finish({ ...c, w: undefined, h: undefined });
          img.src = c.src;
          setTimeout(() => finish({ ...c, w: undefined, h: undefined }), timeoutMs);
        }),
    ),
  );
  return results.filter((c) => {
    if (!c.w || !c.h) return false;
    if (c.w < 200 || c.h < 200) return false;
    const ratio = c.w / c.h;
    if (ratio > 3.5 || ratio < 0.28) return false;
    return true;
  });
}

function scoreCandidate(c: ImageCandidate): number {
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

export default function SalesPageGenerator() {
  const [productUrl, setProductUrl] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [pageData, setPageData] = useState<SalesPageData | null>(null);
  const [device, setDevice] = useState<Device>("mobile");
  const [exporting, setExporting] = useState(false);
  const [headCode, setHeadCode] = useState("");
  const [bodyCode, setBodyCode] = useState("");
  const [editing, setEditing] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [probing, setProbing] = useState(false);

  const onGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");
    if (!productUrl.trim()) return;
    if (!affiliateUrl.trim()) {
      setError("Insira o link de afiliado para gerar a pagina.");
      return;
    }
    setLoading(true);
    setPageData(null);
    try {
      const parsed = await parseHtmlFromUrl(productUrl);
      let page = extractFromHtml(parsed.rawHtml, parsed.url, parsed);

      setProbing(true);
      const probed = await probeImages(page.imageCandidates);
      const scored = probed
        .map((c) => ({ ...c, score: scoreCandidate(c) }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));
      page = { ...page, imageCandidates: scored };
      setProbing(false);

      const result = await generateSalesPage(page, affiliateUrl.trim());
      setPageData({
        ...result.data,
        imageCandidates: scored,
      });
      if (result.warning) setWarning(result.warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar pagina");
    } finally {
      setLoading(false);
      setProbing(false);
    }
  }, [productUrl, affiliateUrl]);

  const html = useMemo(() => {
    if (!pageData) return "";
    return generateSalesPageHtml(pageData, { headCode, bodyCode });
  }, [pageData, headCode, bodyCode]);

  const htmlRef = useRef(html);
  htmlRef.current = html;

  const onDownloadHtml = useCallback(() => {
    downloadHtmlFile(htmlRef.current, "sales-page.html");
  }, []);

  const onDownloadZip = useCallback(async () => {
    setExporting(true);
    try {
      const salesHtml = htmlRef.current;
      const zip = new JSZip();
      zip.file("index.html", salesHtml);
      zip.file("netlify.toml", "[build]\n  publish = \".\"\n\n[[redirects]]\n  from = \"/*\"\n  to = \"/index.html\"\n  status = 200\n");
      zip.file("_redirects", "/*    /index.html   200\n");
      zip.file("README.md", `# ${pageData?.productName || "Sales Page"}\n\nDirect Response sales page generated by PageClone AI.\n\n## Deploy\n1. Extract this ZIP\n2. Upload to Netlify Drop, Vercel, or any static host\n`);
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const name = slugify(pageData?.productName || "sales-page");
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
  }, [pageData]);

  const onTestNewTab = useCallback(() => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(htmlRef.current);
      w.document.close();
    }
  }, []);

  const deviceMeta = DEVICES.find((d) => d.id === device) ?? DEVICES[0];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-brand" />
            Pagina de Vendas Direct Response
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere uma landing page / presell de alta conversao com IA a partir da URL do produto.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Configuracao da Pagina</h3>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? (probing ? "Medindo imagens..." : "Gerando pagina...") : "Analisar e Gerar Pagina com IA"}
                </button>
                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
                  </div>
                )}
                {!isAiConfigured() && !error && (
                  <p className="text-xs text-amber-600">
                    Sem chave de IA configurada, a pagina sera gerada com template padrao.
                  </p>
                )}
              </form>
            </div>

            {pageData && (
              <>
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Pagina Gerada
                  </h3>
                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    <li><span className="font-medium text-foreground">{pageData.productName}</span></li>
                    <li>Nicho: {pageData.niche}</li>
                    <li>Bullets: {pageData.bullets.length}</li>
                    <li>Beneficios: {pageData.benefits.length}</li>
                    <li>Imagens candidatas: {pageData.imageCandidates.length}</li>
                    <li>Hero: {pageData.heroImage ? "selecionada" : "nenhuma"}</li>
                    <li>Foto do produto: {pageData.productHeroImage ? "selecionada" : "nenhuma"}</li>
                    <li>Garantia: {pageData.guaranteeText ? `${pageData.guaranteeDays ?? "?"} dias` : "nao detectada"}</li>
                    <li>Ofertas: {pageData.packages.filter(p => p.price).length} com preco</li>
                    <li>Avaliacao: {pageData.rating ? `${pageData.rating}/5` : "nao detectada"}</li>
                    <li>Depoimentos: {pageData.testimonials.length}</li>
                    <li>Avaliacoes: {pageData.reviews.length}</li>
                    <li>Analise editorial: {pageData.editorialAnalysis ? "gerada" : "nao"}</li>
                    <li>Tabela comparativa: {pageData.comparisonRows.length} linhas</li>
                    <li>"Is This For You": {pageData.isForYou.length} itens</li>
                    <li>Cena noturna: {pageData.eveningScene ? "gerada" : "nao"}</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setEditing((v) => !v)}
                    className="mt-3 w-full text-xs text-brand hover:underline"
                  >
                    {editing ? "Fechar edicao" : "Editar conteudo da pagina"}
                  </button>
                </div>

                {editing && pageData && (
                  <EditPanel
                    data={pageData}
                    onChange={setPageData}
                  />
                )}
              </>
            )}
          </aside>

          <section className="min-w-0">
            {!pageData && !loading && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-16 text-center" style={{ minHeight: 400 }}>
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold">Nenhuma pagina gerada ainda</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Cole a URL do produto, seu link de afiliado e clique em gerar. A IA criara uma landing page de alta conversao.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 p-16 text-center" style={{ minHeight: 400 }}>
                <Loader2 className="h-10 w-10 animate-spin text-brand mb-4" />
                <h2 className="text-lg font-semibold">
                  {probing ? "Medindo imagens no navegador..." : "Gerando pagina com IA..."}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {probing
                    ? "Carregando cada candidato para obter dimensoes reais e descartar banners."
                    : "Analisando o produto e criando copy, bullets e CTA."}
                </p>
              </div>
            )}

            {pageData && (
              <>
                {warning && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{warning}</span>
                  </div>
                )}

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
                <SalesPreview html={html} width={deviceMeta.width} device={device} />
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
    </div>
  );
}

function EditPanel({
  data,
  onChange,
}: {
  data: SalesPageData;
  onChange: (next: SalesPageData) => void;
}) {
  const update = <K extends keyof SalesPageData>(key: K, value: SalesPageData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-brand" />
        Editar Pagina
      </h3>

      <div className="space-y-3">
        <EditFieldWithSource label="Hook headline" value={data.hookHeadline} onChange={(v) => update("hookHeadline", v)} source={data.fieldSources.hookHeadline} />
        <EditFieldWithSource label="Hook subheadline" value={data.hookSubheadline} onChange={(v) => update("hookSubheadline", v)} source={data.fieldSources.hookSubheadline} />
        <EditFieldWithSource label="Introducao do produto" value={data.productIntro} onChange={(v) => update("productIntro", v)} source="ai" />
        <EditFieldWithSource label="Texto do CTA" value={data.ctaText} onChange={(v) => update("ctaText", v)} source="ai" />
        <EditFieldWithSource label="Oferta/Condicao" value={data.urgencyText} onChange={(v) => update("urgencyText", v)} source="ai" />
        <EditField label="Nome do produto (aviso de publicidade)" value={data.adProductName ?? data.productName} onChange={(v) => update("adProductName", v)} />
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Garantia</h4>
          <SourceLabel source={data.fieldSources.guaranteeText} />
        </div>
        <EditField label="Texto da garantia" value={data.guaranteeText} onChange={(v) => update("guaranteeText", v)} />
        <p className="text-xs text-muted-foreground">
          {data.guaranteeDays !== null ? `${data.guaranteeDays} dias detectados na pagina original.` : "Nenhuma garantia detectada na pagina original."}
        </p>
      </div>

      <div className="border-t border-border pt-3 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logo</h4>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">URL da logo (ou vazio para texto da marca)</span>
          <input
            value={data.logoImage}
            onChange={(e) => update("logoImage", e.target.value)}
            placeholder="https://...  (vazio = Sem logo)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <button
          type="button"
          onClick={() => update("logoImage", "")}
          className="w-full text-xs rounded-md border border-border px-3 py-2 hover:bg-accent transition"
        >
          Sem logo (usar texto da marca)
        </button>
      </div>

      <div className="border-t border-border pt-3 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Imagem Hero</h4>
        <ImagePicker
          candidates={data.imageCandidates}
          selected={data.heroImage}
          onSelect={(src) => update("heroImage", src)}
        />
      </div>

      <div className="border-t border-border pt-3 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto do Produto</h4>
        <ImagePicker
          candidates={data.imageCandidates}
          selected={data.productHeroImage}
          onSelect={(src) => update("productHeroImage", src)}
        />
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!data.showMediaLogos}
            onChange={(e) => update("showMediaLogos", e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span>Mostrar "As Seen On"</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Exibe a barra de logos de veiculos de midia. Padrão desligado.
        </p>
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avaliacoes de Clientes</h4>
        <p className="text-xs text-muted-foreground">
          Cole avaliacoes reais no formato: Nome | Texto do depoimento | Local (uma por linha).
        </p>
        <textarea
          value={data.reviews.map((rv) => `${rv.author} | ${rv.text} | ${rv.location || ""}`).join("\n")}
          onChange={(e) => {
            const lines = e.target.value.split("\n").filter((l) => l.trim());
            const parsed: Review[] = lines.map((line) => {
              const parts = line.split("|").map((p) => p.trim());
              return { author: parts[0] || "", text: parts[1] || "", location: parts[2] || undefined };
            }).filter((rv) => rv.author && rv.text);
            update("reviews", parsed);
          }}
          rows={5}
          placeholder="Joao Silva | Otimo produto, recomendo. | Sao Paulo&#10;Maria | Funcionou bem para mim. | Rio de Janeiro"
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Concorrente (opcional)</h4>
        <p className="text-xs text-muted-foreground">
          Nome do concorrente para a tabela comparativa. Se vazio, usa "Traditional Solutions".
        </p>
        <input
          value={data.competitorName}
          onChange={(e) => update("competitorName", e.target.value)}
          placeholder="Ex: Nome do concorrente"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
    </div>
  );
}

function ImagePicker({
  candidates,
  selected,
  onSelect,
}: {
  candidates: ImageCandidate[];
  selected: string | null;
  onSelect: (src: string | null) => void;
}) {
  if (candidates.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhuma imagem candidata disponivel.</p>;
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`w-full text-xs rounded-md border px-3 py-2 transition ${
          selected === null
            ? "border-brand bg-brand/10 text-brand"
            : "border-border hover:bg-accent"
        }`}
      >
        Nenhuma
      </button>
      <div className="grid grid-cols-3 gap-2">
        {candidates.map((c) => {
          const isActive = selected === c.src;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.src)}
              className={`relative rounded-md border overflow-hidden aspect-square bg-muted/30 transition ${
                isActive ? "border-brand ring-2 ring-brand/40" : "border-border hover:border-brand/50"
              }`}
              title={c.alt || c.src}
            >
              <img
                src={c.src}
                alt={c.alt || ""}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">
                {c.id}
                {c.w && c.h ? ` · ${c.w}x${c.h}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrackingModal({
  headCode,
  bodyCode,
  onHeadCode,
  onBodyCode,
  onClose,
}: {
  headCode: string;
  bodyCode: string;
  onHeadCode: (v: string) => void;
  onBodyCode: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Rastreamento e Pixels">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-brand" />
            Rastreamento & Pixels
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Cole as tags do Google Ads, Meta Pixel ou outros scripts de rastreamento. Os eventos sao disparados automaticamente.
        </p>
        <div className="space-y-4">
          <TrackingField label="Codigo no <head>" value={headCode} onChange={onHeadCode} placeholder="<!-- Google Tag Manager, Meta Pixel, etc. -->" />
          <TrackingField label="Codigo no final do <body>" value={bodyCode} onChange={onBodyCode} placeholder="<!-- Conversion scripts, event listeners, etc. -->" />
        </div>
        <div className="mt-4 rounded-lg bg-brand/5 border border-brand/20 px-4 py-3">
          <p className="text-xs font-medium text-brand mb-1.5">Eventos disparados automaticamente:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li><code className="font-mono text-foreground">sales_page_view</code> — ao carregar a pagina</li>
            <li><code className="font-mono text-foreground">sales_cta_click</code> — ao clicar no CTA</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          <CheckCircle2 className="h-4 w-4" /> Salvar e Fechar
        </button>
      </div>
    </div>
  );
}

function TrackingField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        spellCheck={false}
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function SalesPreview({ html, width, device }: { html: string; width: number; device: Device }) {
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
              title="Sales page preview"
              srcDoc={html || ""}
              sandbox="allow-same-origin allow-scripts allow-popups"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function SourceLabel({ source }: { source: FieldSource }) {
  const labels: Record<FieldSource, { text: string; cls: string }> = {
    extracted: { text: "Extraido", cls: "bg-emerald-100 text-emerald-700" },
    ai: { text: "IA", cls: "bg-blue-100 text-blue-700" },
    missing: { text: "Faltando", cls: "bg-amber-100 text-amber-700" },
  };
  const { text, cls } = labels[source] || labels.missing;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{text}</span>;
}

function EditFieldWithSource({ label, value, onChange, source }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  source?: FieldSource;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        {source && <SourceLabel source={source} />}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
