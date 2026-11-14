import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { useState } from "react";
import { Copy, Check, Sparkles, Search, BookOpen, Megaphone, FileText, PenTool, Target, Video, Lightbulb } from "lucide-react";

interface PromptCard {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  icon: typeof Sparkles;
}

const prompts: PromptCard[] = [
  {
    id: "clone-analysis",
    title: "Analise de Pagina de Vendas",
    category: "Analise",
    description: "Extraia a estrutura, gatilhos mentais e copia de uma pagina de vendas existente.",
    icon: Search,
    prompt: `Analise a seguinte pagina de vendas e extraia:
1. A proposta de valor principal
2. Os gatilhos mentais utilizados
3. A estrutura da pagina (hero, prova social, oferta, garantia, etc.)
4. Os pontos de dor abordados
5. O publico-alvo identificado

Pagina: [COLE A URL OU HTML AQUI]`,
  },
  {
    id: "copy-hero",
    title: "Gerar Headline de Impacto",
    category: "Copywriting",
    description: "Crie headlines poderosas para a secao hero da sua pagina de vendas.",
    icon: PenTool,
    prompt: `Voce e um copywriter especialista em direct response.
Crie 10 headlines de impacto para uma pagina de vendas sobre: [SEU PRODUTO/SERVICO].

Requisitos:
- Use os principios de copywriting de Dan Kennedy e Eugene Schwartz
- Cada headline deve ter no maximo 12 palavras
- Inclua uma variacao com numero, uma com pergunta e uma com curiosidade
- Adapte o tom para o publico brasileiro`,
  },
  {
    id: "quiz-funnel",
    title: "Criar Funil de Descoberta",
    category: "Funil",
    description: "Gere perguntas e resultados para um quiz que qualifica leads.",
    icon: BookOpen,
    prompt: `Crie um funil de descoberta (quiz) para o seguinte nicho: [SEU NICHO].

Estrutura necessaria:
1. 5-7 perguntas com 2-4 opcoes cada
2. 3 perfis de resultado baseados nas respostas
3. Para cada perfil: uma recomendacao de produto/servico
4. Uma pontuacao ou logica de roteamento entre perguntas e resultados

O quiz deve ser engajante e fazer o usuario sentir que esta descobrindo algo sobre si mesmo.`,
  },
  {
    id: "ad-creative",
    title: "Criativos para Anuncios",
    category: "Anuncios",
    description: "Gere angulos e criativos para anuncios Facebook e Instagram.",
    icon: Megaphone,
    prompt: `Crie 5 variacoes de criativos para anuncios (Facebook/Instagram) sobre: [SEU PRODUTO].

Para cada criativo, inclua:
1. Angulo (ex: dor, aspiracional, curiosidade, prova social, contradicao)
2. Headline (max 40 caracteres)
3. Texto principal (max 125 caracteres para a primeira frase)
4. Descricao (max 30 caracteres)
5. Sugestao de imagem/video

Siga as politicas de publicidade do Meta e evite claims proibidos.`,
  },
  {
    id: "google-ads-search-full",
    title: "Google Ads - Rede de Pesquisa Completo (Afiliados & Vendas)",
    category: "Anuncios",
    description: "Gere campanha completa de Google Ads com 10 títulos, 10 descrições, 10 sitelinks, palavras-chave e negativas formatadas.",
    icon: Megaphone,
    prompt: `---
Você é um especialista sênior em Google Ads (Rede de Pesquisa) focado em campanhas de alta conversão para afiliados e e-commerce.
Escreva a campanha em [IDIOMA] para o público de [PAÍS].

# CONTEXTO DO PRODUTO:
- Nome do Produto: [NOME DO PRODUTO]
- Nicho / Categoria: [NICHO]
- Página de Vendas / Destino: [URL DE DESTINO]
- Fatos Verificados (Preço, Garantia, Bônus, Frete): [FATOS VERIFICADOS]

# SUA TAREFA:
Crie a estrutura completa de anúncios respeitando rigorosamente os limites de caracteres do Google Ads.

# ENTREGA (Siga este formato exato, uma linha por item):

TITULOS (Exatamente 10 títulos; MÁXIMO 30 caracteres cada; misture palavra-chave, dor, benefício e chamada para ação):
T01 | [Texto do Título]
T02 | [Texto do Título]
T03 | [Texto do Título]
T04 | [Texto do Título]
T05 | [Texto do Título]
T06 | [Texto do Título]
T07 | [Texto do Título]
T08 | [Texto do Título]
T09 | [Texto do Título]
T10 | [Texto do Título]

DESCRICOES (Exatamente 10 descrições; MÁXIMO 90 caracteres cada):
D01 | [Texto da Descrição]
D02 | [Texto da Descrição]
D03 | [Texto da Descrição]
D04 | [Texto da Descrição]
D05 | [Texto da Descrição]
D06 | [Texto da Descrição]
D07 | [Texto da Descrição]
D08 | [Texto da Descrição]
D09 | [Texto da Descrição]
D10 | [Texto da Descrição]

SITELINKS (Exatamente 10 sitelinks com título e 2 linhas de descrição):
S01 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S02 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S03 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S04 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S05 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S06 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S07 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S08 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S09 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)
S10 | Título do Link (máx 25) | Linha 1 (máx 35) | Linha 2 (máx 35)

PALAVRAS_CHAVE (Exatamente 10 palavras-chave principais):
K01 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K02 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K03 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K04 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K05 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K06 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K07 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K08 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K09 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]
K10 | [Palavra-chave] | Correspondência: [Frase ou Exata] | Intenção: [Fundo de Funil / Meio de Funil]

PALAVRAS_CHAVE_NEGATIVAS (Mínimo de 15 palavras que evitam cliques curiosos ou sem intenção de compra):
N01 a N15 | Lista de termos negativos (grátis, download, login, pdf, reclame aqui, etc.)

REGRAS OBRIGATÓRIAS:
1. Conte os caracteres de cada linha antes de responder. Nenhum título pode passar de 30 caracteres e nenhuma descrição pode passar de 90.
2. Não invente garantias, preços ou bônus que não estejam nos Fatos Verificados.
3. Não utilize a palavra "Oficial" nem marcas registradas no título se for campanha de afiliado sem autorização.
---`,
  },
  {
    id: "sales-page-builder",
    title: "Estruturar Pagina de Vendas",
    category: "Pagina de Vendas",
    description: "Monte a estrutura completa de uma sales page do zero.",
    icon: FileText,
    prompt: `Estruture uma pagina de vendas completa para: [DESCREVA SEU PRODUTO].

Inclua todas as secoes na ordem correta:
1. Headline + subheadline + call to action primario
2. Apresentacao do problema
3. A solucao (introducao do produto)
4. Beneficios (nao features)
5. Prova social (depoimentos, numeros, cases)
6. Oferta e bonus
7. Garantia
8. Escassez/urgencia
9. FAQ
10. Call to action final

Para cada secao, escreva o texto base pronto para usar.`,
  },
  {
    id: "refine-copy",
    title: "Refinar Copia Existente",
    category: "Copywriting",
    description: "Melhore uma copia que ja existe, tornando-a mais persuasiva.",
    icon: Sparkles,
    prompt: `Revise e melhore o seguinte texto de venda, tornando-o mais persuasivo e direto:

[COLE O TEXTO AQUI]

Melhore:
1. Clareza e objetividade
2. Forca das palavras (substitua palavras fracas por palavras de acao)
3. Fluxo e ritmo da leitura
4. Gatilhos mentais
5. Call to action

Mantenha o mesmo significado, mas eleve o nivel da copy.`,
  },
  {
    id: "quiz-alta-retencao",
    title: "Quiz de Alta Retenção (Kiwify / Hotmart)",
    category: "Funil",
    description: "Sequência lógica de 5 a 7 perguntas de qualificação e engajamento para direcionar ao checkout.",
    icon: Target,
    prompt: `Você é um especialista em Copywriting e UX para Funis de Quiz de Alta Conversão em tráfego pago.

Crie a estrutura completa de um Quiz Interativo com base nas informações abaixo:

# DADOS DO PRODUTO:
- Nome do Produto: [NOME DO PRODUTO]
- Nicho / Mercado: [NICHO]
- Dor Principal do Público: [DOR PRINCIPAL]
- Solução / Mecanismo Único: [O QUE SEU PRODUTO FAZ DE DIFERENTE]
- Link do Checkout / VSL: [URL DO CHECKOUT OU PÁGINA FINAL]

# ESTRUTURA DO QUIZ (Entregue exatamente esta sequência):

1. HOOK / TÍTULO DA PÁGINA INICIAL:
   - Headline chamativa (máx. 12 palavras) focada em curiosidade ou diagnóstico rápido.
   - Subtítulo com promessa de resultado após responder ao teste.

2. SEQUÊNCIA DE PERGUNTAS (De 5 a 7 perguntas curtas):
   - Pergunta 1: Conscientização e Identificação (Ex: Idade, objetivo ou rotina).
   - Pergunta 2 a 4: Diagnóstico do Problema (Aprofundando as dores e tentativas frustradas).
   - Pergunta 5: Personalização da Solução (Fazer o usuário sentir que a resposta é 100% personalizada para ele).
   - Opções de resposta (3 a 4 alternativas simples por pergunta).

3. TELA DE PROCESSAMENTO / ANÁLISE:
   - 3 frases curtas de carregamento (ex: "Analisando suas respostas...", "Gerando plano personalizado...").

4. PÁGINA DE RESULTADO E OFERTA FINAL:
   - Diagnóstico rápido baseado no perfil.
   - Transição lógica conectando o problema apontado à solução do [NOME DO PRODUTO].
   - Chamada para ação (CTA) clara incentivando o clique para o checkout.`,
  },
  {
    id: "vsl-copy-aida",
    title: "VSL e Copy Completa para Página de Vendas (AIDA)",
    category: "Copywriting",
    description: "Estrutura completa de texto para topo de página, VSL curta, benefícios e FAQ.",
    icon: Video,
    prompt: `Você é um Copywriter Sênior especializado em resposta direta para Páginas de Vendas (Sales Pages) de alta conversão.

Crie o texto de vendas completo utilizando o método AIDA (Atenção, Interesse, Desejo, Ação) para o produto abaixo:

# CONTEXTO DO PRODUTO:
- Produto: [NOME DO PRODUTO]
- Preço e Garantia: [PREÇO] | [DIAS DE GARANTIA]
- Benefícios Principais: [LISTE DE 3 A 5 BENEFÍCIOS]
- Para quem é: [PÚBLICO-ALVO]

# ESTRUTURA REQUISITADA:

1. SEÇÃO HERO (Topo da Página):
   - Headline H1 (Forte, com promessa clara e sem clichês).
   - Sub-headline H2 (Reforçando o benefício e eliminando a principal objeção).
   - Texto para o Botão principal de Ação (CTA).

2. ROTEIRO RÁPIDO PARA VSL / VÍDEO DE VENDAS (1 a 2 minutos):
   - Gancho (Primeiros 5 segundos de retenção).
   - Problema/Agitação (Expondo a dor do cliente).
   - Apresentação da Solução (Como o produto resolve).
   - Chamada para Ação.

3. CORPO DA PÁGINA:
   - "Para quem é este produto" (4 tópicos rápidos).
   - "O que você vai receber" (Detalhamento do conteúdo/módulos ou bônus).
   - Prova de Risco Zero (Apresentação da Garantia incondicional).

4. SEÇÃO DE PERGUNTAS FREQUENTES (FAQ):
   - 5 perguntas mais comuns do público sobre compras online, acesso, garantia e resultados, com respostas diretas.`,
  },
  {
    id: "big-idea-angulos",
    title: "Gerador de Big Idea e 5 Ângulos Únicos de Venda",
    category: "Analise",
    description: "Descubra 5 ganchos estratégicos (Dor, Lógica, Oportunidade, etc.) para diversificar seus anúncios e quizes.",
    icon: Lightbulb,
    prompt: `Você é um estrategista de marketing e mestre em criação de "Big Ideas" para produtos digitais e e-commerce.

Sua missão é criar 5 Ângulos Únicos de Venda (Unique Selling Angles) diferentes para promover o produto abaixo em tráfego pago.

# DADOS DO PRODUTO:
- Produto/Serviço: [NOME E DESCRIÇÃO CURTA]
- Público-Alvo: [QUEM COMPRA]
- Concorrentes Principais: [PRINCIPAIS CONCORRENTES DO NICHO]

# ENTREGUE OS 5 ÂNGULOS NO SEGUINTE FORMATO:

1. ÂNGULO DA OPORTUNIDADE (Foco em novidade ou atalho):
   - Conceito principal e Por que funciona.
   - Exemplo de Headline para Anúncio/Quiz.

2. ÂNGULO DA DOR / FRUSTRAÇÃO (Foco nas tentativas que falharam no passado):
   - Conceito principal e Por que funciona.
   - Exemplo de Headline para Anúncio/Quiz.

3. ÂNGULO DA LÓGICA / CIÊNCIA (Foco no mecanismo de funcionamento):
   - Conceito principal e Por que funciona.
   - Exemplo de Headline para Anúncio/Quiz.

4. ÂNGULO DA ECONOMIA DE TEMPO/DINHEIRO (Foco na eficiência):
   - Conceito principal e Por que funciona.
   - Exemplo de Headline para Anúncio/Quiz.

5. ÂNGULO CONTRA-INTUITIVO (Quebrando uma crença comum do nicho):
   - Conceito principal e Por que funciona.
   - Exemplo de Headline para Anúncio/Quiz.`,
  },
];

const categories = ["Todos", "Analise", "Copywriting", "Funil", "Anuncios", "Pagina de Vendas"];

function PromptsPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = prompts.filter((p) => {
    const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (prompt: PromptCard): void => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
            <Sparkles className="h-4 w-4" />
            Biblioteca de Prompts
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Prompts prontos para acelerar suas paginas
          </h1>
          <p className="mt-3 text-muted-foreground">
            Copie e cole em qualquer IA generativa para gerar copias, estruturas e analises de vendas.
          </p>
        </div>

        <div className="mx-auto max-w-2xl mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === cat
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const Icon = p.icon;
            const isCopied = copiedId === p.id;
            return (
              <div
                key={p.id}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md hover:border-brand/40"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {p.category}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold">{p.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(p)}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    isCopied
                      ? "bg-green-600 text-white"
                      : "bg-brand text-brand-foreground hover:opacity-90"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copiar prompt
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            Nenhum prompt encontrado para sua busca.
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

export default PromptsPage;
