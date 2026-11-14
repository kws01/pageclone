import { AddButton, EditorSection, ItemActions, StringListEditor, TextAreaField, TextField, type HybridStageSectionProps } from "@/components/hybrid/HybridFieldControls";
import { HybridImageField } from "@/components/hybrid/HybridImageField";
import { HYBRID_STAGE_LABELS } from "@/config/hybridOptions";
import { duplicateAt, moveAt, patchAt, removeAt } from "@/lib/hybridListOps";
import type { HybridEducationalCard, HybridQuizQuestion } from "@/types/hybridGuide";

const MAX_CARDS = 4;
const MAX_QUESTIONS = 5;
const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

export function CoverSection({ guide, onChange }: HybridStageSectionProps) {
  const { cover } = guide;
  return (
    <EditorSection title={HYBRID_STAGE_LABELS.cover} defaultOpen>
      <TextField
        label="Headline"
        value={cover.headline}
        onChange={(v) => onChange({ ...guide, cover: { ...cover, headline: v } })}
      />
      <TextAreaField
        label="Subheadline"
        value={cover.subheadline}
        onChange={(v) => onChange({ ...guide, cover: { ...cover, subheadline: v } })}
      />
      <TextField
        label="Texto do botão"
        value={cover.buttonText}
        onChange={(v) => onChange({ ...guide, cover: { ...cover, buttonText: v } })}
      />
      <HybridImageField
        label="Imagem principal"
        image={cover.mainImage}
        onChange={(mainImage) => onChange({ ...guide, cover: { ...cover, mainImage } })}
      />
    </EditorSection>
  );
}

export function EducationalSection({ guide, onChange }: HybridStageSectionProps) {
  const { educationalCards } = guide;
  const setCards = (cards: HybridEducationalCard[]) => onChange({ ...guide, educationalCards: cards });

  return (
    <EditorSection title={HYBRID_STAGE_LABELS.educational} description={`${educationalCards.length} de ${MAX_CARDS} cartões`} defaultOpen>
      {educationalCards.map((card, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Cartão {i + 1}</span>
            <ItemActions
              isFirst={i === 0}
              isLast={i === educationalCards.length - 1}
              onMove={(d) => setCards(moveAt(educationalCards, i, d))}
              onDuplicate={() => setCards(duplicateAt(educationalCards, i))}
              duplicateDisabled={educationalCards.length >= MAX_CARDS}
              onRemove={() => setCards(removeAt(educationalCards, i))}
            />
          </div>
          <TextField
            label="Título"
            value={card.title}
            onChange={(v) => setCards(patchAt(educationalCards, i, { title: v }))}
          />
          <TextAreaField
            label="Texto explicativo"
            value={card.body}
            onChange={(v) => setCards(patchAt(educationalCards, i, { body: v }))}
          />
          <TextAreaField
            label="Exemplo prático"
            value={card.practicalExample}
            onChange={(v) => setCards(patchAt(educationalCards, i, { practicalExample: v }))}
          />
          <HybridImageField
            label="Imagem do cartão"
            image={card.image}
            onChange={(image) => setCards(patchAt(educationalCards, i, { image }))}
          />
        </div>
      ))}
      <AddButton
        label="Adicionar cartão"
        disabled={educationalCards.length >= MAX_CARDS}
        onClick={() =>
          setCards([
            ...educationalCards,
            {
              title: "Novo cartão",
              body: "",
              practicalExample: "",
              image: { url: null, alt: "", imagePrompt: "" },
            },
          ])
        }
      />
    </EditorSection>
  );
}

export function QuizSection({ guide, onChange }: HybridStageSectionProps) {
  const { quiz } = guide;
  const setQuiz = (questions: HybridQuizQuestion[]) => onChange({ ...guide, quiz: questions });

  return (
    <EditorSection title={HYBRID_STAGE_LABELS.quiz} description={`${quiz.length} de ${MAX_QUESTIONS} perguntas`} defaultOpen>
      {quiz.map((question, qi) => (
        <div key={qi} className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Pergunta {qi + 1}</span>
            <ItemActions
              isFirst={qi === 0}
              isLast={qi === quiz.length - 1}
              onMove={(d) => setQuiz(moveAt(quiz, qi, d))}
              onDuplicate={() => setQuiz(duplicateAt(quiz, qi))}
              duplicateDisabled={quiz.length >= MAX_QUESTIONS}
              onRemove={() => setQuiz(removeAt(quiz, qi))}
            />
          </div>
          <TextAreaField
            label="Pergunta"
            value={question.question}
            onChange={(v) => setQuiz(patchAt(quiz, qi, { question: v }))}
          />
          <TextField
            label="Indicador de progresso"
            value={question.progressLabel}
            onChange={(v) => setQuiz(patchAt(quiz, qi, { progressLabel: v }))}
            placeholder={`Pergunta ${qi + 1} de ${quiz.length}`}
          />
          <StringListEditor
            label="Alternativas"
            items={question.options.map((o) => o.label)}
            min={MIN_OPTIONS}
            max={MAX_OPTIONS}
            addLabel="Adicionar alternativa"
            onChange={(labels) =>
              setQuiz(
                patchAt(quiz, qi, {
                  options: labels.map((label, oi) => ({
                    id: question.options[oi]?.id ?? `opt_${Date.now()}_${oi}`,
                    label,
                  })),
                }),
              )
            }
          />
        </div>
      ))}
      <AddButton
        label="Adicionar pergunta"
        disabled={quiz.length >= MAX_QUESTIONS}
        onClick={() =>
          setQuiz([
            ...quiz,
            {
              question: "Nova pergunta",
              progressLabel: "",
              options: [
                { id: `opt_${Date.now()}_1`, label: "Opção 1" },
                { id: `opt_${Date.now()}_2`, label: "Opção 2" },
              ],
            },
          ])
        }
      />
    </EditorSection>
  );
}
