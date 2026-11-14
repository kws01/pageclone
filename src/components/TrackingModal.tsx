import { Settings, X, CheckCircle2 } from "lucide-react";

export function TrackingModal({
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
          Cole as tags do Google Ads, Meta Pixel ou outros scripts de rastreamento. Os eventos sao disparados automaticamente a cada etapa do quiz.
        </p>
        <div className="space-y-4">
          <TrackingField label="Codigo no <head>" value={headCode} onChange={onHeadCode} placeholder="<!-- Google Tag Manager, Meta Pixel, etc. -->" />
          <TrackingField label="Codigo no final do <body>" value={bodyCode} onChange={onBodyCode} placeholder="<!-- Conversion scripts, event listeners, etc. -->" />
        </div>
        <div className="mt-4 rounded-lg bg-brand/5 border border-brand/20 px-4 py-3">
          <p className="text-xs font-medium text-brand mb-1.5">Eventos disparados automaticamente:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li><code className="font-mono text-foreground">quiz_start</code> — ao iniciar o quiz</li>
            <li><code className="font-mono text-foreground">quiz_step_1</code> ate <code className="font-mono text-foreground">quiz_step_N</code> — a cada resposta</li>
            <li><code className="font-mono text-foreground">quiz_transition</code> — na tela de carregamento</li>
            <li><code className="font-mono text-foreground">quiz_complete</code> — na pagina de resultado</li>
            <li><code className="font-mono text-foreground">quiz_cta_click</code> — ao clicar no CTA final</li>
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
