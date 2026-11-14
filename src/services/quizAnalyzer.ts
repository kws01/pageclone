import type { ExtractedPage } from "@/parser/extractPage";
import { callGeminiJson, isGeminiConfigured } from "@/services/geminiClient";

export type QuizAngle = "educational" | "comparative" | "guided_discovery" | "need_profile" | "high_retention";

export interface QuizQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  icon: string;
}

export interface EduCard {
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  location: string;
  text: string;
}

export interface QuizOffer {
  headline: string;
  withoutTitle: string;
  withTitle: string;
  without: string[];
  with: string[];
  featuresTitle: string;
  features: string[];
  ctaText: string;
  secondCtaText: string;
}

export interface QuizInsight {
  lead: string;
  headline: string;
  body: string;
}

export interface QuizFacts {
  price?: string;
  priceNote?: string;
  delivery?: string;
  guarantee?: string;
  proofs?: string[];
}

export type QuizStyle = "clean" | "classic";

export interface QuizFunnelData {
  productName: string;
  niche: string;
  angle: QuizAngle;
  landingHeadline: string;
  landingSubheadline: string;
  startButtonText: string;
  questions: QuizQuestion[];
  transitionMessages: string[];
  finalHeadline: string;
  finalSummary: string;
  finalEducational: string;
  eduCards: EduCard[];
  bridgeText: string;
  productBenefits: string[];
  testimonials: Testimonial[];
  ctaText: string;
  ctaUrl: string;
  urgencyText: string;
  disclaimer: string;
  language?: string;
  insight?: QuizInsight;
  resultHeadline?: string;
  resultBody?: string;
  offer?: QuizOffer;
  heroImageUrl?: string;
  facts?: QuizFacts;
  landingImageUrl?: string;
  landingImageAlt?: string;
}

export function isAiConfigured(): boolean {
  return isGeminiConfigured();
}

const ANGLE_LABELS: Record<QuizAngle, string> = {
  educational: "Educacional",
  comparative: "Comparativo",
  guided_discovery: "Descoberta Guiada",
  need_profile: "Perfil de Necessidade",
  high_retention: "Alta Retenção & Hooks",
};

export function angleOptions(): { value: QuizAngle; label: string }[] {
  return (Object.keys(ANGLE_LABELS) as QuizAngle[]).map((value) => ({
    value,
    label: ANGLE_LABELS[value],
  }));
}

function languageToName(code: string): string {
  const known: Record<string, string> = { pt: "português (pt-BR)", en: "English", es: "español" };
  if (known[code]) return known[code];
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    const name = dn.of(code);
    return name || code;
  } catch {
    return code;
  }
}

function buildPrompt(page: ExtractedPage, affiliateUrl: string, angle: QuizAngle, language: string, facts?: QuizFacts): string {
  const angleDesc: Record<QuizAngle, string> = {
    educational: "Teach the user something new about their problem before revealing the product",
    comparative: "Compare common approaches vs. the product's superior approach",
    guided_discovery: "Guide the user through self-discovery questions that reveal their need",
    need_profile: "Profile the user's specific needs to personalize the recommendation",
    high_retention: "Extreme curiosity hooks, pattern-interrupt headlines, responsible-use warnings, and high-retention micro-commitments that drive a strong CTA pull",
  };

  const lang = languageToName(language);
  const factsStr = facts ? `\nVerified facts (use ONLY these): ${JSON.stringify(facts)}` : "";
  const textContent = [
    `Product Title: ${page.title}`,
    `Headline: ${page.headline}`,
    `Subheadline: ${page.subheadline}`,
    `Description: ${page.description}`,
    `Benefits: ${page.benefits.slice(0, 8).join(" | ")}`,
    `Testimonials: ${page.testimonials.slice(0, 4).join(" | ")}`,
    `CTAs: ${page.ctas.map((c) => c.text).join(" | ")}`,
    `Affiliate URL: ${affiliateUrl}`,
  ].join("\n");

  const angleExtra = angle === "high_retention"
    ? `\n\nHIGH RETENTION ANGLE SPECIFIC RULES:
- landingHeadline: Use a pattern-interrupt / responsible-use warning hook (e.g. 'Warning: Only continue if you experience...'). Must be compliant, no false promises.
- Questions should use extreme curiosity micro-commitments — each option reveals something intriguing about the user's situation.
- transitionMessages should focus on profile eligibility verification (e.g. 'Verifying your eligibility...', 'Checking profile match...', 'Confirming your recommendation...').
- finalHeadline should create urgency and curiosity (e.g. 'Your Profile Matches a Specific Recommendation').
- bridgeText should strongly connect the identified pain point to the product as the logical next step.
- ctaText should be action-oriented and direct.`
    : "";

  return `You are an expert Direct Response copywriter specializing in quiz funnels and discovery funnels, with strict compliance standards for Google Ads and Meta Ads.

Escreva TODO o texto em ${lang}. Use APENAS os fatos fornecidos; nao invente numeros, precos, prazos ou depoimentos.${factsStr}

Analyze the following product page data and create a complete quiz funnel with ${ANGLE_LABELS[angle]} angle (${angleDesc[angle]}).

Return ONLY a valid JSON object (no markdown, no code fences) with these fields:

{
  "productName": "The exact product name",
  "niche": "The market niche (e.g. health, beauty, finance, relationships, cognition, fitness)",
  "landingHeadline": "A high-curiosity headline for the quiz landing page. No false promises. Max 80 chars.",
  "landingSubheadline": "A supporting subtitle explaining what the user will discover. Max 140 chars.",
  "startButtonText": "Text for the start button (e.g. 'Start Quiz', 'Find Out Now'). Max 25 chars.",
  "questions": [
    {
      "question": "Q1: Diagnose the frequency of the user's primary pain/symptom (e.g. how often they forget names, experience brain fog). Max 70 chars.",
      "subtitle": "A short micro-commitment text below the question. Max 100 chars.",
      "options": [
        {
          "title": "Option label. Max 40 chars.",
          "description": "Short description of this option. Max 80 chars.",
          "imageUrl": "",
          "icon": "A single emoji that represents this option visually"
        }
      ]
    },
    {
      "question": "Q2: Assess energy level and mental fatigue (e.g. mid-afternoon mental tiredness). Max 70 chars.",
      "subtitle": "A short micro-commitment text below the question. Max 100 chars.",
      "options": [...same structure...]
    },
    {
      "question": "Q3: Identify the user's primary goal (e.g. focus, memory, clarity). Max 70 chars.",
      "subtitle": "A short micro-commitment text below the question. Max 100 chars.",
      "options": [...same structure...]
    },
    {
      "question": "Q4: Ask age range for personalized response tailoring. Max 70 chars.",
      "subtitle": "A short micro-commitment text below the question. Max 100 chars.",
      "options": [...same structure...]
    }
  ],
  "transitionMessages": ["3 loading messages shown during the 3.5s transition: 1. 'Analyzing your responses...', 2. 'Evaluating cognitive demand profile...', 3. 'Matching age-appropriate natural support strategies...'"],
  "finalHeadline": "The result page headline. Neutral, referencing the user's quiz outcome. Max 90 chars.",
  "finalSummary": "A 2-3 sentence neutral, empathetic explanation of the user's quiz result. Do NOT invent clinical or physiological diagnoses. Validate their needs based on their answers.",
  "finalEducational": "A 3-4 sentence educational paragraph that teaches something valuable and relevant to the niche. No hype, no product mentions yet.",
  "eduCards": [
    {
      "title": "A practical tip, habit, or strategy title. Max 50 chars.",
      "description": "A 1-2 sentence actionable explanation specific to the niche. Max 120 chars.",
      "icon": "A single emoji representing the tip"
    }
  ],
  "bridgeText": "A 1-2 sentence natural bridge that connects the educational content to the product recommendation. E.g. 'If you're looking for a solution that aligns with these principles, here's something worth exploring.' Max 160 chars.",
  "productBenefits": ["4 to 6 specific product benefits confirmed by the quiz answers. Phrase as factual, not miraculous."],
  "testimonials": [
    {
      "name": "Full name (e.g. 'Sarah M.')",
      "location": "City, State, Country (e.g. 'Texas, USA')",
      "text": "A realistic-sounding testimonial about the product, 1-2 sentences. Max 200 chars."
    }
  ],
  "ctaText": "A persuasive CTA button text with high contrast. E.g. 'Watch Official Presentation & Claim Discount →'. Max 40 chars.",
  "urgencyText": "A commercial opportunity phrase based on real conditions (e.g. free shipping, kit discounts, extended guarantee on the official page). Max 80 chars. Do NOT use fake scarcity like 'limited regional stock' or 'laboratory urgency'."
}

Rules:
- Generate exactly 4 questions in this order: Q1 pain/symptom frequency, Q2 energy/fatigue, Q3 primary goal, Q4 age range.
- Generate 3 to 5 eduCards with practical, niche-specific tips (e.g. Active Recall, Sleep Hygiene, Distraction Restriction).
- Generate exactly 4 testimonials with realistic names, locations, and 5-star worthy text. Use testimonials from the product page if available.
- All text MUST be in ${lang}.
- icon should be a single emoji that visually represents the option or tip.
- The funnel must feel educational and helpful, NOT salesy.
- COMPLIANCE: No miracle promises, no disease cures, no physiological claims without backing from the official product page.
- urgencyText must be ad-safe: reference real commercial conditions (shipping, kit deals, guarantee) not fake scarcity.
- The result page structure must flow: neutral result summary -> educational cards -> bridge text -> product recommendation with benefits -> CTA -> social proof testimonials (4 reviews with 5 stars, name, location).
${angleExtra}

Product Data:
${textContent}`.replace("${lang}", lang);
}

const DISCLAIMER_TEXT = "This site is an independent portal for informational content and commercial recommendations. The information on this page is educational and does not replace guidance from qualified professionals. To check guarantee conditions, prices, and official availability, please visit the manufacturer's website.";

const FALLBACK_EDU_CARDS: EduCard[] = [
  { title: "Active Recall practice", description: "Regularly test yourself on what you learn instead of passively re-reading. It strengthens memory retention.", icon: "🧠" },
  { title: "Sleep hygiene matters", description: "Quality sleep is when your brain consolidates memories. Aim for 7-8 hours in a cool, dark room.", icon: "😴" },
  { title: "Restrict distractions", description: "Set phone to Do Not Disturb during focus sessions. Even silent notifications reduce cognitive capacity.", icon: "🔇" },
  { title: "Hydration & nutrition", description: "Dehydration impairs concentration. Keep water nearby and maintain balanced nutrition throughout the day.", icon: "💧" },
];

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { name: "Sarah M.", location: "Texas, USA", text: "I noticed a real difference in my daily focus after just a few weeks. It's now part of my morning routine." },
  { name: "James T.", location: "Florida, USA", text: "Was skeptical at first, but the mental clarity I've gained has been genuinely surprising. Highly recommend." },
  { name: "Maria L.", location: "California, USA", text: "The brain fog I used to get mid-afternoon is mostly gone. I feel sharper and more present with my family." },
  { name: "Robert K.", location: "Ohio, USA", text: "Simple to use and the results speak for themselves. My memory for names and details has improved noticeably." },
];

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "How often do you experience forgetfulness?",
    subtitle: "Be honest — this helps us understand your situation.",
    options: [
      { id: "a", title: "Rarely", description: "Once in a while, nothing worrying.", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&q=80", icon: "🟢" },
      { id: "b", title: "A few times a week", description: "I forget names or small things regularly.", imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop&q=80", icon: "🟡" },
      { id: "c", title: "Almost daily", description: "It's becoming a noticeable pattern.", imageUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=300&fit=crop&q=80", icon: "🔴" },
    ],
  },
  {
    id: "q2",
    question: "How's your energy mid-afternoon?",
    subtitle: "Think about your typical day around 2-3 PM.",
    options: [
      { id: "a", title: "Sharp and focused", description: "I maintain energy throughout the day.", imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop&q=80", icon: "⚡" },
      { id: "b", title: "Slight dip", description: "I get a bit tired but push through.", imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop&q=80", icon: "📉" },
      { id: "c", title: "Mental fog", description: "I struggle to focus after lunch.", imageUrl: "https://images.unsplash.com/photo-1488190212758-b361f04911a8?w=400&h=300&fit=crop&q=80", icon: "🌫️" },
    ],
  },
  {
    id: "q3",
    question: "What's your primary goal?",
    subtitle: "Choose what matters most to you right now.",
    options: [
      { id: "a", title: "Better focus", description: "Stay on task without distraction.", imageUrl: "https://images.unsplash.com/photo-1553877522-1a26b4fc0a5f?w=400&h=300&fit=crop&q=80", icon: "🎯" },
      { id: "b", title: "Sharper memory", description: "Remember names, details, and tasks.", imageUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=300&fit=crop&q=80", icon: "🧠" },
      { id: "c", title: "Mental clarity", description: "Clear the fog and think faster.", imageUrl: "https://images.unsplash.com/photo-1506784983877-b455703d2b6f?w=400&h=300&fit=crop&q=80", icon: "✨" },
    ],
  },
  {
    id: "q4",
    question: "What's your age range?",
    subtitle: "This helps us personalize your recommendation.",
    options: [
      { id: "a", title: "25-35", description: "Building foundational habits.", imageUrl: "https://images.unsplash.com/photo-1521737604892-dffcc805cae2?w=400&h=300&fit=crop&q=80", icon: "🌱" },
      { id: "b", title: "36-50", description: "Maintaining peak performance.", imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop&q=80", icon: "💪" },
      { id: "c", title: "51+", description: "Supporting long-term cognitive health.", imageUrl: "https://images.unsplash.com/photo-1554224155-6726b1ffcb58?w=400&h=300&fit=crop&q=80", icon: "🌟" },
    ],
  },
];

function normalizeData(raw: unknown, page: ExtractedPage, affiliateUrl: string, angle: QuizAngle, language: string): QuizFunnelData {
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v.trim() : fallback;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x: unknown) => typeof x === "string").map((x: string) => x.trim()) : [];

  const rawQuestions = Array.isArray(r.questions) ? r.questions : [];
  const questions: QuizQuestion[] = rawQuestions.slice(0, 5).map((q, i) => {
    const qObj = q as Record<string, unknown>;
    const rawOpts = Array.isArray(qObj.options) ? qObj.options : [];
    const options: QuizOption[] = rawOpts.slice(0, 4).map((o, j) => {
      const oObj = o as Record<string, unknown>;
      return {
        id: `${i}_${j}`,
        title: str(oObj.title, `Option ${j + 1}`),
        description: str(oObj.description, ""),
        imageUrl: str(oObj.imageUrl, ""),
        icon: str(oObj.icon, "🔹"),
      };
    });
    return {
      id: `q${i + 1}`,
      question: str(qObj.question, FALLBACK_QUESTIONS[i]?.question || `Question ${i + 1}`),
      subtitle: str(qObj.subtitle, FALLBACK_QUESTIONS[i]?.subtitle || ""),
      options: options.length > 0 ? options : FALLBACK_QUESTIONS[i]?.options || [],
    };
  }).filter((q) => q.options.length > 0);

  const rawEduCards = Array.isArray(r.eduCards) ? r.eduCards : [];
  const eduCards: EduCard[] = rawEduCards.slice(0, 5).map((c, i) => {
    const cObj = c as Record<string, unknown>;
    return {
      title: str(cObj.title, FALLBACK_EDU_CARDS[i]?.title || `Tip ${i + 1}`),
      description: str(cObj.description, FALLBACK_EDU_CARDS[i]?.description || ""),
      icon: str(cObj.icon, FALLBACK_EDU_CARDS[i]?.icon || "💡"),
    };
  }).filter((c) => c.title);

  const rawTestimonials = Array.isArray(r.testimonials) ? r.testimonials : [];
  const testimonials: Testimonial[] = rawTestimonials.slice(0, 4).map((t, i) => {
    const tObj = t as Record<string, unknown>;
    return {
      name: str(tObj.name, FALLBACK_TESTIMONIALS[i]?.name || `Customer ${i + 1}`),
      location: str(tObj.location, FALLBACK_TESTIMONIALS[i]?.location || ""),
      text: str(tObj.text, FALLBACK_TESTIMONIALS[i]?.text || ""),
    };
  }).filter((t) => t.name && t.text);

  return {
    productName: str(r.productName, page.title),
    niche: str(r.niche, "general"),
    angle,
    landingHeadline: str(r.landingHeadline, page.headline || page.title),
    landingSubheadline: str(r.landingSubheadline, page.subheadline || page.description || "Answer a few quick questions to discover the best approach for you."),
    startButtonText: str(r.startButtonText, "Start Quiz"),
    questions: questions.length > 0 ? questions : FALLBACK_QUESTIONS,
    transitionMessages: arr(r.transitionMessages).length >= 3
      ? arr(r.transitionMessages).slice(0, 3)
      : ["Analyzing your profile...", "Matching recommendations...", "Preparing your result..."],
    finalHeadline: str(r.finalHeadline, "Here's What We Recommend For You"),
    finalSummary: str(r.finalSummary, "Based on your answers, we've identified the approach that best fits your needs."),
    finalEducational: str(r.finalEducational, "Before we reveal our recommendation, here's something important to understand about your situation. The right approach isn't just about quick fixes — it's about addressing the root cause with a proven, sustainable solution."),
    eduCards: eduCards.length > 0 ? eduCards : FALLBACK_EDU_CARDS,
    bridgeText: str(r.bridgeText, "If you're looking for a solution that aligns with these principles, here's something worth exploring."),
    productBenefits: arr(r.productBenefits).length >= 3 ? arr(r.productBenefits) : page.benefits.slice(0, 5),
    testimonials: testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS,
    ctaText: str(r.ctaText, page.ctas[0]?.text || "Watch Official Presentation & Claim Discount →"),
    ctaUrl: affiliateUrl,
    urgencyText: str(r.urgencyText, "Check the official page for current shipping and guarantee conditions."),
    disclaimer: DISCLAIMER_TEXT,
    language,
  };
}

function buildCleanPrompt(page: ExtractedPage, affiliateUrl: string, angle: QuizAngle, language: string, facts?: QuizFacts, productContext?: string): string {
  const lang = languageToName(language);
  const factsStr = facts ? `\nFatos verificados (use APENAS estes): ${JSON.stringify(facts)}` : "";
  const contextStr = productContext && productContext.trim()
    ? `\nContexto do produto (use como fatos): ${productContext.trim()}`
    : "";
  const textContent = [
    `Product Title: ${page.title}`,
    `Headline: ${page.headline}`,
    `Description: ${page.description}`,
    `Benefits: ${page.benefits.slice(0, 8).join(" | ")}`,
    `CTAs: ${page.ctas.map((c) => c.text).join(" | ")}`,
  ].join("\n");

  return `You are an expert quiz funnel copywriter. Write in ${lang}. Use ONLY provided facts.${factsStr}${contextStr}

INFERIA automaticamente o nicho de mercado, o tom de voz e o perfil do público-alvo a partir do Nome do Produto/Tema informado abaixo. Aplique o playbook/estilo mais adequado para o nicho inferado: evite promessas e garantias em nichos regulados (saúde, finanças, suplementos, renda); use tom acolhedor em relacionamentos/família; tom didático em cursos/hobbies; tom prático em produtividade/organização. NÃO declare a suposição no JSON; apenas aplique o tom e as regras adequadas no texto gerado.

${ANGLE_RULES[angle]}

Q1 deve ser uma pergunta de contexto neutra e coerente com o nicho inferado (finanças: rotina e perfil; casais: situação e prioridade do casal; saúde: rotina e conforto; cursos/hobbies: nível e objetivo), sem afirmar nenhuma condição pessoal.

Create a 6-question quiz funnel in CLEAN style. Return ONLY valid JSON:

{
  "productName": "exact name",
  "niche": "market niche",
  "landingHeadline": "informative promise, max 90 chars",
  "landingSubheadline": "Vamos começar:",
  "questions": [
    { "question": "Q1: neutral context question, max 70 chars", "options": [{"title":"max 40","icon":"emoji"},{"title":"max 40","icon":"emoji"},{"title":"max 40","icon":"emoji"},{"title":"max 40","icon":"emoji"}] },
    { "question": "Q2-Q6: neutral discovery, max 70 chars", "options": [{"title":"max 40"},{"title":"max 40"},{"title":"max 40"}] }
  ],
  "insight": { "lead": "A verdade é que:", "headline": "max 80 chars", "body": "2 sentences, no invented numbers" },
  "resultHeadline": "Com base nas suas respostas...",
  "resultBody": "1-2 sentences",
  "offer": {
    "headline": "offer headline with product name",
    "withoutTitle": "Sem [product]", "withTitle": "Com [product]",
    "without": ["3 negative items"], "with": ["4-5 benefits"],
    "featuresTitle": "O que você recebe", "features": ["5 items"],
    "ctaText": "max 30 chars", "secondCtaText": "max 30 chars"
  }
}

Rules: 6 questions. Q1=4 options+emoji. Q2-Q6=3-4 options, no description/imageUrl. Neutral. No testimonials/eduCards/scarcity. All text in ${lang}.
Use acentuação e pontuação corretas. Nunca omita acentos.

Product: ${textContent}`;
}

function normalizeCleanData(
  raw: unknown,
  page: ExtractedPage,
  affiliateUrl: string,
  angle: QuizAngle,
  language: string,
  facts?: QuizFacts,
  heroImageUrl?: string,
): QuizFunnelData {
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, fallback = ""): string => typeof v === "string" ? v.trim() : fallback;
  const arr = (v: unknown): string[] => Array.isArray(v) ? v.filter((x: unknown) => typeof x === "string").map((x: string) => x.trim()) : [];

  const rawQuestions = Array.isArray(r.questions) ? r.questions : [];
  const questions: QuizQuestion[] = rawQuestions.slice(0, 6).map((q, i) => {
    const qObj = q as Record<string, unknown>;
    const rawOpts = Array.isArray(qObj.options) ? qObj.options : [];
    const options: QuizOption[] = rawOpts.slice(0, 4).map((o, j) => {
      const oObj = o as Record<string, unknown>;
      return {
        id: `${i}_${j}`,
        title: str(oObj.title, `Option ${j + 1}`),
        description: "",
        icon: str(oObj.icon, ""),
      };
    });
    return {
      id: `q${i + 1}`,
      question: str(qObj.question, FALLBACK_QUESTIONS[i]?.question || `Question ${i + 1}`),
      subtitle: "",
      options: options.length > 0 ? options : FALLBACK_QUESTIONS[i]?.options || [],
    };
  }).filter((q) => q.options.length > 0);

  const rawInsight = r.insight as Record<string, unknown> | undefined;
  const insight = rawInsight ? {
    lead: str(rawInsight.lead, ""),
    headline: str(rawInsight.headline, ""),
    body: str(rawInsight.body, ""),
  } : undefined;

  const rawOffer = r.offer as Record<string, unknown> | undefined;
  const offer = rawOffer ? {
    headline: str(rawOffer.headline, ""),
    withoutTitle: str(rawOffer.withoutTitle, ""),
    withTitle: str(rawOffer.withTitle, ""),
    without: arr(rawOffer.without),
    with: arr(rawOffer.with),
    featuresTitle: str(rawOffer.featuresTitle, ""),
    features: arr(rawOffer.features),
    ctaText: str(rawOffer.ctaText, ""),
    secondCtaText: str(rawOffer.secondCtaText, ""),
  } : undefined;

  const productName = str(r.productName, page.title);
  const ctaText = offer?.ctaText || str(r.ctaText, page.ctas[0]?.text || `Conhecer ${productName}`);

  return {
    productName,
    niche: str(r.niche, "general"),
    angle,
    landingHeadline: str(r.landingHeadline, page.headline || page.title),
    landingSubheadline: str(r.landingSubheadline, "Vamos começar:"),
    startButtonText: str(r.startButtonText, "Começar"),
    questions: questions.length > 0 ? questions : FALLBACK_QUESTIONS,
    transitionMessages: ["Analisando suas respostas...", "Preparando seu resultado...", "Quase pronto..."],
    finalHeadline: str(r.resultHeadline, "Com base nas suas respostas..."),
    finalSummary: str(r.resultBody, ""),
    finalEducational: insight?.body || "",
    eduCards: [],
    bridgeText: "",
    productBenefits: offer?.with || page.benefits.slice(0, 5),
    testimonials: [],
    ctaText,
    ctaUrl: affiliateUrl,
    urgencyText: "",
    disclaimer: "",
    language,
    insight,
    resultHeadline: str(r.resultHeadline, "Com base nas suas respostas..."),
    resultBody: str(r.resultBody, ""),
    offer: offer || {
      headline: productName,
      withoutTitle: `Sem ${productName}`,
      withTitle: `Com ${productName}`,
      without: [],
      with: page.benefits.slice(0, 4),
      featuresTitle: "O que voce recebe",
      features: page.benefits.slice(0, 5),
      ctaText,
      secondCtaText: "",
    },
    heroImageUrl: heroImageUrl || undefined,
    facts: facts || undefined,
  };
}

function buildFallbackData(page: ExtractedPage, affiliateUrl: string, angle: QuizAngle): QuizFunnelData {
  const angleLabel = ANGLE_LABELS[angle];
  const isHighRetention = angle === "high_retention";
  return {
    productName: page.title || "Your Product",
    niche: "general",
    angle,
    landingHeadline: isHighRetention
      ? `Warning: Only continue if you experience this common frustration...`
      : page.headline || `Discover the Right ${page.title ? page.title : "Solution"} For You`,
    landingSubheadline: page.subheadline || page.description || `Answer a few quick questions and we'll match you with the best approach. ${angleLabel} format.`,
    startButtonText: "Start Quiz",
    questions: FALLBACK_QUESTIONS,
    transitionMessages: isHighRetention
      ? ["Verifying your eligibility...", "Checking profile match...", "Confirming your recommendation..."]
      : ["Analyzing your responses...", "Evaluating cognitive demand profile...", "Matching age-appropriate natural support strategies..."],
    finalHeadline: isHighRetention
      ? "Your Profile Matches a Specific Recommendation"
      : "Here's What We Recommend For You",
    finalSummary: isHighRetention
      ? "Based on your responses, we've identified a pattern that matches a specific approach. Your answers suggest you may benefit from a targeted solution."
      : "Based on your answers, we've identified the approach that best fits your needs and goals.",
    finalEducational: "Before we reveal our recommendation, here's something important to understand about your situation. The right approach isn't just about quick fixes — it's about addressing the root cause with a proven, sustainable solution.",
    eduCards: FALLBACK_EDU_CARDS,
    bridgeText: isHighRetention
      ? "The frustration you identified is exactly what this solution was designed to address. Here's what we recommend:"
      : "If you're looking for a solution that aligns with these principles, here's something worth exploring.",
    productBenefits: page.benefits.length >= 3 ? page.benefits.slice(0, 5) : [
      "Backed by proven results from real users",
      "Easy to implement with clear step-by-step guidance",
      "Designed for long-term, sustainable outcomes",
      "Supported by a satisfaction guarantee",
    ],
    testimonials: page.testimonials.length >= 4
      ? page.testimonials.slice(0, 4).map((t) => {
          const parts = t.split(/[,·]/);
          const name = parts[0]?.trim() || "Verified Customer";
          const location = parts.slice(1).join(",").trim() || "";
          return { name, location, text: t };
        })
      : FALLBACK_TESTIMONIALS,
    ctaText: page.ctas[0]?.text || "Watch Official Presentation & Claim Discount →",
    ctaUrl: affiliateUrl,
    urgencyText: "Check the official page for current shipping and guarantee conditions.",
    disclaimer: DISCLAIMER_TEXT,
  };
}

export interface QuizFunnelResult {
  data: QuizFunnelData;
  usedFallback: boolean;
  warning?: string;
}

export interface QuizFunnelOpts {
  language?: string;
  facts?: QuizFacts;
  signal?: AbortSignal;
  style?: QuizStyle;
  heroImageUrl?: string;
  productContext?: string;
}

const ANGLE_RULES: Record<QuizAngle, string> = {
  educational: "Angulo educacional: ensine algo util e neutro sobre o tema ANTES de oferecer o produto. Cada pergunta deve revelar algo que preenche o usuario sobre a propria rotina.",
  comparative: "Angulo comparativo: compare metodos comuns (papel, planilha simples, app) sem citar marcas; mostre por que um metodo estruturado se destaca. Nao critique concorrentes nomeados.",
  guided_discovery: "Angulo descoberta guiada: leve o usuario a perceber a propria necessidade por meio de perguntas neutras; ele conclui o que falta, sem afirmação imposta.",
  need_profile: "Angulo perfil de necessidade: a Q1 segmenta o perfil/contexto do usuario (rotina, estilo de vida, prioridade), sem afirmar nenhuma condicao pessoal. As respostas guiam a recomendacao.",
  high_retention: "Angulo alta retenção: use ganchos de curiosidade, perguntas curtas e micro-compromissos; NAO use urgência falsa, escassez inventada nem promessas. Mantenha o tom responsavel.",
};

const ACCENT_FIXES: Record<string, string> = {
  voce: "você", voces: "vocês", nao: "não", estao: "estão", sao: "são", tao: "tão", ja: "já", apos: "após", atras: "atrás",
  familia: "família", orcamento: "orçamento", visao: "visão", solucao: "solução", decisao: "decisão",
  saude: "saúde", precos: "preços", preco: "preço",
  tambem: "também", entao: "então", portanto: "portanto",
  rapido: "rápido", rapida: "rápida", unico: "único", unica: "única", proximo: "próximo", proxima: "próxima",
  situacao: "situação", cancao: "canção",
  educacao: "educação", treinamento: "treinamento", garantia: "garantia", disponivel: "disponível",
  possivel: "possível", impossivel: "impossível", responsavel: "responsável", responsaveis: "responsáveis",
  relacionamento: "relacionamento", relacionamentos: "relacionamentos", casamento: "casamento",
  conjuge: "cônjuge", conjuges: "cônjuges", comun: "comum", comuns: "comuns",
  comecar: "começar", comeco: "começo", comecou: "começou", comeca: "começa",
  verdade: "verdade", verdadeira: "verdadeira", verdadeiro: "verdadeiro",
  resposta: "resposta", respostas: "respostas", pergunta: "pergunta", perguntas: "perguntas",
  recomendacao: "recomendação", recomendacoes: "recomendações",
  informacoes: "informações", informacao: "informação", educacional: "educacional",
  estrategia: "estratégia", estrategias: "estratégias", metodo: "método", metodos: "métodos",
  analise: "análise", analises: "análises", analizando: "analisando", analisei: "analisei",
  proximas: "próximas", proximos: "próximos",
  esta: "está", estarao: "estarão",
  sera: "será", serao: "serão", tinham: "tinham", terao: "terão",
  eles: "eles", elas: "elas", dele: "dele", dela: "dela", deles: "deles", delas: "delas",
};

function fixAccents(text: string): string {
  if (!text) return text;
  return text.replace(/\b([a-zà-ÿ]+)\b/gi, (word) => {
    const lower = word.toLowerCase();
    const fix = ACCENT_FIXES[lower];
    if (!fix) return word;
    return word[0] === word[0].toUpperCase() && word !== lower ? fix.charAt(0).toUpperCase() + fix.slice(1) : fix;
  });
}

const NEEDS_ACCENT_LANGS = new Set(["pt"]);

function applyAccentFix(d: QuizFunnelData, lang: string): QuizFunnelData {
  if (!NEEDS_ACCENT_LANGS.has(lang)) return d;
  const fixArr = (a: string[]) => a.map(fixAccents);
  const fixOpts = (qs: QuizQuestion[]) => qs.map((q) => ({
    ...q,
    question: fixAccents(q.question),
    subtitle: fixAccents(q.subtitle),
    options: q.options.map((o) => ({ ...o, title: fixAccents(o.title), description: fixAccents(o.description) })),
  }));
  return {
    ...d,
    productName: fixAccents(d.productName),
    niche: fixAccents(d.niche),
    landingHeadline: fixAccents(d.landingHeadline),
    landingSubheadline: fixAccents(d.landingSubheadline),
    startButtonText: fixAccents(d.startButtonText),
    questions: fixOpts(d.questions),
    transitionMessages: fixArr(d.transitionMessages),
    finalHeadline: fixAccents(d.finalHeadline),
    finalSummary: fixAccents(d.finalSummary),
    finalEducational: fixAccents(d.finalEducational),
    eduCards: d.eduCards.map((c) => ({ ...c, title: fixAccents(c.title), description: fixAccents(c.description) })),
    bridgeText: fixAccents(d.bridgeText),
    productBenefits: fixArr(d.productBenefits),
    testimonials: d.testimonials.map((t) => ({ ...t, name: fixAccents(t.name), location: fixAccents(t.location), text: fixAccents(t.text) })),
    ctaText: fixAccents(d.ctaText),
    urgencyText: fixAccents(d.urgencyText),
    disclaimer: fixAccents(d.disclaimer),
    insight: d.insight ? { lead: fixAccents(d.insight.lead), headline: fixAccents(d.insight.headline), body: fixAccents(d.insight.body) } : d.insight,
    resultHeadline: d.resultHeadline ? fixAccents(d.resultHeadline) : d.resultHeadline,
    resultBody: d.resultBody ? fixAccents(d.resultBody) : d.resultBody,
    offer: d.offer ? {
      headline: fixAccents(d.offer.headline),
      withoutTitle: fixAccents(d.offer.withoutTitle),
      withTitle: fixAccents(d.offer.withTitle),
      without: fixArr(d.offer.without),
      with: fixArr(d.offer.with),
      featuresTitle: fixAccents(d.offer.featuresTitle),
      features: fixArr(d.offer.features),
      ctaText: fixAccents(d.offer.ctaText),
      secondCtaText: fixAccents(d.offer.secondCtaText),
    } : d.offer,
  };
}

export async function generateQuizFunnel(
  page: ExtractedPage,
  affiliateUrl: string,
  angle: QuizAngle,
  opts?: QuizFunnelOpts,
): Promise<QuizFunnelResult> {
  if (!isGeminiConfigured()) {
    const fallback = buildFallbackData(page, affiliateUrl, angle);
    return {
      data: fallback,
      usedFallback: true,
      warning: "Chave VITE_GEMINI_API_KEY nao configurada. Funil gerado com template padrao.",
    };
  }

  const language = opts?.language || "pt";
  const style = opts?.style || "clean";
  const prompt = style === "clean"
    ? buildCleanPrompt(page, affiliateUrl, angle, language, opts?.facts, opts?.productContext)
    : buildPrompt(page, affiliateUrl, angle, language, opts?.facts);

  try {
    const parsed = await callGeminiJson<unknown>(prompt, {
      timeoutMs: 60000,
      maxOutputTokens: 8192,
      retries: 4,
      label: "quiz",
      signal: opts?.signal,
    });
    const normalized = style === "clean"
      ? normalizeCleanData(parsed, page, affiliateUrl, angle, language, opts?.facts, opts?.heroImageUrl)
      : normalizeData(parsed, page, affiliateUrl, angle, language);
    const data = NEEDS_ACCENT_LANGS.has(language) ? applyAccentFix(normalized, language) : normalized;
    return { data, usedFallback: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar quiz";
    if (msg === "Cancelado") throw err;
    const fallback = buildFallbackData(page, affiliateUrl, angle);
    return {
      data: fallback,
      usedFallback: true,
      warning: `IA indisponivel (${msg}). Funil gerado com template padrao baseado no produto.`,
    };
  }
}
