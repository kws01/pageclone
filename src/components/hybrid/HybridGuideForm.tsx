import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { THEMES } from "@/config/themes";
import { HYBRID_ANGLES, HYBRID_LANGUAGES, type HybridAngle } from "@/config/hybridOptions";
import { SelectField, TextField } from "@/components/hybrid/HybridFieldControls";
import type { HybridNiche } from "@/types/hybridGuide";

export interface HybridFormValues {
  offerUrl: string;
  ctaUrl: string;
  angle: HybridAngle;
  niche: HybridNiche | "auto";
  language: string;
}

interface HybridGuideFormProps {
  loading: boolean;
  error: string;
  onSubmit: (values: HybridFormValues) => void;
}

const DEFAULT_VALUES: HybridFormValues = {
  offerUrl: "",
  ctaUrl: "",
  angle: "Guided Discovery",
  niche: "auto",
  language: "auto",
};

const ANGLE_OPTIONS = HYBRID_ANGLES.map((a) => ({ value: a, label: a }));
const NICHE_OPTIONS = [
  { value: "auto", label: "Auto-detectar pela IA" },
  ...Object.values(THEMES).map((t) => ({ value: t.id, label: t.label })),
];
const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Detectar pelo site" },
  ...HYBRID_LANGUAGES.map((l) => ({ value: l.code, label: l.name })),
];

export function HybridGuideForm({ loading, error, onSubmit }: HybridGuideFormProps) {
  const [values, setValues] = useState<HybridFormValues>(DEFAULT_VALUES);
  const [localError, setLocalError] = useState("");

  const update = <K extends keyof HybridFormValues>(key: K, value: HybridFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!values.offerUrl.trim()) {
      setLocalError("Informe a URL do produto para continuar.");
      return;
    }
    setLocalError("");
    onSubmit(values);
  };

  const message = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="URL do produto/oferta"
          type="url"
          value={values.offerUrl}
          onChange={(v) => update("offerUrl", v)}
          placeholder="https://exemplo.com/produto"
          hint="A IA identificará o tema e o idioma da página automaticamente."
        />
        <TextField
          label="URL de destino do CTA/advertorial"
          type="url"
          value={values.ctaUrl}
          onChange={(v) => update("ctaUrl", v)}
          placeholder="https://seu-advertorial.com"
        />
        <SelectField
          label="Ângulo estratégico"
          value={values.angle}
          onChange={(v) => update("angle", v as HybridAngle)}
          options={ANGLE_OPTIONS}
        />
        <SelectField
          label="Tema visual por nicho"
          value={values.niche}
          onChange={(v) => update("niche", v as HybridNiche | "auto")}
          options={NICHE_OPTIONS}
        />
        <SelectField
          label="Idioma do guia"
          value={values.language}
          onChange={(v) => update("language", v)}
          options={LANGUAGE_OPTIONS}
        />
      </div>

      {message && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Gerando guia...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Analyze Product & Generate Hybrid Guide
          </>
        )}
      </button>
    </form>
  );
}
