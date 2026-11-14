export type RegulatedCategory = "none" | "health" | "finance" | "beauty" | "supplement" | "income";

export interface Playbook {
  id: string;
  label: string;
  keywords: string[];
  regulatedCategory: RegulatedCategory;
  strictness: "normal" | "high";
  tone: string;
  angles: string[];
  hookStyles: string[];
  avoidWords: string[];
  requiredNotes: string[];
  ctaPreference: string[];
  creativeFormats: string[];
  audienceHints: string[];
}

export const PLAYBOOKS: Record<string, Playbook> = {
  relacionamentos_familia: {
    id: "relacionamentos_familia", label: "Relacionamentos e família", regulatedCategory: "none", strictness: "normal",
    keywords: ["casal", "casais", "casamento", "relacionamento", "relacionamentos", "esposa", "marido", "esposo", "companheiro", "companheira", "familia", "filhos", "filho", "filha", "casais", "comunicacao", "planejamento juntos", "planejamento", "conjuge", "matrimonio", "relationship", "marriage", "couple", "couples", "family", "spouse", "relacion", "matrimonio", "pareja", "parejas", "familia", "hijos", "comunicacion"],
    tone: "acolhedor, empático e respeitoso; fala de rotina do casal e prioridades em conjunto, sem julgar",
    angles: ["educacional (entenda antes de propor)", "cena do dia a dia do casal", "comparacao de metodos (papel, planilha simples, app)", "curiosidade sobre habitos em comum", "beneficio direto do planejamento conjunto"],
    hookStyles: ["observação do cotidiano do casal", "pergunta aberta e neutra", "dica rapida de comunicação", "mito comum sobre relacionamento"],
    avoidWords: ["salve seu casamento", "salve seu relacionamento", "resultado garantido", "solução garantida", "volte a amar", "recupere seu amor", "milagre", "método secreto", "antes e depois", "save your marriage", "guaranteed result", "miracle", "salva tu matrimonio", "resultado garantizado", "milagro"],
    requiredNotes: ["Conteúdo educativo; não substitui acompanhamento de profissional especializado.", "Resultados dependem do contexto e da aplicação de cada casal ou família."],
    ctaPreference: ["Saiba mais", "Baixar", "Learn More", "Conhecer"],
    creativeFormats: ["mockup do material", "video de demonstração de uso", "carrossel de dicas de planejamento conjunto"],
    audienceHints: ["público amplo com interesses em relacionamento, família e planejamento", "não segmentar por estado civil ou conflito pessoal"],
  },
  produtividade_organizacao: {
    id: "produtividade_organizacao", label: "Produtividade e organização", regulatedCategory: "none", strictness: "normal",
    keywords: ["produtividade", "organizacao", "planejamento", "planner", "planilha", "planilhas", "rotina", "metas", "agenda", "to-do", "tarefas", "checklist", "gestao de tempo", "gestão de tempo", "habito", "habitos", "foco", "eficiencia", "productivity", "planner", "spreadsheet", "routine", "goals", "agenda", "task", "time management", "organizacion", "rutina", "metas"],
    tone: "pratico, motivador e direto; foco em rotina, metas e metodo, sem promessas",
    angles: ["organizacao simples", "erro comum de rotina", "passo a passo", "comparacao de metodos (papel, planilha, app)", "checklist", "curiosidade sobre habitos de tempo"],
    hookStyles: ["dica pratica", "checklist", "pergunta neutra sobre metodo", "erro comum de produtividade"],
    avoidWords: ["dobre sua produtividade", "dobre seus resultados", "resultado garantido", "produtividade garantida", "sem esforco", "milagre", "metodo secreto", "fique rico", "double your productivity", "guaranteed result", "miracle", "duplica tu productividad", "resultado garantizado", "sin esfuerzo"],
    requiredNotes: ["Conteúdo educativo; resultados dependem da aplicação e do contexto de cada pessoa."],
    ctaPreference: ["Saiba mais", "Baixar", "Learn More", "Conhecer"],
    creativeFormats: ["print ilustrativo da planilha ou planner (sem dados reais de pessoas)", "carrossel passo a passo", "video curto de uso"],
    audienceHints: ["público amplo com interesses em produtividade, organização e metas", "não segmentar por desempenho pessoal"],
  },
  saude_bem_estar: {
    id: "saude_bem_estar", label: "Saude e bem-estar", regulatedCategory: "health", strictness: "high",
    keywords: ["saude", "bem-estar", "sono", "travesseiro", "colchao", "postura", "coluna", "pescoco", "ergonom", "massagem", "fisioterapia", "memoria", "foco", "concentracao", "cognitivo", "mente", "claridade mental", "neblina mental", "brain fog", "memoria", "enfoque", "concentracion", "cognitivo", "mente", "salud mental", "health", "wellness", "sleep", "pillow", "posture", "memory", "focus", "cognitive", "mental clarity", "salud", "sueno", "almohada"],
    tone: "empatico, calmo e educativo; fala de conforto e rotina, nunca de diagnostico",
    angles: ["educacional (como funciona)", "cena do dia a dia (manha ou noite)", "mito vs fato", "curiosidade", "comparacao com a categoria (sem marcas)", "beneficio direto"],
    hookStyles: ["observacao do cotidiano", "pergunta aberta e neutra", "dica rapida", "mito comum"],
    avoidWords: ["cura", "curar", "elimina", "eliminar", "trata", "tratamento", "sua dor", "suas dores", "alivio garantido", "clinicamente comprovado", "aprovado por medicos", "cure", "heal", "treat", "eliminates", "your pain", "clinically proven", "doctor approved", "tu dolor", "clinicamente probado", "elimina el dolor"],
    requiredNotes: ["Nao substitui orientacao de profissional de saude.", "Resultados variam de pessoa para pessoa."],
    ctaPreference: ["Saiba mais", "Learn More", "Mas informacion"],
    creativeFormats: ["foto do produto em ambiente real", "carrossel educativo de 3 a 5 cards", "video curto de demonstracao", "UGC so com pessoas que realmente usam e autorizaram"],
    audienceHints: ["publico amplo com interesses de sono, bem-estar e ergonomia", "nao segmentar por condicao de saude"],
  },
  suplementos_emagrecimento: {
    id: "suplementos_emagrecimento", label: "Suplementos e emagrecimento", regulatedCategory: "supplement", strictness: "high",
    keywords: ["suplemento", "emagrec", "gordura", "queima", "detox", "vitamina", "capsula", "whey", "colageno", "proteina", "nutricao", "omega", "magnesio", "ferro", "zinc", "supplement", "weight loss", "fat burner", "vitamin", "capsule", "protein", "nutrition", "collagen", "adelgaz", "suplemento", "vitamina", "proteina"],
    tone: "informativo e responsavel, sem promessas sobre o corpo",
    angles: ["educacional sobre habitos e rotina", "curiosidade sobre ingredientes (apenas os do rotulo)", "mito vs fato", "beneficio declarado no rotulo"],
    hookStyles: ["dica de rotina", "mito comum", "curiosidade sobre um ingrediente do rotulo"],
    avoidWords: ["emagreca", "emagrecer", "perca peso", "queime gordura", "barriga", "antes e depois", "milagre", "resultado garantido", "sem esforco", "detox", "lose weight", "burn fat", "belly fat", "miracle", "before and after", "guaranteed", "no effort", "adelgaza", "quema grasa", "milagro", "antes y despues"],
    requiredNotes: ["Suplemento nao e medicamento e nao substitui alimentacao equilibrada.", "Resultados variam."],
    ctaPreference: ["Saiba mais", "Learn More"],
    creativeFormats: ["embalagem e rotulo reais", "video explicando os ingredientes do rotulo", "carrossel de rotina saudavel"],
    audienceHints: ["publico amplo", "nao segmentar por corpo ou peso"],
  },
  financas_educacao: {
    id: "financas_educacao", label: "Financas e educacao financeira", regulatedCategory: "finance", strictness: "high",
    keywords: ["financ", "dinheiro", "orcamento", "planilha", "economia", "poupar", "investimento", "divida", "credito", "budget", "money", "spreadsheet", "savings", "presupuesto", "ahorro"],
    tone: "claro, pratico e direto; foco em organizacao e clareza, sem promessas",
    angles: ["organizacao simples", "erro comum", "passo a passo", "comparacao de metodos (papel, planilha, app)", "checklist", "curiosidade sobre habitos de gasto"],
    hookStyles: ["dica pratica", "checklist", "pergunta neutra sobre metodo", "erro comum"],
    avoidWords: ["fique rico", "renda garantida", "dobre seu dinheiro", "rentabilidade garantida", "sem risco", "limpar nome", "nome sujo", "voce esta endividado", "voce esta devendo", "get rich", "guaranteed returns", "double your money", "risk-free", "hazte rico", "retorno garantizado", "sin riesgo"],
    requiredNotes: ["Conteudo educativo; nao e consultoria financeira.", "Resultados dependem do uso e da situacao de cada pessoa."],
    ctaPreference: ["Saiba mais", "Baixar", "Learn More", "Download"],
    creativeFormats: ["print ilustrativo da planilha ou ferramenta (sem valores reais de pessoas)", "carrossel passo a passo", "video de 15s mostrando o uso"],
    audienceHints: ["publico amplo com interesses de financas pessoais e organizacao", "nao segmentar por situacao financeira"],
  },
  renda_empreendedorismo: {
    id: "renda_empreendedorismo", label: "Renda e empreendedorismo", regulatedCategory: "income", strictness: "high",
    keywords: ["renda extra", "ganhar dinheiro", "empreend", "negocio", "afiliado", "marketing digital", "trabalhar em casa", "make money", "side hustle", "online business", "ganar dinero", "emprendimiento"],
    tone: "realista e educacional; foco em aprendizado e metodo, nunca em ganhos",
    angles: ["educacional sobre o metodo", "erro comum de iniciante", "passo a passo", "curiosidade sobre o modelo de negocio", "comparacao de caminhos"],
    hookStyles: ["erro de iniciante", "pergunta neutra sobre metodo", "mini-aula"],
    avoidWords: ["renda garantida", "fique rico", "ganhe R$", "ganhe $", "por dia", "dinheiro facil", "vire milionario", "faturei", "print de ganhos", "liberdade financeira em", "guaranteed income", "make $", "easy money", "get rich quick", "become a millionaire", "ingresos garantidos", "dinero facil", "hazte millonario"],
    requiredNotes: ["Nao ha garantia de resultados financeiros.", "Resultados dependem de esforço, contexto e aplicacao do metodo."],
    ctaPreference: ["Saiba mais", "Learn More"],
    creativeFormats: ["video explicativo", "carrossel passo a passo", "sem prints de ganhos e sem imagens de dinheiro, carros ou viagens"],
    audienceHints: ["publico amplo com interesses em empreendedorismo e educacao", "nao segmentar por renda ou desemprego"],
  },
  beleza_cuidados: {
    id: "beleza_cuidados", label: "Beleza e cuidados pessoais", regulatedCategory: "beauty", strictness: "normal",
    keywords: ["beleza", "pele", "cabelo", "skincare", "cosmetic", "maquiagem", "creme", "serum", "unha", "beauty", "hair", "skin", "belleza", "piel", "cabello"],
    tone: "inspirador, sensorial e acolhedor",
    angles: ["rotina de cuidado", "textura, sensacao e aroma (descritivo)", "educacional sobre ingredientes do rotulo", "mito vs fato", "cena do dia a dia"],
    hookStyles: ["momento da rotina", "curiosidade sobre um ingrediente", "dica rapida"],
    avoidWords: ["rejuvenesca", "anos a menos", "antes e depois", "elimina rugas", "remove manchas", "milagre", "dermatologicamente comprovado", "sua pele e", "seu cabelo esta", "rejuvenate", "erase wrinkles", "before and after", "clinically proven", "your skin is", "your hair is", "rejuvenece", "elimina arrugas"],
    requiredNotes: ["Resultados variam conforme o tipo de pele ou cabelo e o uso.", "Leia o rotulo e faca teste de sensibilidade."],
    ctaPreference: ["Saiba mais", "Comprar agora", "Shop Now"],
    creativeFormats: ["foto da textura e da embalagem", "video da rotina de uso", "carrossel de ingredientes do rotulo"],
    audienceHints: ["publico amplo com interesses em beleza e autocuidado"],
  },
  produto_fisico_casa: {
    id: "produto_fisico_casa", label: "Produto fisico e casa", regulatedCategory: "none", strictness: "normal",
    keywords: ["casa", "cozinha", "organizador", "decoracao", "utensilio", "ferramenta", "limpeza", "home", "kitchen", "organizer", "tool", "hogar", "cocina"],
    tone: "pratico, objetivo e visual",
    angles: ["problema-solucao do cotidiano", "demonstracao de uso", "comparacao com a categoria", "detalhe de material ou qualidade (so do produto)", "presente ou ocasiao (sem urgencia)"],
    hookStyles: ["pequeno incomodo do dia a dia", "demonstracao em 3 segundos", "pergunta pratica"],
    avoidWords: ["o melhor do mundo", "numero 1", "mudou minha vida", "so hoje", "ultimas unidades", "imperdivel", "best in the world", "life-changing", "only today", "last chance", "limited stock", "el mejor del mundo"],
    requiredNotes: ["Informe material, medidas e garantia apenas se estiverem nos fatos verificados."],
    ctaPreference: ["Comprar agora", "Saiba mais", "Shop Now"],
    creativeFormats: ["video de demonstracao de 15s", "foto em ambiente real", "carrossel de detalhes"],
    audienceHints: ["publico amplo com interesses de casa e organizacao"],
  },
  produto_digital_infoproduto: {
    id: "produto_digital_infoproduto", label: "Produto digital e cursos", regulatedCategory: "none", strictness: "normal",
    keywords: ["curso", "ebook", "e-book", "treinamento", "mentoria", "aula", "template", "guia", "download", "digital", "course", "training", "workshop", "curso online", "infoproduto", "produtor digital", "ebook", "curso", "taller", "guia", "plantilla"],
    tone: "didatico e claro, focado no conteudo",
    angles: ["o que voce vai aprender", "para quem e (neutro)", "mito vs fato do tema", "mini-aula ou passo a passo", "curiosidade sobre o metodo"],
    hookStyles: ["mini-aula", "pergunta sobre o tema", "erro comum"],
    avoidWords: ["resultado garantido", "metodo secreto", "segredo que ninguem conta", "garantido", "secret method", "guaranteed results", "nobody tells you", "metodo secreto", "resultado garantizado"],
    requiredNotes: ["Nao ha garantia de resultados; dependem da aplicacao do conteudo.", "Informe formato, acesso e reembolso apenas se verificados."],
    ctaPreference: ["Saiba mais", "Baixar", "Cadastre-se", "Learn More"],
    creativeFormats: ["mockup do material", "video de mini-aula", "carrossel com o conteudo"],
    audienceHints: ["publico amplo com interesses ligados ao tema do material"],
  },
  hobbies_artesanato: {
    id: "hobbies_artesanato", label: "Hobbies e artesanato", regulatedCategory: "none", strictness: "normal",
    keywords: ["croche", "crochê", "costura", "tricot", "tricô", "diy", "patchwork", "bordado", "bordar", "tecelagem", "macrame", "amigurumi", "papelaria artesanal", "artesanato", "manualidades", "faça voce mesmo", "faça você mesmo", "crochet", "knitting", "sewing", "embroidery", "needlework", "craft", "ganchillo", "punto", "bordado", "lana", "hilo"],
    tone: "inspirador, paciente e didatico; foco no aprendizado passo a passo e no prazer de criar",
    angles: ["o que voce vai criar", "para quem e (iniciante ou avancado)", "passo a passo", "curiosidade sobre a tecnica", "cena do dia a dia do hobby"],
    hookStyles: ["pequena conquista do dia a dia", "pergunta sobre o nivel atual", "dica pratica"],
    avoidWords: ["resultado garantido", "aprenda em 5 minutos", "metodo secreto", "fique rico vendendo artesanato", "guaranteed result", "learn in 5 minutes", "secret method", "resultado garantizado", "aprende en 5 minutos"],
    requiredNotes: ["Resultados dependem da pratica e do nivel de cada pessoa."],
    ctaPreference: ["Saiba mais", "Baixar", "Learn More", "Conhecer"],
    creativeFormats: ["mockup do material", "video de passo a passo", "carrossel com o conteudo"],
    audienceHints: ["publico amplo com interesses em artesanato, hobbies e projetos manuais"],
  },
  pets: {
    id: "pets", label: "Pets", regulatedCategory: "none", strictness: "normal",
    keywords: ["pet", "cachorro", "gato", "racao", "coleira", "dog", "cat", "puppy", "perro", "mascota"],
    tone: "afetuoso, leve e responsavel",
    angles: ["cena do dia a dia com o pet", "dica de cuidado", "curiosidade sobre comportamento", "beneficio direto do produto", "comparacao com a categoria"],
    hookStyles: ["cena fofa do cotidiano", "dica rapida de tutor", "pergunta leve"],
    avoidWords: ["cura", "trata doencas", "aprovado por veterinarios", "milagre", "cures", "vet approved", "treats disease", "miracle", "aprobado por veterinarios"],
    requiredNotes: ["Em caso de problema de saude do animal, consulte um veterinario."],
    ctaPreference: ["Saiba mais", "Comprar agora", "Shop Now"],
    creativeFormats: ["foto ou video do pet usando o produto", "carrossel de dicas", "sem imagens de animais sofrendo"],
    audienceHints: ["publico amplo com interesses em pets"],
  },
  tecnologia_gadgets: {
    id: "tecnologia_gadgets", label: "Tecnologia e gadgets", regulatedCategory: "none", strictness: "normal",
    keywords: ["celular", "fone", "carregador", "smartwatch", "camera", "gadget", "eletronico", "tecnologia", "app", "software", "phone", "headphone", "charger", "tech", "device", "tecnologia"],
    tone: "objetivo, informativo e especifico",
    angles: ["especificacao que importa na pratica", "comparacao com a categoria", "caso de uso", "dica de uso", "novidade ou curiosidade (sem datas falsas)"],
    hookStyles: ["problema tecnico comum", "demonstracao rapida", "pergunta objetiva"],
    avoidWords: ["revolucionario", "o mais rapido do mundo", "100% seguro", "a prova de hackers", "revolutionary", "fastest in the world", "unhackable", "military-grade", "el mas rapido del mundo"],
    requiredNotes: ["Cite especificacoes somente se estiverem nos fatos verificados.", "Nao use marcas de terceiros como se fossem a sua loja."],
    ctaPreference: ["Saiba mais", "Comprar agora", "Shop Now", "Learn More"],
    creativeFormats: ["video de demonstracao", "foto do produto em uso", "carrossel de especificacoes verificadas"],
    audienceHints: ["publico amplo com interesses em tecnologia e o tipo de produto"],
  },
  geral: {
    id: "geral", label: "Geral", regulatedCategory: "none", strictness: "normal", keywords: [],
    tone: "claro, honesto e com beneficio concreto",
    angles: ["problema-solucao", "educacional", "curiosidade", "beneficio direto", "mito vs fato"],
    hookStyles: ["pergunta aberta", "dica rapida", "observacao do cotidiano"],
    avoidWords: ["garantido", "milagre", "so hoje", "ultimas unidades", "unica chance", "guaranteed", "miracle", "only today", "last chance", "garantizado", "milagro", "solo hoy"],
    requiredNotes: [],
    ctaPreference: ["Saiba mais", "Learn More"],
    creativeFormats: ["foto do produto", "video curto", "carrossel"],
    audienceHints: ["publico amplo com interesses relacionados ao produto"],
  },
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function hasKeyword(hay: string, k: string): boolean {
  const nk = norm(k);
  if (nk.length <= 4) return new RegExp(`(^|[^a-z0-9])${esc(nk)}([^a-z0-9]|$)`).test(hay);
  return hay.includes(nk);
}

export interface DetectedNiche {
  primary: Playbook;
  secondary?: Playbook;
  confidence: "alta" | "media" | "baixa";
  matched: string[];
}

export function detectNiche(text: string): DetectedNiche {
  const hay = norm(text || "");
  const scored = Object.values(PLAYBOOKS)
    .filter((p) => p.id !== "geral")
    .map((p) => {
      const matched = p.keywords.filter((k) => hasKeyword(hay, k));
      let score = Math.min(matched.length, 6);
      return { p, score, matched };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score === 0) return { primary: PLAYBOOKS.geral, confidence: "baixa", matched: [] };
  const second = scored[1];
  const confidence: DetectedNiche["confidence"] = best.score >= 4 ? "alta" : best.score >= 2 ? "media" : "baixa";
  return {
    primary: best.p,
    secondary: second && second.score >= 2 ? second.p : undefined,
    confidence,
    matched: best.matched.slice(0, 8),
  };
}

export function listPlaybooks(): { id: string; label: string }[] {
  return Object.values(PLAYBOOKS).map((p) => ({ id: p.id, label: p.label }));
}

export function pickPlaybooks(input: { niche?: string; subniche?: string; productName?: string; description?: string; category?: string }) {
  const hay = norm([input.niche, input.subniche, input.productName, input.description].filter(Boolean).join(" "));
  const scored = Object.values(PLAYBOOKS)
    .filter((p) => p.id !== "geral")
    .map((p) => {
      let score = Math.min(p.keywords.filter((k) => hasKeyword(hay, k)).length, 6);
      if (input.category && p.regulatedCategory !== "none" && input.category === p.regulatedCategory) score += 3;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score === 0) return { primary: PLAYBOOKS.geral, secondary: undefined as Playbook | undefined };
  const second = scored[1];
  return { primary: best.p, secondary: second && second.score >= 2 ? second.p : undefined };
}

export function mergePlaybooks(primary: Playbook, secondary?: Playbook): Playbook {
  if (!secondary) return primary;
  const uniq = (a: string[]) => Array.from(new Set(a));
  return {
    ...primary,
    avoidWords: uniq([...primary.avoidWords, ...secondary.avoidWords]),
    requiredNotes: uniq([...primary.requiredNotes, ...secondary.requiredNotes]),
    strictness: primary.strictness === "high" || secondary.strictness === "high" ? "high" : "normal",
    regulatedCategory: primary.regulatedCategory !== "none" ? primary.regulatedCategory : secondary.regulatedCategory,
  };
}

export function playbookToPrompt(pb: Playbook, language: string): string {
  return [
    `PLAYBOOK DO NICHO: ${pb.label} (rigor: ${pb.strictness}).`,
    `Tom: ${pb.tone}.`,
    `Angulos preferidos: ${pb.angles.join("; ")}.`,
    `Estilos de gancho: ${pb.hookStyles.join("; ")}.`,
    `Formatos de criativo: ${pb.creativeFormats.join("; ")}.`,
    `Dicas de publico: ${pb.audienceHints.join("; ")}.`,
    `NUNCA use estas palavras ou expressoes (em qualquer idioma): ${pb.avoidWords.join(" | ")}.`,
    pb.requiredNotes.length ? `Avisos que devem acompanhar a campanha ou a pagina: ${pb.requiredNotes.join(" ")}` : "",
    pb.strictness === "high" ? "Rigor alto: linguagem descritiva e educativa; nao aluda a condicao, corpo, saude, divida ou renda do leitor; nenhum numero que nao esteja nos fatos verificados." : "",
    `Escreva em ${language}, com linguagem nativa e natural.`,
  ].filter(Boolean).join("\n");
}
