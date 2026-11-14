import type { ExtractedPage } from "@/parser/extractPage";
import type { AiAnalysis } from "@/services/aiAnalyzer";

export type CloneMode = "full" | "reconstruct";

export interface CloneOptions {
  affiliateUrl?: string;
  title?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  logo?: string;
  mode?: CloneMode;
  aiAnalysis?: AiAnalysis;
  headTrackingCode?: string;
  bodyTrackingCode?: string;
  enableCookieBanner?: boolean;
  cookieText?: string;
  acceptBtnText?: string;
  rejectBtnText?: string;
  redirectOnAction?: boolean;
  redirectTarget?: "_self" | "_blank";
}

export interface CloneContext {
  page: ExtractedPage;
  opts: CloneOptions;
  title: string;
  headline: string;
  subheadline: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  accent: string;
  logo: string;
  aiAnalysis?: AiAnalysis;
}
