export const HYBRID_NICHES = ["beauty", "health", "finance", "relationship"] as const;

export type HybridNiche = (typeof HYBRID_NICHES)[number];

export interface ThemeConfig {
  id: HybridNiche;
  label: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    primaryText: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    googleFontsUrl: string;
  };
  radius: string;
  shadow: string;
}

export interface HybridImage {
  url: string | null;
  alt: string;
  imagePrompt: string;
}

export interface HybridProject {
  offerUrl: string;
  ctaUrl: string;
  affiliateUrl: string;
  language: string;
  country: string;
  strategicAngle: string;
  niche: HybridNiche;
}

export interface HybridTracking {
  metaPixelId: string;
  googleAdsTagId: string;
}

export interface HybridCover {
  headline: string;
  subheadline: string;
  mainImage: HybridImage;
  buttonText: string;
}

export interface HybridEducationalCard {
  title: string;
  body: string;
  practicalExample: string;
  image: HybridImage;
}

export interface HybridQuizOption {
  id: string;
  label: string;
}

export interface HybridQuizQuestion {
  question: string;
  options: HybridQuizOption[];
  progressLabel: string;
}

export interface HybridTransition {
  title: string;
  body: string;
}

export interface HybridPreOfferCard {
  title: string;
  transitionContent: string;
  image: HybridImage;
}

export interface HybridSolution {
  productName: string;
  realBenefits: string[];
  confirmedDifferentials: string[];
}

export interface HybridFinalCta {
  transitionText: string;
  buttonText: string;
  productImage: HybridImage;
}

export const HYBRID_STAGE_IDS = ["cover", "educational", "quiz", "transition", "preOffer", "solution", "finalCta"] as const;

export type HybridStageId = (typeof HYBRID_STAGE_IDS)[number];

export interface HybridVisualSpecItem {
  stage: HybridStageId;
  visualConcept: string;
  imagePrompt: string;
}

export interface HybridGuideData {
  project: HybridProject;
  stageOrder: HybridStageId[];
  cover: HybridCover;
  educationalCards: HybridEducationalCard[];
  quiz: HybridQuizQuestion[];
  transition: HybridTransition;
  preOffer: HybridPreOfferCard[];
  solution: HybridSolution;
  finalCta: HybridFinalCta;
  tracking: HybridTracking;
  visualSpec: HybridVisualSpecItem[];
  theme: ThemeConfig;
}
