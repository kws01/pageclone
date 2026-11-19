import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet } from "lucide-react";
import { buildPreviewScreens, PreviewScreenContent } from "@/components/hybrid/HybridPreviewScreens";
import { getHybridStrings } from "@/config/hybridOptions";
import type { HybridGuideData } from "@/types/hybridGuide";

const FONTS_LINK_ID = "hybrid-theme-fonts";
const MOBILE_WIDTH = 375;
const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1024;

type PreviewDevice = "mobile" | "tablet" | "desktop";
const DEVICE_WIDTHS: Record<PreviewDevice, number> = { mobile: MOBILE_WIDTH, tablet: TABLET_WIDTH, desktop: DESKTOP_WIDTH };

interface HybridPreviewProps {
  guide: HybridGuideData;
}

export function HybridPreview({ guide }: HybridPreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>("mobile");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const { theme } = guide;
  const t = getHybridStrings(guide.project.language);
  const screens = useMemo(() => buildPreviewScreens(guide), [guide]);
  const current = Math.min(index, screens.length - 1);
  const screen = screens[current];
  const isLast = current >= screens.length - 1;
  const ctaHref = guide.project.affiliateUrl || guide.project.ctaUrl;

  useEffect(() => {
    let link = document.getElementById(FONTS_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = FONTS_LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = theme.fonts.googleFontsUrl;
  }, [theme.fonts.googleFontsUrl]);

  const goNext = () => setIndex((i) => Math.min(i + 1, screens.length - 1));
  const goBack = () => setIndex((i) => Math.max(i - 1, 0));
  const restart = () => {
    setIndex(0);
    setAnswers({});
  };
  const answer = (questionIndex: number, label: string) => {
    setAnswers((current) => ({ ...current, [questionIndex]: label }));
    goNext();
  };

  const progress = screens.length > 1 ? (current / (screens.length - 1)) * 100 : 100;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Prévia interativa</p>
        <div role="group" aria-label="Dispositivo" className="inline-flex rounded-md border border-border bg-card p-0.5">
          {(
            [
              { id: "mobile", label: "Mobile", Icon: Smartphone },
              { id: "tablet", label: "Tablet", Icon: Tablet },
              { id: "desktop", label: "Desktop", Icon: Monitor },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${
                device === id ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="flex min-h-[640px] w-full flex-col overflow-hidden border shadow-xl transition-all duration-300"
          style={{
            maxWidth: DEVICE_WIDTHS[device],
            background: theme.colors.background,
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
            borderColor: theme.colors.border,
            borderRadius: device === "mobile" ? 32 : 16,
          }}
        >
          <div className="h-1 w-full" style={{ background: theme.colors.border }}>
            <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: theme.colors.primary }} />
          </div>

          <div className="flex-1 p-5 md:p-8">
            <PreviewScreenContent
              key={current}
              guide={guide}
              screen={screen}
              answers={answers}
              ctaHref={ctaHref}
              onAnswer={answer}
              onNext={goNext}
              onRestart={restart}
            />
          </div>

          <div className="flex items-center justify-between border-t p-4" style={{ borderColor: theme.colors.border }}>
            <button
              type="button"
              onClick={goBack}
              disabled={current === 0}
              className="inline-flex items-center gap-1 text-xs font-medium disabled:opacity-30"
              style={{ color: theme.colors.text }}
            >
              <ChevronLeft className="h-4 w-4" /> {t.back}
            </button>
            <span className="text-xs" style={{ color: theme.colors.textMuted }}>
              {current + 1} / {screens.length}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              className="inline-flex items-center gap-1 text-xs font-medium disabled:opacity-30"
              style={{ color: theme.colors.text }}
            >
              {t.forward} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
