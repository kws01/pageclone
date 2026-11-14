import type { SalesPageData } from "@/services/salesPageAnalyzer";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function extractNumber(title: string): number {
  const m = title.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function cleanCta(text: string): string {
  return text
    .replace(/^[\s\u2192\u279C\u2794>\u00BB]+|[\s\u2192\u279C\u2794>\u00BB]+$/g, "")
    .trim();
}

function renderIconSvg(iconName: string): string {
  const icons: Record<string, string> = {
    shield: '<path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/><path d="M9 12l2 2 4-4"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-4 3-8 8-10 2 4 2 8 0 12-1 2-3 4-1 5z"/><path d="M11 20c0-5 2-9 5-12"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
    zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    brain: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/>',
    droplet: '<path d="M12 2.7s5 5.3 5 9.3a5 5 0 0 1-10 0c0-4 5-9.3 5-9.3z"/>',
    sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    bed: '<path d="M2 4v16M2 8h11a4 4 0 0 1 4 4v4M2 17h20M22 20v-8a4 4 0 0 0-4-4"/>',
    thermometer: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
  };
  const path = icons[iconName] || icons.sparkles;
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function ctaArrowSvg(): string {
  return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
}

function ctaLink(data: SalesPageData, text: string, cssClass: string, extraAttrs?: string): string {
  const cleaned = cleanCta(text);
  const href = escAttr(data.ctaUrl || "#");
  return `<a href="${href}" rel="sponsored nofollow noopener" target="_blank" class="${cssClass}" onclick="goToOffer(event)"${extraAttrs ? " " + extraAttrs : ""}>${esc(cleaned)} ${ctaArrowSvg()}</a>`;
}

function benefitsOverlapBullets(benefits: string[], bullets: string[]): boolean {
  if (benefits.length === 0 || bullets.length === 0) return false;
  const bulletWords = new Set(bullets.join(" ").toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  let overlap = 0;
  for (const b of benefits) {
    const words = b.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (words.some((w) => bulletWords.has(w))) overlap++;
  }
  return overlap / benefits.length > 0.5;
}

function renderPkgMockup(count: number, productImg: string | null): string {
  if (!productImg) {
    return `<div class="pkg-mockup pkg-mockup--compact"><span class="pkg-qty-pill">\u00d7${count}</span></div>`;
  }
  const isJpg = /\.jpe?g/i.test(productImg);
  const blend = isJpg ? ";mix-blend-mode:multiply" : "";
  const img = (style: string) =>
    `<img src="${escAttr(productImg)}" alt="" loading="lazy" class="pkg-mockup-img" style="${style}${blend}" />`;
  if (count <= 1) {
    return `<div class="pkg-mockup">${img("")}<span class="pkg-qty-pill">\u00d7${count}</span></div>`;
  }
  if (count === 2) {
    return `<div class="pkg-mockup pkg-mockup--pair"><div class="pkg-mockup-pair-grid">${img("align-self:start;transform:rotate(-3deg)")}${img("align-self:end;transform:rotate(3deg)")}</div><span class="pkg-qty-pill">\u00d72</span></div>`;
  }
  const display = Math.min(count, 4);
  return `<div class="pkg-mockup"><div class="pkg-mockup-grid">${Array.from({ length: display }, () => img("")).join("")}</div><span class="pkg-qty-pill">\u00d7${count}</span></div>`;
}

export function generateSalesPageHtml(
  data: SalesPageData,
  tracking: { headCode: string; bodyCode: string },
): string {
  const configJson = JSON.stringify(data).replace(/<\//g, "<\\/");
  const trackingJson = JSON.stringify(tracking).replace(/<\//g, "<\\/");

  const hasImages = data.productImages.length > 0;
  const heroImage = data.heroImage || (hasImages ? data.productImages[0] : "") || "";
  const hasHero = !!heroImage;
  const hasMediaLogos = !!data.showMediaLogos && data.mediaLogos.length > 0;
  const hasLogo = !!data.logoImage;
  const hasProductImage = !!data.productHeroImage;
  const hasRating = !!data.rating;
  const hasGuarantee = !!data.guaranteeText || data.guaranteeDays !== null;
  const hasTestimonials = data.testimonials.length >= 2;
  const hasReviews = data.reviews.length >= 1;
  const hasProductDetailCards = data.productDetailCards.length > 0;
  const hasArticleBlocks = data.articleBlocks.length > 0;
  const hasFaq = data.faqItems.length > 0;
  const hasPullQuote = !!data.pullQuote;
  const hasEditorial = !!data.editorialAnalysis && (data.editorialAnalysis.pros.length >= 2 || data.editorialAnalysis.cons.length >= 2);
  const hasComparison = data.comparisonRows.length >= 3;
  const hasIsForYou = data.isForYou.length >= 2;
  const hasEveningScene = !!data.eveningScene;
  const hideBenefits = benefitsOverlapBullets(data.benefits, data.bullets);
  const showPackageThumbs = !!data.showPackageThumbnails && hasProductImage;
  const hasDecisionChecklist = hasGuarantee || !!data.manualGuaranteeDays || !!data.manualShippingNotes || data.packages.some((p) => p.price);

  const guaranteeDays = (data.manualGuaranteeDays !== null ? String(data.manualGuaranteeDays) : null) || (data.guaranteeDays !== null ? String(data.guaranteeDays) : null);
  const guaranteeTitle = guaranteeDays
    ? `${guaranteeDays}-Day Guarantee`
    : "Guarantee";

  const headerCtaText = (data.headerCtaText || "See Offer").slice(0, 22);
  const traditionalColLabel = data.competitorName || "Traditional Solutions";
  const isPt = (data.lang || "en").toLowerCase().startsWith("pt");
  const dateLocale = isPt ? "pt-BR" : "en-US";
  const adLabel = isPt ? "Conte\u00fado publicit\u00e1rio" : "Advertising content";
  const adProductName = data.adProductName || data.productName || (isPt ? "este produto" : "this product");
  const adNoticeText = isPt
    ? `Aviso de publicidade: esta p\u00e1gina apresenta conte\u00fado publicit\u00e1rio e informa\u00e7\u00f5es relevantes sobre o ${adProductName}.`
    : `Advertising notice: this page presents advertising content and relevant information about ${adProductName}.`;
  const affiliateFooterText = isPt
    ? "Esta p\u00e1gina cont\u00e9m links de afiliados. Ao comprar pelos links, o portal pode ser remunerado, sem custo extra para voc\u00ea."
    : "This page contains affiliate links. If you buy through them, this site may earn a commission at no extra cost to you.";

  return `<!doctype html>
<html lang="${escAttr(data.lang || "en")}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.hookHeadline)}</title>
<meta name="description" content="${escAttr(data.hookSubheadline)}" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#f8fafc;--surface:#ffffff;--surface2:#f1f5f9;--text:#0f172a;--muted:#64748b;
  --accent:#2563eb;--accent2:#1d4ed8;--accentGrad:linear-gradient(135deg,#2563eb,#1d4ed8);
  --success:#059669;--warning:#f59e0b;--border:rgba(15,23,42,.10);--radius:16px;
  --cta-gold-grad:linear-gradient(135deg,#fbbf24,#f59e0b);
  --star:#f59e0b;
  --seal-grad:linear-gradient(135deg,#fbbf24,#f59e0b);
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --serif:Georgia,"Times New Roman",serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
.page{max-width:1120px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--surface);box-shadow:0 0 60px rgba(15,23,42,.05)}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.section{padding:32px 24px;animation:fadeIn .5s ease}

/* Top bar with rating */
.top-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 24px;background:#0f172a;border-bottom:1px solid var(--border);font-size:12px;gap:12px}
.top-bar-label{font-weight:700;color:#60a5fa;letter-spacing:1px;text-transform:uppercase;font-size:11px}
.top-bar-rating{display:flex;align-items:center;gap:4px;color:var(--star);font-size:11px}
.top-bar-rating .stars{display:inline-flex;gap:1px}
.top-bar-rating .stars svg{width:13px;height:13px;fill:var(--star);stroke:var(--star);stroke-width:1}
.top-bar-rating .rating-text{color:#f1f5f9;margin-left:4px}
.top-bar-date{color:#94a3b8;font-size:11px;white-space:nowrap}

/* Brand header (sticky) */
.brand-header{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:#fff;border-bottom:1px solid var(--border);box-shadow:0 1px 3px rgba(15,23,42,.05)}
.brand-header-left{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
.brand-logo{max-height:36px;max-width:140px;width:auto;object-fit:contain;flex-shrink:0}
.brand-name-fallback{font-size:clamp(14px,4.4vw,18px);font-weight:900;color:var(--text);letter-spacing:1px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;min-width:0;flex:1}
@media(max-width:640px){.brand-name-fallback{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.15;font-size:clamp(13px,4vw,18px);word-break:break-word}}
.brand-header-cta{display:inline-flex;align-items:center;gap:6px;background:var(--accentGrad);color:#fff;font-weight:700;padding:8px 16px;border-radius:8px;font-size:13px;text-decoration:none;white-space:nowrap;box-shadow:0 1px 2px rgba(37,99,235,.2);transition:opacity .2s}
.brand-header-cta:hover{opacity:.92}
.brand-header-cta svg{width:14px;height:14px;stroke:#fff;stroke-width:2.5;fill:none}
.top-bar-logo{display:none}
.top-bar-meta{display:flex;align-items:center;gap:10px;white-space:nowrap}
.top-bar-ad{font-size:11px;text-transform:uppercase;opacity:.8;letter-spacing:.5px;color:#94a3b8}

/* Ad notice banner */
.ad-notice{width:100%;background-color:#FEF3C7;color:#78350F;border-top:1px solid #FDE68A;border-bottom:1px solid #FDE68A;font-size:13px;line-height:1.4;text-align:center;padding:8px 16px}

/* As Seen On bar */
.as-seen-on{display:flex;align-items:center;justify-content:center;gap:18px;padding:14px 24px;background:var(--surface2);border-bottom:1px solid var(--border);flex-wrap:wrap}
.as-seen-on-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-right:4px}
.as-seen-on img{height:22px;width:auto;opacity:.55;filter:grayscale(1) brightness(.9);object-fit:contain}

/* Hero section */
.hook{padding:40px 24px 32px}
.hook-inner{display:flex;flex-direction:column;gap:24px}
.hook-content{text-align:center}
.hook h1{font-size:30px;line-height:1.2;font-weight:800;letter-spacing:-.8px;margin-bottom:16px;color:var(--text)}
.hook .sub{font-size:17px;line-height:1.55;color:#475569;max-width:540px;margin:0 auto 24px}
.hook .hero-img{width:100%;border-radius:var(--radius);overflow:hidden;margin:0 auto;border:1px solid var(--border);background:var(--surface);box-shadow:0 4px 16px rgba(15,23,42,.06)}
.hook .hero-img img{width:100%;display:block;object-fit:cover;object-position:center 30%;aspect-ratio:16/10;max-height:440px}
.hook .cta-wrap{margin-top:24px}

/* CTA buttons */
.btn-primary{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:18px 32px;border:none;border-radius:12px;
  font-size:18px;font-weight:700;color:#fff;cursor:pointer;text-decoration:none;
  background:var(--accentGrad);transition:transform .2s,box-shadow .2s;
  box-shadow:0 6px 20px rgba(37,99,235,.3);
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(37,99,235,.4)}
.btn-primary:active{transform:translateY(0)}
.btn-gold{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:20px 32px;border:none;border-radius:14px;
  font-size:18px;font-weight:800;color:#1a1200;cursor:pointer;text-decoration:none;
  background:var(--cta-gold-grad);transition:transform .2s,box-shadow .2s;
  box-shadow:0 8px 30px rgba(251,191,36,.3);text-align:center;line-height:1.3;
}
.btn-gold:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(251,191,36,.45)}
.btn-gold:active{transform:translateY(-1px)}
.urgency{font-size:14px;color:var(--warning);margin-top:12px;text-align:center}

/* Article blocks */
.article{padding:32px 24px}
.article-inner{max-width:720px;margin:0 auto}
.article-block{margin-bottom:28px}
.article-block:last-child{margin-bottom:0}
.article-block h3{font-family:var(--serif);font-size:21px;font-weight:700;margin-bottom:12px;line-height:1.3;color:var(--text)}
.article-block p{font-family:var(--serif);font-size:16px;line-height:1.75;color:#334155}
.article-quote{border-left:3px solid var(--accent);padding:12px 18px;margin:20px 0;font-family:var(--serif);font-size:17px;font-style:italic;color:#1e293b;background:rgba(37,99,235,.06);border-radius:0 12px 12px 0}

/* Bullets inline */
.bullets-inline{padding:0 24px 24px}
.bullets-inline-inner{max-width:720px;margin:0 auto}
.bullets-inline h2{font-size:20px;font-weight:700;margin-bottom:16px;color:var(--text)}
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:10px}
.bullet-list li{display:flex;align-items:flex-start;gap:10px;font-size:15px;line-height:1.55;color:#334155}
.bullet-list .check{color:var(--success);font-size:20px;flex-shrink:0;line-height:1.3}

/* Product details cards */
.product-details{padding:32px 24px;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.product-details h2{font-size:22px;font-weight:800;margin-bottom:20px;text-align:center;color:var(--text)}
.detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.detail-card{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:18px;text-align:center;transition:border-color .2s;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.detail-card:hover{border-color:rgba(37,99,235,.4)}
.detail-card-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;background:#dbeafe;color:#2563eb}
.detail-card-icon svg{width:22px;height:22px}
.detail-card-title{font-size:15px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:6px}
.detail-card-desc{font-size:13px;color:var(--muted);line-height:1.5}

/* Product intro with gallery */
.product-intro{padding:32px 24px;text-align:center}
.product-intro h2{font-size:24px;font-weight:800;margin-bottom:16px;color:var(--text)}
.product-intro p{font-size:16px;line-height:1.65;color:#475569;max-width:480px;margin:0 auto 24px}
.product-gallery{display:flex;flex-direction:column;gap:12px;margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto}
.product-main-img{width:100%;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);background:var(--surface2);box-shadow:0 4px 16px rgba(15,23,42,.06);padding:24px}
.product-main-img img{width:100%;display:block;object-fit:contain;max-height:400px}

/* Benefits */
.benefits{padding:32px 24px;background:rgba(37,99,235,.05);border:1px solid rgba(37,99,235,.15);border-radius:0;margin:0}
.benefits-inner{max-width:720px;margin:0 auto}
.benefits h2{font-size:22px;font-weight:700;margin-bottom:20px;text-align:center;color:var(--text)}
.benefit-list{list-style:none;display:flex;flex-direction:column;gap:12px}
.benefit-list li{display:flex;align-items:flex-start;gap:10px;font-size:15px;line-height:1.5;color:#334155}
.benefit-list .check{color:var(--accent);font-size:20px;flex-shrink:0;line-height:1.3}

/* Is This For You */
.is-for-you{padding:32px 24px;background:var(--surface2)}
.is-for-you-inner{max-width:720px;margin:0 auto}
.is-for-you h2{font-size:22px;font-weight:800;margin-bottom:16px;text-align:center;color:var(--text)}
.is-for-you-list{list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:24px}
.is-for-you-list li{display:flex;align-items:flex-start;gap:10px;font-size:15px;line-height:1.55;color:#334155}
.is-for-you-list .icon{color:var(--accent);flex-shrink:0;margin-top:1px}
.is-for-you-list .icon svg{width:20px;height:20px}

/* Evening Scene */
.evening-scene{padding:32px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);text-align:center}
.evening-scene-inner{max-width:640px;margin:0 auto}
.evening-scene p{font-family:var(--serif);font-size:17px;line-height:1.8;color:#e2e8f0;font-style:italic}

/* Package cards */
.packages{padding:32px 24px;background:#f1f5f9;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.packages-inner{max-width:960px;margin:0 auto}
.packages h2{font-size:22px;font-weight:800;margin-bottom:8px;text-align:center;color:var(--text)}
.packages .pkg-sub{font-size:14px;color:var(--muted);text-align:center;margin-bottom:24px}
.package-grid{display:grid;grid-template-columns:1fr;gap:22px;align-items:stretch}
.package-card{
  position:relative;padding:24px;border-radius:var(--radius);
  background:var(--surface);border:2px solid var(--border);
  cursor:pointer;transition:all .25s;display:flex;flex-direction:column;gap:10px;
  box-shadow:0 1px 3px rgba(15,23,42,.05);
}
.package-card:hover{border-color:rgba(37,99,235,.4);transform:translateY(-2px);box-shadow:0 8px 30px rgba(37,99,235,.1)}
.package-card.popular{border-color:var(--warning);background:rgba(251,191,36,.04);box-shadow:0 0 0 2px rgba(251,191,36,.3),0 0 24px rgba(251,191,36,.15)}
.package-badge{
  position:absolute;top:12px;right:12px;padding:4px 12px;border-radius:999px;
  font-size:11px;font-weight:800;color:#1a1200;background:var(--cta-gold-grad);box-shadow:0 2px 8px rgba(251,191,36,.3);
}
.pkg-mockup{position:relative;display:flex;align-items:center;justify-content:center;min-height:200px;border-radius:16px;background:radial-gradient(circle at 50% 40%,#ffffff 0%,#eef2f7 100%);overflow:hidden;margin:4px 0 8px}
.pkg-mockup--compact{min-height:96px}
.pkg-mockup-img{height:clamp(140px,38vw,180px);width:auto;max-width:100%;object-fit:contain;filter:drop-shadow(0 10px 16px rgba(15,23,42,0.22))}
.pkg-mockup--pair{overflow:visible}.pkg-mockup-pair-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:center;padding:14px 12px}.pkg-mockup-pair-grid .pkg-mockup-img{width:100%;height:auto;max-height:none;object-fit:contain;margin:0;position:static}
.pkg-mockup-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;align-items:center;justify-items:center;padding:12px}
.pkg-mockup-grid .pkg-mockup-img{height:clamp(84px,22vw,104px)}
.pkg-qty-pill{position:absolute;right:12px;bottom:12px;z-index:5;background:#1d4ed8;color:#fff;font-size:14px;font-weight:800;padding:4px 10px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
.package-card.has-badge{padding-top:44px}
.pkg-price{font-size:16px;font-weight:800;color:var(--text)}
.pkg-price-pending{font-size:13px;font-weight:600;color:var(--muted)}
.package-card .pkg-title{font-size:18px;font-weight:800;color:var(--text)}
.package-card .pkg-desc{font-size:14px;color:var(--muted);line-height:1.45}
.package-card .pkg-label{font-size:12px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.5px}
.package-card .pkg-cta{margin-top:8px;padding:14px;border-radius:10px;border:none;background:var(--cta-gold-grad);color:#1a1200;font-size:15px;font-weight:700;cursor:pointer;text-align:center;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 14px rgba(251,191,36,.25);text-decoration:none}
.package-card .pkg-cta:hover{opacity:.92;transform:translateY(-1px)}
.pkg-cta svg{width:16px;height:16px;stroke:#1a1200;stroke-width:2.5;fill:none}

/* Editorial Analysis */
.editorial{padding:32px 24px;background:var(--surface)}
.editorial-inner{max-width:720px;margin:0 auto}
.editorial h2{font-size:22px;font-weight:800;margin-bottom:4px;text-align:center;color:var(--text)}
.editorial .editorial-sub{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;text-align:center;margin-bottom:24px}
.editorial-grid{display:grid;grid-template-columns:1fr;gap:16px}
.editorial-col h3{font-size:16px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.editorial-pros h3{color:var(--success)}
.editorial-cons h3{color:var(--warning)}
.editorial-col ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.editorial-col li{display:flex;align-items:flex-start;gap:8px;font-size:14px;line-height:1.5;color:#334155}
.editorial-pros .marker{color:var(--success);font-weight:800;flex-shrink:0}
.editorial-cons .marker{color:var(--warning);font-weight:800;flex-shrink:0}

/* Comparison Table */
.comparison{padding:32px 24px;background:var(--surface2)}
.comparison-inner{max-width:720px;margin:0 auto}
.comparison h2{font-size:22px;font-weight:800;margin-bottom:20px;text-align:center;color:var(--text)}
.comparison-table{width:100%;border-collapse:collapse;font-size:14px}
.comparison-table th,.comparison-table td{padding:12px 14px;border:1px solid var(--border);text-align:left}
.comparison-table th{background:var(--surface);font-weight:700;color:var(--text);font-size:13px}
.comparison-table td{background:var(--surface);color:#334155;line-height:1.45}
.comparison-table .winner-product{color:var(--success);font-weight:700}
.comparison-table .winner-traditional{color:var(--warning);font-weight:700}
.comparison-table .winner-equal{color:var(--muted);font-weight:600}

/* Guarantee seal */
.guarantee{padding:32px 24px}
.guarantee-banner{
  display:flex;flex-direction:column;align-items:center;gap:20px;padding:32px 28px;border-radius:20px;
  background:linear-gradient(135deg,rgba(251,191,36,.10),rgba(245,158,11,.04));
  border:2px solid rgba(251,191,36,.4);
  box-shadow:0 6px 24px rgba(251,191,36,.08);
  max-width:560px;margin:0 auto;text-align:center;
}
@media(min-width:640px){.guarantee-banner{flex-direction:row;text-align:left;gap:24px}}
.guarantee-seal-wrap{position:relative;flex-shrink:0}
.guarantee-seal{
  width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#fbbf24,#f59e0b);
  box-shadow:0 8px 24px rgba(251,191,36,.35),inset 0 2px 8px rgba(255,255,255,.3);
  border:4px solid #fff;
}
.guarantee-seal svg{width:42px;height:42px;stroke:#fff;stroke-width:2.2;fill:none}
.guarantee-medal{
  position:absolute;bottom:-6px;right:-6px;
  background:#92400e;color:#fef3c7;font-size:10px;font-weight:800;
  padding:3px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:1px;
  display:flex;align-items:center;gap:3px;box-shadow:0 2px 8px rgba(0,0,0,.25);
  border:2px solid #fff;
}
.guarantee-medal svg{width:11px;height:11px;stroke:currentColor;stroke-width:2.4;fill:none}
.guarantee-content{display:flex;flex-direction:column;gap:6px}
.guarantee-title{font-size:19px;line-height:1.3;color:var(--text);font-weight:800;display:flex;align-items:center;gap:8px;justify-content:center}
@media(min-width:640px){.guarantee-title{justify-content:flex-start}}
.guarantee-desc{font-size:13px;line-height:1.6;color:#475569}
.guarantee-sub{font-size:12px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:2px}

/* Reviews */
.reviews{padding:32px 24px;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.reviews-inner{max-width:720px;margin:0 auto}
.reviews h2{font-size:22px;font-weight:700;margin-bottom:20px;text-align:center;color:var(--text)}
.reviews-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.rcard{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:10px}
.rcard-stars{font-size:15px;color:var(--star);letter-spacing:2px}
.rcard-text{font-size:13px;line-height:1.55;color:#334155;font-style:italic}
.rcard-author{display:flex;align-items:center;gap:10px;margin-top:auto}
.rcard-avatar{width:36px;height:36px;border-radius:50%;background:var(--accentGrad);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
.rcard-name{font-size:13px;font-weight:700;color:var(--text);line-height:1.2}
.rcard-location{font-size:11px;color:var(--muted);line-height:1.3}

/* Testimonials (legacy, kept for backward compat) */
.testimonials{padding:32px 24px;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.testimonials h2{font-size:22px;font-weight:700;margin-bottom:20px;text-align:center;color:var(--text)}
.testimonials-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.tcard{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:10px}
.tcard-stars{font-size:15px;color:var(--star);letter-spacing:2px}
.tcard-text{font-size:13px;line-height:1.55;color:#334155;font-style:italic}
.tcard-author{display:flex;align-items:center;gap:10px;margin-top:auto}
.tcard-avatar{width:36px;height:36px;border-radius:50%;background:var(--accentGrad);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
.tcard-name{font-size:13px;font-weight:700;color:var(--text);line-height:1.2}
.tcard-location{font-size:11px;color:var(--muted);line-height:1.3}

/* FAQ */
.faq{padding:32px 24px}
.faq-inner{max-width:760px;margin:0 auto}
.faq h2{font-size:22px;font-weight:700;margin-bottom:20px;text-align:center;color:var(--text)}
.faq-item{border-bottom:1px solid var(--border);overflow:hidden}
.faq-item:last-child{border-bottom:none}
.faq-q{display:flex;justify-content:space-between;align-items:center;padding:16px 0;cursor:pointer;font-size:15px;font-weight:600;color:var(--text);list-style:none}
.faq-q::-webkit-details-marker{display:none}
.faq-q::after{content:"+";font-size:22px;color:var(--accent);transition:transform .25s}
details[open] .faq-q::after{transform:rotate(45deg)}
.faq-a{padding:0 0 16px;font-size:14px;line-height:1.6;color:var(--muted)}

/* Decision checklist */
.decision-checklist{padding:32px 24px;background:var(--surface2);text-align:center}
.decision-checklist-inner{max-width:560px;margin:0 auto}
.decision-checklist h2{font-size:20px;font-weight:800;margin-bottom:20px;color:var(--text)}
.decision-list{list-style:none;display:flex;flex-direction:column;gap:14px;margin-bottom:28px;text-align:left}
.decision-list li{display:flex;align-items:flex-start;gap:10px;font-size:15px;line-height:1.5;color:#334155}
.decision-list .check{color:var(--success);flex-shrink:0;margin-top:1px}
.decision-list .check svg{width:22px;height:22px}

/* Final CTA */
.final-cta{padding:40px 24px;text-align:center}
.final-cta .product-name{font-size:22px;font-weight:800;margin-bottom:8px;color:var(--text)}
.final-cta .cta-wrap{margin-top:20px}

/* Mobile sticky CTA */
.mobile-sticky-cta{display:none}

/* Compliance footer */
.page-footer{padding:28px 24px;border-top:1px solid var(--border);background:#0f172a}
.footer-links{display:flex;justify-content:center;gap:20px;margin-bottom:16px;flex-wrap:wrap}
.footer-links a,.footer-links span{font-size:12px;color:#94a3b8;text-decoration:none;transition:color .2s}
.footer-links a:hover{color:#60a5fa}
.affiliate-footer{font-size:12px;line-height:1.4;color:#64748b;opacity:.75;max-width:440px;margin:0 auto 12px;text-align:center}
.disclaimer{font-size:11px;line-height:1.6;color:#64748b;max-width:440px;margin:0 auto;text-align:center}

section,.detail-card,.package-card,[id]{scroll-margin-top:72px}

/* Desktop >= 960px */
@media(min-width:960px){
  .hook{padding:48px 32px}
  .hook-inner{flex-direction:row;align-items:center;gap:40px}
  .hook-content{flex:1;text-align:left}
  .hook .sub{margin-left:0}
  .hook .hero-img{flex:1;max-width:520px}
  .hook .hero-img img{aspect-ratio:4/3;max-height:520px}
  .hook .cta-wrap .btn-primary{width:auto;min-width:280px}
  .package-grid{grid-template-columns:repeat(3,1fr)}
  .package-card.popular{transform:translateY(-8px)}
  .pkg-mockup{min-height:220px}
  .editorial-grid{grid-template-columns:1fr 1fr;gap:24px}
  .reviews-grid{grid-template-columns:repeat(3,1fr)}
  .testimonials-grid{grid-template-columns:repeat(3,1fr)}
}

/* Mobile <= 640px */
@media(max-width:640px){
  .page{max-width:100%}
  .hook h1{font-size:24px}
  .hook .sub{font-size:15px}
  .detail-grid{grid-template-columns:1fr}
  .reviews-grid{grid-template-columns:1fr}
  .testimonials-grid{grid-template-columns:1fr}
  .article-block h3{font-size:19px}
  .article-block p{font-size:15px}
  .as-seen-on img{height:18px}
  .top-bar-rating .rating-text{display:none}
  .top-bar-date{display:none}
  body{padding-bottom:96px}
  .mobile-sticky-cta{display:flex;position:sticky;bottom:0;left:0;right:0;z-index:60;padding:12px 16px;padding-bottom:calc(10px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid var(--border);box-shadow:0 -4px 12px rgba(15,23,42,.08)}
  .mobile-sticky-cta a{flex:1}
}
</style>
${tracking.headCode || ""}
</head>
<body>
<div class="page">
  <div class="top-bar">
    <span class="top-bar-label">${esc(data.topBarLabel)}</span>
    ${hasRating ? `<div class="top-bar-rating">
      <span class="stars">${"★".repeat(5).split("").map(() => '<svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>').join("")}</span>
      <span class="rating-text">${esc(data.rating || "")}/5</span>
    </div>` : "<div></div>"}
    <div class="top-bar-meta">
      <span class="top-bar-ad">${esc(adLabel)}</span>
      <span class="top-bar-date"><span id="d"></span></span>
    </div>
  </div>

  <header class="brand-header">
    <div class="brand-header-left">
    ${hasLogo ? `<img src="${escAttr(data.logoImage)}" alt="${escAttr(data.productName)}" title="${escAttr(data.productName)}" class="brand-logo" />` : `<span class="brand-name-fallback" title="${escAttr(data.productName)}">${esc(data.productName)}</span>`}
    </div>
    ${ctaLink(data, headerCtaText, "brand-header-cta")}
  </header>

  <div class="ad-notice">${esc(adNoticeText)}</div>

  ${hasMediaLogos ? `<div class="as-seen-on">
    <span class="as-seen-on-label">As Seen On</span>
    ${data.mediaLogos.map((src) => `<img src="${escAttr(src)}" alt="" loading="lazy" width="80" height="22" />`).join("")}
  </div>` : ""}

  <section class="hook section">
    <div class="hook-inner">
      <div class="hook-content">
        <h1>${esc(data.hookHeadline)}</h1>
        <p class="sub">${esc(data.hookSubheadline)}</p>
        <div class="cta-wrap">
          ${ctaLink(data, "Check Availability", "btn-primary")}
          <p class="urgency">${esc(data.urgencyText)}</p>
        </div>
      </div>
      ${hasHero ? `<div class="hero-img"><img src="${escAttr(heroImage)}" alt="${escAttr(data.productName)}" width="520" height="390" /></div>` : ""}
    </div>
  </section>

  ${hasArticleBlocks ? `<section class="article">
    <div class="article-inner">
    ${data.articleBlocks.map((block, idx) => `<div class="article-block">
      <h3>${esc(block.heading)}</h3>
      <p>${esc(block.body)}</p>
      ${hasPullQuote && idx === 1 ? `<div class="article-quote">${esc(data.pullQuote)}</div>` : ""}
    </div>`).join("")}
    </div>
  </section>` : ""}

  <section class="bullets-inline">
    <div class="bullets-inline-inner">
    <h2>Key takeaways</h2>
    <ul class="bullet-list">
      ${data.bullets.map((b) => `<li><span class="check">&#10003;</span><span>${esc(b)}</span></li>`).join("")}
    </ul>
    </div>
  </section>

  ${hasProductDetailCards ? `<section class="product-details">
    <h2>Product Details</h2>
    <div class="detail-grid">
      ${data.productDetailCards.map((c) => `<div class="detail-card">
        <div class="detail-card-icon">${renderIconSvg(c.icon)}</div>
        <div class="detail-card-title">${esc(c.title)}</div>
        <div class="detail-card-desc">${esc(c.description)}</div>
      </div>`).join("")}
    </div>
  </section>` : ""}

  ${hasIsForYou ? `<section class="is-for-you">
    <div class="is-for-you-inner">
    <h2>Is This For You?</h2>
    <ul class="is-for-you-list">
      ${data.isForYou.map((item) => `<li><span class="icon">${renderIconSvg("sparkles")}</span><span>${esc(item)}</span></li>`).join("")}
    </ul>
    ${ctaLink(data, "See If It's Right For You", "btn-primary")}
    </div>
  </section>` : ""}

  <section class="product-intro section">
    <h2>${esc(data.productName)}</h2>
    <p>${esc(data.productIntro)}</p>
    ${hasProductImage ? `<div class="product-gallery">
      <div class="product-main-img"><img src="${escAttr(data.productHeroImage || "")}" alt="${escAttr(data.productName)}" loading="lazy" width="480" height="400" /></div>
    </div>` : ""}
  </section>

  ${!hideBenefits ? `<section class="benefits">
    <div class="benefits-inner">
    <h2>What you get</h2>
    <ul class="benefit-list">
      ${data.benefits.map((b) => `<li><span class="check">&#10003;</span><span>${esc(b)}</span></li>`).join("")}
    </ul>
    </div>
  </section>` : ""}

  ${hasEditorial ? `<section class="editorial">
    <div class="editorial-inner">
    <h2>Editorial Assessment</h2>
    <p class="editorial-sub">Editorial Assessment</p>
    <div class="editorial-grid">
      <div class="editorial-col editorial-pros">
        <h3>Pros</h3>
        <ul>
          ${data.editorialAnalysis!.pros.map((p) => `<li><span class="marker">+</span><span>${esc(p)}</span></li>`).join("")}
        </ul>
      </div>
      <div class="editorial-col editorial-cons">
        <h3>Cons</h3>
        <ul>
          ${data.editorialAnalysis!.cons.map((c) => `<li><span class="marker">!</span><span>${esc(c)}</span></li>`).join("")}
        </ul>
      </div>
    </div>
    </div>
  </section>` : ""}

  ${hasComparison ? `<section class="comparison">
    <div class="comparison-inner">
    <h2>${esc(data.productName)} vs. ${esc(traditionalColLabel)}</h2>
    <table class="comparison-table">
      <thead>
        <tr><th>Criterion</th><th>${esc(data.productName)}</th><th>${esc(traditionalColLabel)}</th></tr>
      </thead>
      <tbody>
        ${data.comparisonRows.map((row) => `<tr>
          <td>${esc(row.criterion)}</td>
          <td class="winner-${row.winner === "product" ? "product" : "equal"}">${esc(row.product)}</td>
          <td class="winner-${row.winner === "traditional" ? "traditional" : "equal"}">${esc(row.traditional)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    </div>
  </section>` : ""}

  ${hasEveningScene ? `<section class="evening-scene">
    <div class="evening-scene-inner">
    <p>${esc(data.eveningScene)}</p>
    </div>
  </section>` : ""}

  <section class="packages section">
    <div class="packages-inner">
    <h2>Choose Your Package</h2>
    <p class="pkg-sub">Select the option that fits your goals and budget</p>
    <div class="package-grid">
      ${data.packages.map((pkg, i) => { const count = Math.max(1, extractNumber(pkg.title) || 1); const hasBadge = !!pkg.badge; return `<div class="package-card${pkg.popular ? " popular" : ""}${hasBadge ? " has-badge" : ""}" onclick="selectPackage(${i})">
        ${hasBadge ? `<div class="package-badge">${esc(pkg.badge)}</div>` : ""}
        ${renderPkgMockup(count, showPackageThumbs ? data.productHeroImage : null)}
        <div class="pkg-label">${esc(pkg.priceLabel)}</div>
        <div class="pkg-title">${esc(pkg.title)}</div>
        <div class="pkg-desc">${esc(pkg.description)}</div>
        ${pkg.price ? `<div class="pkg-price">${esc(pkg.price)}</div>` : `<div class="pkg-price pkg-price-pending">See price on official page</div>`}
        ${ctaLink(data, "Get Started", "pkg-cta")}
      </div>`; }).join("")}
    </div>
    </div>
  </section>

  ${hasGuarantee ? `<section class="guarantee section">
    <div class="guarantee-banner">
      <div class="guarantee-seal-wrap">
        <div class="guarantee-seal">
          <svg viewBox="0 0 24 24"><path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/><path d="M9 12l2 2 4-4"/></svg>
        </div>
        ${guaranteeDays ? `<div class="guarantee-medal">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></svg>
          ${esc(guaranteeDays)} DAYS
        </div>` : ""}
      </div>
      <div class="guarantee-content">
        <div class="guarantee-title">${esc(guaranteeTitle)}</div>
        <div class="guarantee-desc">${esc(data.guaranteeText)}</div>
      </div>
    </div>
  </section>` : ""}

  ${hasReviews ? `<section class="reviews">
    <div class="reviews-inner">
    <h2>What customers are saying</h2>
    <div class="reviews-grid">
      ${data.reviews.map((rv) => `<div class="rcard">
        ${rv.rating ? `<div class="rcard-stars">★★★★★</div>` : ""}
        <div class="rcard-text">"${esc(rv.text)}"</div>
        <div class="rcard-author">
          <div class="rcard-avatar">${esc(rv.author.slice(0, 1))}</div>
          <div>
            <div class="rcard-name">${esc(rv.author)}</div>
            ${rv.location ? `<div class="rcard-location">${esc(rv.location)}</div>` : ""}
          </div>
        </div>
      </div>`).join("")}
    </div>
    </div>
  </section>` : hasTestimonials ? `<section class="testimonials">
    <div class="reviews-inner">
    <h2>What others are saying</h2>
    <div class="testimonials-grid">
      ${data.testimonials.map((t) => `<div class="tcard">
        <div class="tcard-stars">★★★★★</div>
        <div class="tcard-text">"${esc(t.text)}"</div>
        <div class="tcard-author">
          <div class="tcard-avatar">${esc(t.name.slice(0, 1))}</div>
          <div>
            <div class="tcard-name">${esc(t.name)}</div>
            <div class="tcard-location">${esc(t.location)}</div>
          </div>
        </div>
      </div>`).join("")}
    </div>
    </div>
  </section>` : ""}

  ${hasFaq ? `<section class="faq section">
    <div class="faq-inner">
    <h2>Frequently asked questions</h2>
    ${data.faqItems.map((f) => `<details class="faq-item">
      <summary class="faq-q">${esc(f.question)}</summary>
      <div class="faq-a">${esc(f.answer)}</div>
    </details>`).join("")}
    </div>
  </section>` : ""}

  ${hasDecisionChecklist ? `<section class="decision-checklist">
    <div class="decision-checklist-inner">
    <h2>Before You Decide</h2>
    <ul class="decision-list">
      ${hasGuarantee ? `<li><span class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/><path d="M9 12l2 2 4-4"/></svg></span><span>Satisfaction guarantee${guaranteeDays ? ` (${esc(guaranteeDays)} days)` : ""} — check official terms</span></li>` : ""}
      <li><span class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h13v10H3z"/><path d="M16 10h4l1 2v5h-5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span><span>Official shipping and product support</span></li>
      <li><span class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg></span><span>Secure payment through the official store</span></li>
    </ul>
    ${ctaLink(data, "Claim Official Offer", "btn-gold")}
    </div>
  </section>` : ""}

  <section class="final-cta section">
    <div class="product-name">${esc(data.productName)}</div>
    <div class="cta-wrap">
      ${ctaLink(data, "Claim Official Offer", "btn-gold")}
    </div>
  </section>

  <footer class="page-footer">
    <div class="footer-links">
      ${data.footerLinks.privacy ? `<a href="${escAttr(data.footerLinks.privacy)}" rel="nofollow noopener" target="_blank">Privacy Policy</a>` : "<span>Privacy Policy</span>"}
      ${data.footerLinks.terms ? `<a href="${escAttr(data.footerLinks.terms)}" rel="nofollow noopener" target="_blank">Terms of Service</a>` : "<span>Terms of Service</span>"}
      ${data.footerLinks.contact ? `<a href="${escAttr(data.footerLinks.contact)}" rel="nofollow noopener" target="_blank">Contact</a>` : "<span>Contact</span>"}
    </div>
    <p class="affiliate-footer">${esc(affiliateFooterText)}</p>
    <p class="disclaimer">${esc(data.disclaimer)}</p>
  </footer>
</div>
<div class="mobile-sticky-cta">${ctaLink(data, headerCtaText, "btn-primary")}</div>
<script>
var DATA = ${configJson};
var TRACKING = ${trackingJson};
function trackEvent(eventName) {
  if (TRACKING.bodyCode && window.fbq) { try { window.fbq("trackCustom", eventName); } catch(e){} }
  if (TRACKING.bodyCode && window.gtag) { try { window.gtag("event", eventName); } catch(e){} }
  if (window.dataLayer) { try { window.dataLayer.push({ event: eventName }); } catch(e){} }
}
function goToOffer(event) {
  if (event) { try { event.stopPropagation(); } catch(e){} }
  trackEvent("sales_cta_click");
}
function selectPackage(idx) {
  trackEvent("sales_package_" + (idx + 1));
}
trackEvent("sales_page_view");
(function(){
  var d=document.getElementById("d");
  if(d){d.textContent=new Date().toLocaleDateString(${JSON.stringify(dateLocale)},{month:"long",day:"numeric",year:"numeric"});}
})();
</script>
${tracking.bodyCode || ""}
</body>
</html>`;
}
