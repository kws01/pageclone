import type { CSSProperties } from "react";
import { CheckCircle2, ImageOff } from "lucide-react";
import { getHybridStrings } from "@/config/hybridOptions";
import type { HybridGuideData, HybridImage, ThemeConfig } from "@/types/hybridGuide";

export type PreviewScreen =
  | { kind: "cover" }
  | { kind: "educational"; index: number }
  | { kind: "quiz"; index: number }
  | { kind: "transition" }
  | { kind: "preOffer"; index: number }
  | { kind: "solution" }
  | { kind: "finalCta" };

export function buildPreviewScreens(guide: HybridGuideData): PreviewScreen[] {
  return guide.stageOrder.flatMap((stage): PreviewScreen[] => {
    switch (stage) {
      case "cover":
        return [{ kind: "cover" }];
      case "educational":
        return guide.educationalCards.map((_, index) => ({ kind: "educational", index }));
      case "quiz":
        return guide.quiz.map((_, index) => ({ kind: "quiz", index }));
      case "transition":
        return [{ kind: "transition" }];
      case "preOffer":
        return guide.preOffer.map((_, index) => ({ kind: "preOffer", index }));
      case "solution":
        return [{ kind: "solution" }];
      case "finalCta":
        return [{ kind: "finalCta" }];
    }
  });
}

interface PreviewScreenContentProps {
  guide: HybridGuideData;
  screen: PreviewScreen;
  answers: Record<number, string>;
  ctaHref: string;
  onAnswer: (questionIndex: number, label: string) => void;
  onNext: () => void;
  onRestart: () => void;
}

function cardStyle(theme: ThemeConfig): CSSProperties {
  return {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
  };
}

function headingStyle(theme: ThemeConfig): CSSProperties {
  return { fontFamily: theme.fonts.heading, color: theme.colors.text, lineHeight: 1.2 };
}

function bodyStyle(theme: ThemeConfig): CSSProperties {
  return { color: theme.colors.textMuted, lineHeight: 1.5 };
}

function ScreenImage({ image, theme, notSetLabel }: { image: HybridImage; theme: ThemeConfig; notSetLabel: string }) {
  if (image.url) {
    return (
      <img
        src={image.url}
        alt={image.alt}
        className="h-44 w-full object-cover"
        style={{ borderRadius: theme.radius }}
      />
    );
  }
  return (
    <div
      className="flex h-44 w-full flex-col items-center justify-center gap-1 text-xs"
      style={{ background: theme.colors.border, color: theme.colors.textMuted, borderRadius: theme.radius }}
    >
      <ImageOff className="h-5 w-5" /> {notSetLabel}
    </div>
  );
}

function PrimaryButton({ theme, onClick, children }: { theme: ThemeConfig; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-5 py-3 text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
      style={{ background: theme.colors.primary, color: theme.colors.primaryText, borderRadius: theme.radius }}
    >
      {children}
    </button>
  );
}

export function PreviewScreenContent({ guide, screen, answers, ctaHref, onAnswer, onNext, onRestart }: PreviewScreenContentProps) {
  const { theme } = guide;
  const t = getHybridStrings(guide.project.language);

  if (screen.kind === "cover") {
    return (
      <div className="space-y-5">
        <ScreenImage image={guide.cover.mainImage} theme={theme} notSetLabel={t.imageNotSet} />
        <h2 className="text-2xl font-bold md:text-3xl" style={headingStyle(theme)}>{guide.cover.headline}</h2>
        <p className="text-sm" style={bodyStyle(theme)}>{guide.cover.subheadline}</p>
        <PrimaryButton theme={theme} onClick={onNext}>{guide.cover.buttonText || t.continue}</PrimaryButton>
      </div>
    );
  }

  if (screen.kind === "educational") {
    const card = guide.educationalCards[screen.index];
    return (
      <div className="space-y-5">
        <div className="space-y-4 p-4" style={cardStyle(theme)}>
          <ScreenImage image={card.image} theme={theme} notSetLabel={t.imageNotSet} />
          <h2 className="text-xl font-bold" style={headingStyle(theme)}>{card.title}</h2>
          <p className="text-sm" style={bodyStyle(theme)}>{card.body}</p>
          {card.practicalExample && (
            <div className="p-3 text-sm" style={{ background: theme.colors.background, borderRadius: theme.radius, color: theme.colors.text }}>
              <span className="block text-xs font-semibold uppercase tracking-wide" style={{ color: theme.colors.primary }}>
                {t.practicalExample}
              </span>
              {card.practicalExample}
            </div>
          )}
        </div>
        <PrimaryButton theme={theme} onClick={onNext}>{t.next}</PrimaryButton>
      </div>
    );
  }

  if (screen.kind === "quiz") {
    const question = guide.quiz[screen.index];
    const total = guide.quiz.length;
    const percent = ((screen.index + 1) / total) * 100;
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={bodyStyle(theme)}>
            <span>{question.progressLabel || t.questionOf(screen.index + 1, total)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: theme.colors.border }}>
            <div className="h-full transition-all duration-500" style={{ width: `${percent}%`, background: theme.colors.primary }} />
          </div>
        </div>
        <h2 className="text-xl font-bold" style={headingStyle(theme)}>{question.question}</h2>
        <div className="space-y-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onAnswer(screen.index, option.label)}
              className="w-full px-4 py-3 text-left text-sm font-medium transition hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen.kind === "transition") {
    const answered = guide.quiz
      .map((q, i) => ({ question: q.question, answer: answers[i] }))
      .filter((item) => item.answer);
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-bold" style={headingStyle(theme)}>{guide.transition.title}</h2>
        <p className="text-sm" style={bodyStyle(theme)}>{guide.transition.body}</p>
        {answered.length > 0 && (
          <div className="space-y-2 p-4" style={cardStyle(theme)}>
            <span className="block text-xs font-semibold uppercase tracking-wide" style={{ color: theme.colors.primary }}>
              {t.yourAnswers}
            </span>
            {answered.map((item) => (
              <p key={item.question} className="text-sm" style={{ color: theme.colors.text }}>
                <span style={bodyStyle(theme)}>{item.question}</span>
                <br />
                <strong>{item.answer}</strong>
              </p>
            ))}
          </div>
        )}
        <PrimaryButton theme={theme} onClick={onNext}>{t.continue}</PrimaryButton>
      </div>
    );
  }

  if (screen.kind === "preOffer") {
    const card = guide.preOffer[screen.index];
    return (
      <div className="space-y-5">
        <ScreenImage image={card.image} theme={theme} notSetLabel={t.imageNotSet} />
        <h2 className="text-xl font-bold" style={headingStyle(theme)}>{card.title}</h2>
        <p className="text-sm" style={bodyStyle(theme)}>{card.transitionContent}</p>
        <PrimaryButton theme={theme} onClick={onNext}>{t.continue}</PrimaryButton>
      </div>
    );
  }

  if (screen.kind === "solution") {
    const { solution } = guide;
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-bold" style={headingStyle(theme)}>{solution.productName || t.yourSolution}</h2>
        <ul className="space-y-2">
          {solution.realBenefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm" style={{ color: theme.colors.text }}>
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.colors.primary }} />
              {benefit}
            </li>
          ))}
        </ul>
        {solution.confirmedDifferentials.length > 0 && (
          <div className="space-y-2 p-4" style={cardStyle(theme)}>
            <span className="block text-xs font-semibold uppercase tracking-wide" style={{ color: theme.colors.primary }}>
              {t.keyFeatures}
            </span>
            {solution.confirmedDifferentials.map((item) => (
              <p key={item} className="text-sm" style={{ color: theme.colors.text }}>{item}</p>
            ))}
          </div>
        )}
        <PrimaryButton theme={theme} onClick={onNext}>{t.continue}</PrimaryButton>
      </div>
    );
  }

  const { finalCta } = guide;
  return (
    <div className="space-y-5">
      <p className="text-base font-medium" style={{ ...headingStyle(theme), fontSize: "1.25rem" }}>{finalCta.transitionText}</p>
      {ctaHref ? (
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center px-5 py-3 text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
          style={{ background: theme.colors.primary, color: theme.colors.primaryText, borderRadius: theme.radius }}
        >
          {finalCta.buttonText || t.wantToKnow}
        </a>
      ) : (
        <div
          className="px-5 py-3 text-center text-sm"
          style={{ background: theme.colors.border, color: theme.colors.textMuted, borderRadius: theme.radius }}
        >
          {t.noCtaLink}
        </div>
      )}
      {finalCta.productImage.url && (
        <img
          src={finalCta.productImage.url}
          alt={finalCta.productImage.alt}
          className="h-44 w-full object-cover"
          style={{ borderRadius: theme.radius }}
        />
      )}
      <footer className="mt-8 border-t pt-5 text-center" style={{ borderColor: theme.colors.border }}>
        <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>{t.informationNotice}</p>
        <button type="button" onClick={onRestart} className="mt-3 text-xs font-medium underline-offset-4 hover:underline" style={{ color: theme.colors.primary }}>
          {t.restartGuide}
        </button>
      </footer>
    </div>
  );
}
