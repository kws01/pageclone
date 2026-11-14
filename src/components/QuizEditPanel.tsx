import { useState, useRef } from "react";
import {
  ChevronDown, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, ImageIcon, Upload, Link2, X,
} from "lucide-react";
import type { QuizFunnelData, QuizStyle, QuizQuestion, QuizOption } from "@/services/quizAnalyzer";
import type { ImageCandidate } from "@/parser/extractPage";

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
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

function TextArea({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function ListEditor({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const text = items.join("\n");
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label} <span className="text-[10px]">(1 por linha)</span></span>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        rows={Math.min(Math.max(items.length, 2), 8)}
        spellCheck={false}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export interface QuizEditPanelProps {
  data: QuizFunnelData;
  onChange: (newData: QuizFunnelData) => void;
  style: QuizStyle;
  initialData?: QuizFunnelData;
  imageCandidates?: ImageCandidate[];
}

export function QuizEditPanel({ data, onChange, style, initialData, imageCandidates }: QuizEditPanelProps) {
  const update = (patch: Partial<QuizFunnelData>) => onChange({ ...data, ...patch });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [imgError, setImgError] = useState("");

  const candidates = (imageCandidates || [])
    .filter((c) => (c.w || 0) >= 300)
    .slice(0, 12);

  const handleFileUpload = (file: File) => {
    setImgError("");
    if (!file.type.startsWith("image/")) { setImgError("Selecione um arquivo de imagem."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { setImgError("Erro ao processar imagem."); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        const sizeKb = Math.round(dataUrl.length * 0.75 / 1024);
        if (sizeKb > 150) setImgError(`Imagem otimizada: ${sizeKb} KB (acima de ~150 KB).`);
        update({ landingImageUrl: dataUrl, landingImageAlt: file.name.split(".").slice(0, -1).join(".") || file.name });
      };
      img.onerror = () => setImgError("Não foi possível carregar a imagem.");
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => { update({ landingImageUrl: undefined, landingImageAlt: undefined }); setImgError(""); };

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    const questions = data.questions.map((q, i) => i === idx ? { ...q, ...patch } : q);
    update({ questions });
  };

  const updateOption = (qIdx: number, oIdx: number, patch: Partial<QuizOption>) => {
    const questions = data.questions.map((q, i) => {
      if (i !== qIdx) return q;
      const options = q.options.map((o, j) => j === oIdx ? { ...o, ...patch } : o);
      return { ...q, options };
    });
    update({ questions });
  };

  const addOption = (qIdx: number) => {
    const questions = data.questions.map((q, i) => {
      if (i !== qIdx) return q;
      const newOpt: QuizOption = { id: `opt_${Date.now()}`, title: "Nova opcao", description: "", icon: "🔹" };
      return { ...q, options: [...q.options, newOpt] };
    });
    update({ questions });
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const questions = data.questions.map((q, i) => {
      if (i !== qIdx) return q;
      if (q.options.length <= 2) return q;
      return { ...q, options: q.options.filter((_, j) => j !== oIdx) };
    });
    update({ questions });
  };

  const moveOption = (qIdx: number, oIdx: number, dir: -1 | 1) => {
    const questions = data.questions.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      const ni = oIdx + dir;
      if (ni < 0 || ni >= opts.length) return q;
      [opts[oIdx], opts[ni]] = [opts[ni], opts[oIdx]];
      return { ...q, options: opts };
    });
    update({ questions });
  };

  const addQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}`,
      question: "Nova pergunta",
      subtitle: "",
      options: [
        { id: "o1", title: "Opcao 1", description: "", icon: "🔹" },
        { id: "o2", title: "Opcao 2", description: "", icon: "🔸" },
      ],
    };
    update({ questions: [...data.questions, newQ] });
  };

  const removeQuestion = (qIdx: number) => {
    if (data.questions.length <= 3) return;
    update({ questions: data.questions.filter((_, i) => i !== qIdx) });
  };

  const moveQuestion = (qIdx: number, dir: -1 | 1) => {
    const qs = [...data.questions];
    const ni = qIdx + dir;
    if (ni < 0 || ni >= qs.length) return;
    [qs[qIdx], qs[ni]] = [qs[ni], qs[qIdx]];
    update({ questions: qs });
  };

  const insightEnabled = !!data.insight;
  const toggleInsight = () => {
    if (insightEnabled) {
      update({ insight: undefined });
    } else {
      update({ insight: { lead: "", headline: "", body: "" } });
    }
  };

  const urlValid = isValidUrl(data.ctaUrl);

  const onRestore = () => {
    if (initialData) onChange(initialData);
  };

  return (
    <div className="space-y-2">
      {initialData && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRestore}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar original
          </button>
        </div>
      )}

      <Section title="Imagem de abertura" defaultOpen={!!data.landingImageUrl}>
        {data.landingImageUrl ? (
          <div className="space-y-2">
            <img src={data.landingImageUrl} alt={data.landingImageAlt || ""} className="w-full rounded-lg border border-border max-h-40 object-cover" />
            <TextField label="Texto alternativo" value={data.landingImageAlt || ""} onChange={(v) => update({ landingImageAlt: v })} />
            <button type="button" onClick={removeImage} className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:underline">
              <X className="h-3.5 w-3.5" /> Remover imagem
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.length > 0 && (
              <div>
                <span className="block text-xs text-muted-foreground mb-1.5">Da página</span>
                <div className="grid grid-cols-3 gap-2">
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => update({ landingImageUrl: c.src, landingImageAlt: c.alt })}
                      className="rounded-md border border-border overflow-hidden hover:border-brand transition aspect-video bg-muted/20"
                    >
                      <img src={c.src} alt={c.alt} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="block text-xs text-muted-foreground mb-1.5">Enviar arquivo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent transition">
                <Upload className="h-3.5 w-3.5" /> Escolher imagem
              </button>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1.5">Colar URL</span>
              <div className="flex gap-2">
                <input
                  value={imgUrlInput}
                  onChange={(e) => setImgUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={() => { if (imgUrlInput.trim()) { update({ landingImageUrl: imgUrlInput.trim(), landingImageAlt: "" }); setImgUrlInput(""); } }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition"
                >
                  <Link2 className="h-3.5 w-3.5" /> Usar
                </button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Alguns sites bloqueiam o uso externo de imagens.</p>
            </div>
          </div>
        )}
        {imgError && <p className="text-xs text-amber-600">{imgError}</p>}
      </Section>

      <Section title="Entrada" defaultOpen>
        <TextField label="Headline de entrada" value={data.landingHeadline} onChange={(v) => update({ landingHeadline: v })} />
        <TextField label="Subheadline" value={data.landingSubheadline} onChange={(v) => update({ landingSubheadline: v })} />
        <TextField label="Botao de inicio" value={data.startButtonText} onChange={(v) => update({ startButtonText: v })} />
      </Section>

      <Section title={`Perguntas (${data.questions.length})`}>
        {data.questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-md border border-border p-3 space-y-2 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Pergunta {qIdx + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveQuestion(qIdx, -1)} disabled={qIdx === 0} className="rounded p-1 hover:bg-accent disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => moveQuestion(qIdx, 1)} disabled={qIdx === data.questions.length - 1} className="rounded p-1 hover:bg-accent disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => removeQuestion(qIdx)} disabled={data.questions.length <= 3} className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <TextField label="Texto da pergunta" value={q.question} onChange={(v) => updateQuestion(qIdx, { question: v })} />
            {style === "classic" && (
              <TextField label="Subtitulo" value={q.subtitle} onChange={(v) => updateQuestion(qIdx, { subtitle: v })} />
            )}
            <div className="space-y-2 pt-1">
              <span className="block text-xs text-muted-foreground">Opcoes (min. 2)</span>
              {q.options.map((opt, oIdx) => (
                <div key={opt.id} className="flex items-start gap-2 rounded-md border border-border bg-background p-2">
                  <div className="flex flex-col gap-0.5 pt-1">
                    <button type="button" onClick={() => moveOption(qIdx, oIdx, -1)} disabled={oIdx === 0} className="rounded p-0.5 hover:bg-accent disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                    <button type="button" onClick={() => moveOption(qIdx, oIdx, 1)} disabled={oIdx === q.options.length - 1} className="rounded p-0.5 hover:bg-accent disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        value={opt.icon}
                        onChange={(e) => updateOption(qIdx, oIdx, { icon: e.target.value })}
                        placeholder="icone"
                        className="w-12 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center outline-none focus:ring-2 focus:ring-brand"
                      />
                      <input
                        value={opt.title}
                        onChange={(e) => updateOption(qIdx, oIdx, { title: e.target.value })}
                        placeholder="Texto da opcao"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    {style === "classic" && (
                      <input
                        value={opt.description}
                        onChange={(e) => updateOption(qIdx, oIdx, { description: e.target.value })}
                        placeholder="Descricao (opcional)"
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand"
                      />
                    )}
                  </div>
                  <button type="button" onClick={() => removeOption(qIdx, oIdx)} disabled={q.options.length <= 2} className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-30 mt-1"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => addOption(qIdx)} className="inline-flex items-center gap-1 text-xs text-brand hover:underline"><Plus className="h-3.5 w-3.5" /> Adicionar opcao</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addQuestion} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent transition"><Plus className="h-3.5 w-3.5" /> Adicionar pergunta</button>
      </Section>

      <Section title="Insight" defaultOpen={!!data.insight}>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={insightEnabled} onChange={toggleInsight} className="h-4 w-4 rounded border-input accent-brand" />
          <span>Ativar tela de insight</span>
        </label>
        {insightEnabled && data.insight && (
          <>
            <TextField label="Lead" value={data.insight.lead} onChange={(v) => update({ insight: { ...data.insight!, lead: v } })} />
            <TextField label="Headline" value={data.insight.headline} onChange={(v) => update({ insight: { ...data.insight!, headline: v } })} />
            <TextArea label="Body" value={data.insight.body} onChange={(v) => update({ insight: { ...data.insight!, body: v } })} />
          </>
        )}
      </Section>

      <Section title="Resultado">
        <TextField label="Headline do resultado" value={data.resultHeadline || data.finalHeadline} onChange={(v) => update({ resultHeadline: v, finalHeadline: v })} />
        <TextArea label="Corpo do resultado" value={data.resultBody || data.finalSummary} onChange={(v) => update({ resultBody: v, finalSummary: v })} />
      </Section>

      <Section title="Oferta">
        {data.offer ? (
          <>
            <TextField label="Headline da oferta" value={data.offer.headline} onChange={(v) => update({ offer: { ...data.offer!, headline: v } })} />
            <TextField label="Titulo 'Sem'" value={data.offer.withoutTitle} onChange={(v) => update({ offer: { ...data.offer!, withoutTitle: v } })} />
            <ListEditor label="Itens 'Sem'" items={data.offer.without} onChange={(v) => update({ offer: { ...data.offer!, without: v } })} />
            <TextField label="Titulo 'Com'" value={data.offer.withTitle} onChange={(v) => update({ offer: { ...data.offer!, withTitle: v } })} />
            <ListEditor label="Itens 'Com'" items={data.offer.with} onChange={(v) => update({ offer: { ...data.offer!, with: v } })} />
            <TextField label="Titulo dos recursos" value={data.offer.featuresTitle} onChange={(v) => update({ offer: { ...data.offer!, featuresTitle: v } })} />
            <ListEditor label="Recursos" items={data.offer.features} onChange={(v) => update({ offer: { ...data.offer!, features: v } })} />
            <TextField label="Texto do CTA" value={data.offer.ctaText} onChange={(v) => update({ offer: { ...data.offer!, ctaText: v } })} />
            <TextField label="Texto do CTA secundario" value={data.offer.secondCtaText} onChange={(v) => update({ offer: { ...data.offer!, secondCtaText: v } })} />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Esta oferta nao possui bloco de oferta. Use os campos do estilo Classico abaixo.</p>
        )}
        <TextField label="Texto do CTA (geral)" value={data.ctaText} onChange={(v) => update({ ctaText: v })} />
      </Section>

      <Section title="Fatos">
        <TextField label="Preco" value={data.facts?.price || ""} onChange={(v) => update({ facts: { ...data.facts, price: v } })} />
        <TextField label="Observacao do preco" value={data.facts?.priceNote || ""} onChange={(v) => update({ facts: { ...data.facts, priceNote: v } })} />
        <TextField label="Entrega" value={data.facts?.delivery || ""} onChange={(v) => update({ facts: { ...data.facts, delivery: v } })} />
        <TextField label="Garantia" value={data.facts?.guarantee || ""} onChange={(v) => update({ facts: { ...data.facts, guarantee: v } })} />
      </Section>

      <Section title="Link & Disclaimer">
        <TextField label="Link do CTA (URL)" value={data.ctaUrl} onChange={(v) => update({ ctaUrl: v })} placeholder="https://..." />
        {!urlValid && <p className="text-xs text-red-500">A URL deve comecar com http:// ou https://</p>}
        <TextArea label="Disclaimer" value={data.disclaimer} onChange={(v) => update({ disclaimer: v })} rows={4} />
      </Section>

      {style === "classic" && (
        <Section title="Campos do estilo Classico">
          <TextField label="Headline final" value={data.finalHeadline} onChange={(v) => update({ finalHeadline: v })} />
          <TextField label="Texto ponte (bridge)" value={data.bridgeText} onChange={(v) => update({ bridgeText: v })} />
          <TextField label="Texto de oferta/condicao" value={data.urgencyText} onChange={(v) => update({ urgencyText: v })} />
        </Section>
      )}
    </div>
  );
}
