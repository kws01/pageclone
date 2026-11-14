import type { HybridStageId } from "@/types/hybridGuide";

export const HYBRID_STAGE_LABELS: Record<HybridStageId, string> = {
  cover: "Capa e gancho",
  educational: "Cartões educativos",
  quiz: "Mini quiz",
  transition: "Transição e resumo",
  preOffer: "Pré-oferta",
  solution: "Apresentação da solução",
  finalCta: "CTA final",
};

export interface HybridUiStrings {
  continue: string;
  next: string;
  back: string;
  forward: string;
  yourAnswers: string;
  keyFeatures: string;
  restartGuide: string;
  informationNotice: string;
  practicalExample: string;
  questionOf: (index: number, total: number) => string;
  imageNotSet: string;
  noCtaLink: string;
  yourSolution: string;
  wantToKnow: string;
}

const STRING_TABLES: Record<string, HybridUiStrings> = {
  pt: {
    continue: "Continuar",
    next: "Próximo",
    back: "Voltar",
    forward: "Avançar",
    yourAnswers: "Suas respostas",
    keyFeatures: "Diferenciais",
    restartGuide: "Ver o guia novamente",
    informationNotice: "Aviso informativo: este guia oferece análises independentes sobre o produto e conteúdo educativo para ajudar você a tomar decisões mais bem informadas.",
    practicalExample: "Exemplo prático",
    questionOf: (i, t) => `Pergunta ${i} de ${t}`,
    imageNotSet: "Imagem não definida",
    noCtaLink: "Informe o link de destino para ativar o botão.",
    yourSolution: "Sua solução",
    wantToKnow: "Quero conhecer",
  },
  en: {
    continue: "Continue",
    next: "Next",
    back: "Back",
    forward: "Next",
    yourAnswers: "Your answers",
    keyFeatures: "Key features",
    restartGuide: "See guide again",
    informationNotice: "Information Notice: This guide provides independent product insights and educational content to help you make informed decisions.",
    practicalExample: "Practical example",
    questionOf: (i, t) => `Question ${i} of ${t}`,
    imageNotSet: "No image set",
    noCtaLink: "Add a destination link to activate the button.",
    yourSolution: "Your solution",
    wantToKnow: "I want to know more",
  },
  es: {
    continue: "Continuar",
    next: "Siguiente",
    back: "Atrás",
    forward: "Avanzar",
    yourAnswers: "Tus respuestas",
    keyFeatures: "Diferenciales",
    restartGuide: "Ver la guía de nuevo",
    informationNotice: "Aviso informativo: esta guía ofrece análisis independientes del producto y contenido educativo para ayudarte a tomar decisiones informadas.",
    practicalExample: "Ejemplo práctico",
    questionOf: (i, t) => `Pregunta ${i} de ${t}`,
    imageNotSet: "Imagen no definida",
    noCtaLink: "Añade un enlace de destino para activar el botón.",
    yourSolution: "Tu solución",
    wantToKnow: "Quiero conocerlo",
  },
  fr: {
    continue: "Continuer",
    next: "Suivant",
    back: "Retour",
    forward: "Avancer",
    yourAnswers: "Vos réponses",
    keyFeatures: "Atouts",
    restartGuide: "Revoir le guide",
    informationNotice: "Avis d'information : ce guide propose des analyses indépendantes sur le produit et un contenu éducatif pour vous aider à faire des choix éclairés.",
    practicalExample: "Exemple pratique",
    questionOf: (i, t) => `Question ${i} sur ${t}`,
    imageNotSet: "Image non définie",
    noCtaLink: "Ajoutez un lien de destination pour activer le bouton.",
    yourSolution: "Votre solution",
    wantToKnow: "Je veux découvrir",
  },
  de: {
    continue: "Weiter",
    next: "Weiter",
    back: "Zurück",
    forward: "Weiter",
    yourAnswers: "Ihre Antworten",
    keyFeatures: "Besonderheiten",
    restartGuide: "Guide erneut ansehen",
    informationNotice: "Hinweis: Dieser Guide bietet unabhängige Produktanalysen und lehrreiche Inhalte, damit Sie fundierte Entscheidungen treffen können.",
    practicalExample: "Praktisches Beispiel",
    questionOf: (i, t) => `Frage ${i} von ${t}`,
    imageNotSet: "Kein Bild festgelegt",
    noCtaLink: "Fügen Sie einen Ziel-Link hinzu, um den Button zu aktivieren.",
    yourSolution: "Ihre Lösung",
    wantToKnow: "Ich möchte mehr erfahren",
  },
  it: {
    continue: "Continua",
    next: "Avanti",
    back: "Indietro",
    forward: "Avanti",
    yourAnswers: "Le tue risposte",
    keyFeatures: "Punti di forza",
    restartGuide: "Rivedi la guida",
    informationNotice: "Avviso informativo: questa guida offre approfondimenti indipendenti sul prodotto e contenuti educativi per aiutarti a prendere decisioni consapevoli.",
    practicalExample: "Esempio pratico",
    questionOf: (i, t) => `Domanda ${i} di ${t}`,
    imageNotSet: "Immagine non impostata",
    noCtaLink: "Aggiungi un link di destinazione per attivare il pulsante.",
    yourSolution: "La tua soluzione",
    wantToKnow: "Voglio scoprire",
  },
};

export function getHybridStrings(language: string): HybridUiStrings {
  const code = language.toLowerCase().split(/[-_]/)[0];
  return STRING_TABLES[code] || STRING_TABLES.pt;
}

export const HYBRID_ANGLES = [
  "Educational Discovery",
  "Guided Discovery",
  "Comparison",
  "Needs-Based Discovery",
  "AI Recommended",
] as const;

export type HybridAngle = (typeof HYBRID_ANGLES)[number];

export const HYBRID_COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "PT", name: "Portugal" },
  { code: "US", name: "Estados Unidos" },
  { code: "GB", name: "Reino Unido" },
  { code: "ES", name: "Espanha" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colômbia" },
  { code: "CL", name: "Chile" },
  { code: "FR", name: "França" },
  { code: "DE", name: "Alemanha" },
  { code: "IT", name: "Itália" },
] as const;

export const HYBRID_LANGUAGES = [
  { code: "pt", name: "Português" },
  { code: "en", name: "Inglês" },
  { code: "es", name: "Espanhol" },
  { code: "fr", name: "Francês" },
  { code: "de", name: "Alemão" },
  { code: "it", name: "Italiano" },
] as const;
