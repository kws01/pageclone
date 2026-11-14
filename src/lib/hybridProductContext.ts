import type { ExtractedPage } from "@/parser/extractPage";

export function buildProductContext(page: ExtractedPage, topic: string): string {
  const lines: string[] = [];
  const add = (label: string, value?: string | string[] | null) => {
    const text = Array.isArray(value) ? value.filter(Boolean).join("; ") : value?.trim();
    if (text) lines.push(`${label}: ${text}`);
  };

  add("Título da página", page.title);
  add("Título principal", page.headline);
  add("Subtítulo", page.subheadline);
  add("Descrição", page.description);
  add("Benefícios citados na página", page.benefits.slice(0, 10));
  add("Garantia", page.guaranteeText || (page.guaranteeDays ? `${page.guaranteeDays} dias` : undefined));
  const offer = page.facts.offers[0];
  add("Preço", offer?.perUnit || offer?.total);
  add("Tema informado pelo usuário", topic);

  return lines.join("\n");
}
