import type { ExtractedPage } from "@/parser/extractPage";
import { resolveAffiliateHref, resolveCtaText } from "./affiliate";
import { buildFullHtml } from "./full";
import { buildReconstructedHtml } from "./reconstruct";
import { cloneAccent } from "./styles";
import type { CloneContext, CloneOptions } from "./types";

export type { CloneOptions, CloneContext, CloneMode } from "./types";

function context(page: ExtractedPage, opts: CloneOptions): CloneContext {
  const headline = (opts.headline || page.headline || page.title || "").trim();
  const subheadline = (opts.subheadline ?? page.subheadline ?? "").trim();
  const title = (opts.title || page.title || "Pagina Clonada").trim();
  return {
    page,
    opts,
    title,
    headline,
    subheadline,
    description: (page.description || "").trim(),
    ctaText: resolveCtaText(page, opts.ctaText),
    ctaHref: resolveAffiliateHref(page, opts.affiliateUrl),
    accent: cloneAccent(page.colors || []),
    logo: (opts.logo || "").trim(),
    aiAnalysis: opts.aiAnalysis,
  };
}

export function buildHtml(page: ExtractedPage, opts: CloneOptions): string {
  const ctx = context(page, opts);
  if (opts.mode === "reconstruct") return buildReconstructedHtml(ctx);
  return buildFullHtml(ctx);
}

export { resolveAffiliateHref, resolveCtaText, affiliateCtas } from "./affiliate";
export { buildFullHtml } from "./full";
