import type { ComponentType } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { THEMES } from "@/config/themes";
import { EditorSection, TextField, type HybridStageSectionProps } from "@/components/hybrid/HybridFieldControls";
import { CoverSection, EducationalSection, QuizSection } from "@/components/hybrid/HybridOpeningFields";
import {
  FinalCtaSection,
  PreOfferSection,
  SolutionSection,
  TransitionSection,
  VisualSpecSection,
} from "@/components/hybrid/HybridClosingFields";
import { moveAt } from "@/lib/hybridListOps";
import { HYBRID_NICHES, type HybridGuideData, type HybridNiche, type HybridStageId } from "@/types/hybridGuide";

const STAGE_SECTIONS: Record<HybridStageId, ComponentType<HybridStageSectionProps>> = {
  cover: CoverSection,
  educational: EducationalSection,
  quiz: QuizSection,
  transition: TransitionSection,
  preOffer: PreOfferSection,
  solution: SolutionSection,
  finalCta: FinalCtaSection,
};

const moveButtonClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30";

interface HybridEditorPanelProps {
  guide: HybridGuideData;
  onChange: (guide: HybridGuideData) => void;
}

export function HybridEditorPanel({ guide, onChange }: HybridEditorPanelProps) {
  const selectTheme = (niche: HybridNiche) =>
    onChange({ ...guide, project: { ...guide.project, niche }, theme: THEMES[niche] });

  const moveStage = (index: number, delta: -1 | 1) =>
    onChange({ ...guide, stageOrder: moveAt(guide.stageOrder, index, delta) });

  return (
    <div className="space-y-4">
      <EditorSection title="Tema visual" description={guide.theme.label} defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          {HYBRID_NICHES.map((niche) => {
            const theme = THEMES[niche];
            const active = guide.theme.id === niche;
            return (
              <button
                key={niche}
                type="button"
                aria-pressed={active}
                onClick={() => selectTheme(niche)}
                className={`rounded-lg border p-3 text-left transition hover:bg-accent ${
                  active ? "border-brand ring-2 ring-brand" : "border-border"
                }`}
              >
                <span className="flex gap-1.5">
                  <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: theme.colors.primary }} />
                  <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: theme.colors.accent }} />
                </span>
                <span className="mt-2 block text-xs font-medium">{theme.label}</span>
              </button>
            );
          })}
        </div>
      </EditorSection>

      {guide.stageOrder.map((stage, index) => {
        const Section = STAGE_SECTIONS[stage];
        const isFirst = index === 0;
        const isLast = index === guide.stageOrder.length - 1;
        return (
          <div key={stage} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Section guide={guide} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-1 pt-3">
              <button
                type="button"
                aria-label="Mover etapa para cima"
                title="Mover etapa para cima"
                disabled={isFirst}
                onClick={() => moveStage(index, -1)}
                className={moveButtonClass}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Mover etapa para baixo"
                title="Mover etapa para baixo"
                disabled={isLast}
                onClick={() => moveStage(index, 1)}
                className={moveButtonClass}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      <VisualSpecSection guide={guide} onChange={onChange} />

      <EditorSection title="Rastreamento e pixels" description="Meta Pixel e Google Ads para o guia exportado">
        <TextField
          label="Meta Pixel ID"
          value={guide.tracking.metaPixelId}
          onChange={(v) => onChange({ ...guide, tracking: { ...guide.tracking, metaPixelId: v.trim() } })}
          placeholder="Ex.: 123456789012345"
        />
        <TextField
          label="Google Ads Tag ID"
          value={guide.tracking.googleAdsTagId}
          onChange={(v) => onChange({ ...guide, tracking: { ...guide.tracking, googleAdsTagId: v.trim() } })}
          placeholder="Ex.: AW-123456789"
        />
      </EditorSection>
    </div>
  );
}
