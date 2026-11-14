import { AddButton, EditorSection, ItemActions, StringListEditor, TextAreaField, TextField, type HybridStageSectionProps } from "@/components/hybrid/HybridFieldControls";
import { HybridImageField } from "@/components/hybrid/HybridImageField";
import { HYBRID_STAGE_LABELS } from "@/config/hybridOptions";
import { duplicateAt, moveAt, patchAt, removeAt } from "@/lib/hybridListOps";
import type { HybridPreOfferCard } from "@/types/hybridGuide";

const MAX_PREOFFER_CARDS = 2;

export function TransitionSection({ guide, onChange }: HybridStageSectionProps) {
  const { transition } = guide;
  return (
    <EditorSection title={HYBRID_STAGE_LABELS.transition} description="Texto contextualizado pelas respostas do quiz">
      <TextField
        label="Título"
        value={transition.title}
        onChange={(v) => onChange({ ...guide, transition: { ...transition, title: v } })}
      />
      <TextAreaField
        label="Texto"
        rows={4}
        value={transition.body}
        onChange={(v) => onChange({ ...guide, transition: { ...transition, body: v } })}
      />
    </EditorSection>
  );
}

export function PreOfferSection({ guide, onChange }: HybridStageSectionProps) {
  const { preOffer } = guide;
  const setPreOffer = (cards: HybridPreOfferCard[]) => onChange({ ...guide, preOffer: cards });

  return (
    <EditorSection title={HYBRID_STAGE_LABELS.preOffer} description={`${preOffer.length} de ${MAX_PREOFFER_CARDS} cartões`}>
      {preOffer.map((card, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Cartão {i + 1}</span>
            <ItemActions
              isFirst={i === 0}
              isLast={i === preOffer.length - 1}
              onMove={(d) => setPreOffer(moveAt(preOffer, i, d))}
              onDuplicate={() => setPreOffer(duplicateAt(preOffer, i))}
              duplicateDisabled={preOffer.length >= MAX_PREOFFER_CARDS}
              onRemove={() => setPreOffer(removeAt(preOffer, i))}
            />
          </div>
          <TextField
            label="Título"
            value={card.title}
            onChange={(v) => setPreOffer(patchAt(preOffer, i, { title: v }))}
          />
          <TextAreaField
            label="Conteúdo de transição"
            value={card.transitionContent}
            onChange={(v) => setPreOffer(patchAt(preOffer, i, { transitionContent: v }))}
          />
          <HybridImageField
            label="Imagem do cartão"
            image={card.image}
            onChange={(image) => setPreOffer(patchAt(preOffer, i, { image }))}
          />
        </div>
      ))}
      <AddButton
        label="Adicionar cartão"
        disabled={preOffer.length >= MAX_PREOFFER_CARDS}
        onClick={() =>
          setPreOffer([
            ...preOffer,
            {
              title: "Novo cartão",
              transitionContent: "",
              image: { url: null, alt: "", imagePrompt: "" },
            },
          ])
        }
      />
    </EditorSection>
  );
}

export function SolutionSection({ guide, onChange }: HybridStageSectionProps) {
  const { solution } = guide;
  return (
    <EditorSection title={HYBRID_STAGE_LABELS.solution} description="Somente benefícios e diferenciais confirmados">
      <TextField
        label="Nome do produto"
        value={solution.productName}
        onChange={(v) => onChange({ ...guide, solution: { ...solution, productName: v } })}
      />
      <StringListEditor
        label="Benefícios reais"
        items={solution.realBenefits}
        addLabel="Adicionar benefício"
        onChange={(items) => onChange({ ...guide, solution: { ...solution, realBenefits: items } })}
      />
      <StringListEditor
        label="Diferenciais confirmados"
        items={solution.confirmedDifferentials}
        addLabel="Adicionar diferencial"
        onChange={(items) => onChange({ ...guide, solution: { ...solution, confirmedDifferentials: items } })}
      />
    </EditorSection>
  );
}

export function FinalCtaSection({ guide, onChange }: HybridStageSectionProps) {
  const { finalCta } = guide;
  return (
    <EditorSection title={HYBRID_STAGE_LABELS.finalCta} description="Botão que leva ao link de afiliado">
      <HybridImageField
        label="Imagem do produto"
        image={finalCta.productImage}
        onChange={(productImage) => onChange({ ...guide, finalCta: { ...finalCta, productImage } })}
      />
      <TextAreaField
        label="Texto de transição"
        value={finalCta.transitionText}
        onChange={(v) => onChange({ ...guide, finalCta: { ...finalCta, transitionText: v } })}
      />
      <TextField
        label="Texto do botão"
        value={finalCta.buttonText}
        onChange={(v) => onChange({ ...guide, finalCta: { ...finalCta, buttonText: v } })}
      />
    </EditorSection>
  );
}

export function VisualSpecSection({ guide, onChange }: HybridStageSectionProps) {
  const { visualSpec } = guide;
  return (
    <EditorSection title="Especificação visual" description="Conceitos e prompts de imagem por etapa">
      {visualSpec.map((item, i) => (
        <div key={`${item.stage}-${i}`} className="space-y-3 rounded-lg border border-border p-3">
          <span className="text-xs font-semibold">{HYBRID_STAGE_LABELS[item.stage] ?? item.stage}</span>
          <TextAreaField
            label="Conceito visual"
            value={item.visualConcept}
            onChange={(v) => onChange({ ...guide, visualSpec: patchAt(visualSpec, i, { visualConcept: v }) })}
          />
          <TextAreaField
            label="Prompt de imagem"
            value={item.imagePrompt}
            onChange={(v) => onChange({ ...guide, visualSpec: patchAt(visualSpec, i, { imagePrompt: v }) })}
          />
        </div>
      ))}
    </EditorSection>
  );
}
