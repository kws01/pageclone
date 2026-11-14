export type RiskLevel = "verde" | "amarelo" | "vermelho";
export type Severity = "high" | "medium" | "low";

export interface ComplianceFlag {
  severity: Severity;
  phrase: string;
  reason: string;
  suggestion: string;
}

export interface AdAuditResult {
  flags: ComplianceFlag[];
  riskLevel: RiskLevel;
}

export interface VerifiedFacts {
  price?: string;
  guarantee?: string;
  shipping?: string;
  proofs?: string[];
}

interface Rule {
  pattern: RegExp;
  severity: Severity;
  reason: string;
  suggestion: string;
}

const RULES: Record<string, Rule[]> = {
  pt: [
    { pattern: /garantido|garantia de resultado|sem falha|com certeza absoluta/gi, severity: "high", reason: "Promessa garantida", suggestion: "Use linguagem de suporte sem garantir resultado" },
    { pattern: /lucro garantido|renda garantida|ficar rico|enriquecer|renda passiva garantida|liberdade financeira/gi, severity: "high", reason: "Promessa de ganhos/renda irrealista", suggestion: "Remova promessa de renda; use 'resultados variam'" },
    { pattern: /antes e depois|depois de usar|transformacao total/gi, severity: "high", reason: "Antes e depois", suggestion: "Remova comparativo antes/depois" },
    { pattern: /cura|elimina|trata|tratamento|sana|extirpa/gi, severity: "high", reason: "Absoluto de saude", suggestion: "Use 'pode ajudar a apoiar' em vez de 'cura/elimina/trata'" },
    { pattern: /você (está|tem|sofre|é|sente)\s/gi, severity: "medium", reason: "Atributo pessoal do leitor", suggestion: "Use 'Para quem quer...' ou 'Um jeito simples de...'" },
    { pattern: /só hoje|ultimas unidades|ultima chance|acaba hoje|por tempo limitado|estoque limitado/gi, severity: "high", reason: "Urgencia/escassez falsa", suggestion: "Remova urgencia artificial" },
    { pattern: /melhor (do mundo|de todos)|perfeito|incrivel|milagroso|revolucionario/gi, severity: "medium", reason: "Superlativo nao comprovado", suggestion: "Use linguagem factual sem superlativos" },
    { pattern: /comprovado cientificamente|estudos mostram|pesquisa confirma|clinicamente comprovado/gi, severity: "medium", reason: "Autoridade medica nao comprovada", suggestion: "Use 'muitas pessoas relatam' ou remova a afirmacao" },
  ],
  en: [
    { pattern: /guaranteed|fail-proof|sure-fire|certain to/gi, severity: "high", reason: "Guaranteed promise", suggestion: "Use supportive language without guaranteeing outcome" },
    { pattern: /guaranteed income|get rich|passive income guaranteed|financial freedom|earn \$\d+/gi, severity: "high", reason: "Unrealistic income claim", suggestion: "Remove income promise; use 'results vary'" },
    { pattern: /before and after|after using|total transformation/gi, severity: "high", reason: "Before/after claim", suggestion: "Remove before/after comparison" },
    { pattern: /\bcure|heals|treats|eliminates|treatment of\b/gi, severity: "high", reason: "Health absolute", suggestion: "Use 'may help support' instead of cure/heal/treat" },
    { pattern: /are you (overweight|in debt|depressed|suffering from|struggling with)/gi, severity: "medium", reason: "Personal attribute assumption", suggestion: "Use 'For those who want...' phrasing" },
    { pattern: /only today|last chance|last units|ends today|limited time|limited stock/gi, severity: "high", reason: "False urgency/scarcity", suggestion: "Remove artificial urgency" },
    { pattern: /best (ever|in the world)|perfect|miraculous|revolutionary/gi, severity: "medium", reason: "Unverified superlative", suggestion: "Use factual language without superlatives" },
    { pattern: /clinically proven|studies show|research confirms|scientifically proven/gi, severity: "medium", reason: "Unverified medical authority", suggestion: "Use 'many people report' or remove the claim" },
  ],
  es: [
    { pattern: /garantizado|sin falta|seguro|con seguridad absoluta/gi, severity: "high", reason: "Promesa garantizada", suggestion: "Use lenguaje de apoyo sin garantizar resultado" },
    { pattern: /lucro garantizado|hacerte rico|ingreso pasivo garantizado|libertad financiera/gi, severity: "high", reason: "Promesa de ingresos irrealista", suggestion: "Quitar promesa de ingresos; usar 'los resultados varian'" },
    { pattern: /antes y despues|despues de usar|transformacion total/gi, severity: "high", reason: "Antes y despues", suggestion: "Quitar comparativo antes/despues" },
    { pattern: /cura|elimina|trata|sanar/gi, severity: "high", reason: "Absoluto de salud", suggestion: "Use 'puede ayudar a apoyar' en vez de 'cura/elimina/trata'" },
    { pattern: /estas (con sobrepeso|endeudado|deprimido|sufriendo)/gi, severity: "medium", reason: "Atributo personal del lector", suggestion: "Use 'Para quien quiere...' o 'Una forma simple de...'" },
    { pattern: /solo hoy|ultimas unidades|ultima oportunidad|termina hoy|tiempo limitado/gi, severity: "high", reason: "Urgencia/escasez falsa", suggestion: "Quitar urgencia artificial" },
    { pattern: /mejor del mundo|perfecto|milagroso|revolucionario/gi, severity: "medium", reason: "Superlativo no comprobado", suggestion: "Use lenguaje factual sin superlativos" },
    { pattern: /comprobado cientificamente|estudios muestran|investigacion confirma/gi, severity: "medium", reason: "Autoridad medica no comprobada", suggestion: "Use 'muchas personas reportan' o quite la afirmacion" },
  ],
};

function getRules(lang: string): Rule[] {
  const l = lang.toLowerCase();
  if (l.startsWith("pt")) return RULES.pt;
  if (l.startsWith("es")) return RULES.es;
  return RULES.en;
}

function checkUnverifiedNumbers(text: string, facts: VerifiedFacts): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  const allowedNumbers = new Set<string>();
  if (facts.price) {
    const digits = facts.price.replace(/[^0-9%,.]/g, "");
    if (digits) allowedNumbers.add(digits);
  }
  if (facts.guarantee) {
    const gd = facts.guarantee.match(/\d+/g);
    if (gd) gd.forEach((d) => allowedNumbers.add(d));
  }

  const numberPattern = /(?:R\$|US\$|\$|€|£|\d+)\s?\d[\d.,]*\s?(?:%|porcento|percent|off|desconto|discount)?|\d+\s?(?:%|dias|days|dias de garantia|noites|nights|pessoas|people|clientes|customers)/gi;
  const matches = text.match(numberPattern) || [];
  for (const match of matches) {
    const digitsOnly = match.replace(/[^0-9%]/g, "");
    if (!allowedNumbers.has(digitsOnly) && !facts.proofs?.some((p) => p.includes(match.trim()))) {
      flags.push({
        severity: "medium",
        phrase: match.trim(),
        reason: "Numero/porcentagem/valor nao verificado nos fatos",
        suggestion: "Remova o numero ou cadastre-o em 'Fatos verificados'",
      });
    }
  }
  return flags;
}

export function auditAdText(text: string, lang: string, facts: VerifiedFacts, extraAvoid?: string[]): AdAuditResult {
  const rules = getRules(lang);
  const flags: ComplianceFlag[] = [];

  for (const rule of rules) {
    const matches = text.match(rule.pattern);
    if (matches) {
      for (const phrase of matches) {
        flags.push({
          severity: rule.severity,
          phrase,
          reason: rule.reason,
          suggestion: rule.suggestion,
        });
      }
    }
  }

  if (extraAvoid && extraAvoid.length > 0) {
    for (const word of extraAvoid) {
      const w = word.trim();
      if (!w) continue;
      const pattern = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = text.match(pattern);
      if (matches) {
        for (const phrase of matches) {
          flags.push({
            severity: "medium",
            phrase,
            reason: `Palavra extra a evitar: "${w}"`,
            suggestion: `Remova ou substitua "${phrase}" por uma alternativa conforme o playbook`,
          });
        }
      }
    }
  }

  flags.push(...checkUnverifiedNumbers(text, facts));

  const highCount = flags.filter((f) => f.severity === "high").length;
  const mediumCount = flags.filter((f) => f.severity === "medium").length;

  let riskLevel: RiskLevel = "verde";
  if (highCount > 0) riskLevel = "vermelho";
  else if (mediumCount >= 2) riskLevel = "amarelo";
  else if (mediumCount === 1) riskLevel = "amarelo";

  return { flags, riskLevel };
}

export function highlightFlags(text: string, flags: ComplianceFlag[]): { text: string; isFlagged: boolean }[] {
  if (flags.length === 0) return [{ text, isFlagged: false }];
  const segments: { text: string; isFlagged: boolean }[] = [];
  let remaining = text;
  const sortedFlags = [...flags].sort((a, b) => b.phrase.length - a.phrase.length);
  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestPhrase = "";
    for (const f of sortedFlags) {
      const idx = remaining.toLowerCase().indexOf(f.phrase.toLowerCase());
      if (idx >= 0 && (earliestIdx === -1 || idx < earliestIdx)) {
        earliestIdx = idx;
        earliestPhrase = f.phrase;
      }
    }
    if (earliestIdx === -1) {
      segments.push({ text: remaining, isFlagged: false });
      break;
    }
    if (earliestIdx > 0) {
      segments.push({ text: remaining.slice(0, earliestIdx), isFlagged: false });
    }
    segments.push({ text: remaining.slice(earliestIdx, earliestIdx + earliestPhrase.length), isFlagged: true });
    remaining = remaining.slice(earliestIdx + earliestPhrase.length);
  }
  return segments;
}
