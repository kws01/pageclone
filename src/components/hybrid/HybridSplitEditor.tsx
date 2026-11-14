import { useState } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { HybridEditorPanel } from "@/components/hybrid/HybridEditorPanel";
import { HybridPreview } from "@/components/hybrid/HybridPreview";
import { downloadHybridGuideZip } from "@/utils/exportHybridZip";
import type { HybridGuideData } from "@/types/hybridGuide";

interface HybridSplitEditorProps {
  guide: HybridGuideData;
  onChange: (guide: HybridGuideData) => void;
  onBack: () => void;
}

export function HybridSplitEditor({ guide, onChange, onBack }: HybridSplitEditorProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const handleExport = async () => {
    setExporting(true);
    setExportError("");
    try {
      await downloadHybridGuideZip(guide);
    } catch {
      setExportError("Não foi possível gerar o ZIP. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Hybrid Discovery Guide</p>
          <h2 className="truncate text-lg font-semibold">{guide.cover.headline || "Guia sem título"}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao formulário
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Exportar ZIP
          </button>
        </div>
        {exportError && <p className="w-full text-xs text-red-600">{exportError}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
          <HybridEditorPanel guide={guide} onChange={onChange} />
        </div>
        <div className="min-w-0 lg:sticky lg:top-20">
          <HybridPreview guide={guide} />
        </div>
      </div>
    </div>
  );
}
