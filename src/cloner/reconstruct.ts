import { escapeAttr, escapeHtml } from "./escape";
import { parseCloneDocument, serializeCloneDocument } from "./document";
import { injectCustomFeatures } from "./rewrite";
import type { CloneContext } from "./types";
import type { AiKit, AiComparison, AiFaqItem, AiReview } from "@/services/aiAnalyzer";

function ensureAbsoluteUrl(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

function todayISO(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ProductUnit {
  singular: string;
  plural: string;
}

/**
 * Detects the product's unit-of-sale nomenclature from the page title or headline.
 * Returns { singular, plural } suitable for kit card labels (e.g. "1 Bottle", "3 Bottles").
 */
export function detectProductUnit(title: string, headline: string): ProductUnit {
  const text = `${title} ${headline}`.toLowerCase();

  if (/\bpillow|cushion|device|gadget|patch|massager|appliance|machine|tool|gadget\b/.test(text)) {
    return { singular: "Item", plural: "Items" };
  }
  if (/\bcream|serum|gel|lotion|balm|shampoo|ointment|spray\b/.test(text)) {
    return { singular: "Tube", plural: "Tubes" };
  }
  if (/\bbottle|capsule|pill|supplement|gummy|softgel|tablet|drops\b/.test(text)) {
    return { singular: "Bottle", plural: "Bottles" };
  }
  return { singular: "Unit", plural: "Units" };
}

interface OfferKit {
  label: string;
  qty: number;
  perUnit: string;
  total: string;
  badge?: string;
  highlight?: boolean;
  imgSrc?: string;
}

function defaultKits(): OfferKit[] {
  return [
    { label: "Trial Kit", qty: 1, perUnit: "$59", total: "$59" },
    {
      label: "Popular Kit",
      qty: 3,
      perUnit: "$49",
      total: "$147",
      badge: "MOST POPULAR",
      highlight: true,
    },
    {
      label: "Best Value Kit",
      qty: 6,
      perUnit: "$39",
      total: "$234",
      badge: "BEST VALUE",
    },
  ];
}

function ctaButton(text: string, href: string): string {
  const safe = escapeAttr(ensureAbsoluteUrl(href));
  return `<a href="${safe}" target="_blank" rel="noopener noreferrer" data-affiliate-cta="true" class="pc-recon-cta">${escapeHtml(text)}</a>`;
}

function kitCard(kit: OfferKit, unit: ProductUnit, ctaText: string, ctaHref: string): string {
  const highlightCls = kit.highlight ? " pc-recon-card--highlight" : "";
  const badge = kit.badge
    ? `<span class="pc-recon-badge">${escapeHtml(kit.badge)}</span>`
    : "";
  const img = kit.imgSrc
    ? `<img src="${escapeAttr(kit.imgSrc)}" alt="${escapeAttr(kit.label)}" loading="lazy" class="pc-recon-card-img" />`
    : "";
  const unitLabel = kit.qty === 1 ? unit.singular : unit.plural;
  const perLabel = `per ${unit.singular.toLowerCase()}`;
  return `<div class="pc-recon-card${highlightCls}">
    ${badge}
    ${img}
    <div class="pc-recon-card-qty">${kit.qty} ${unitLabel}</div>
    <div class="pc-recon-card-label">${escapeHtml(kit.label)}</div>
    <div class="pc-recon-card-price">
      <span class="pc-recon-card-per">${escapeHtml(kit.perUnit)}</span>
      <span class="pc-recon-card-per-label">${perLabel}</span>
    </div>
    <div class="pc-recon-card-total">Total: ${escapeHtml(kit.total)}</div>
    ${ctaButton(ctaText, ctaHref)}
    <div class="pc-recon-card-trust">One-time payment. No hidden recurring charges.</div>
    <div class="pc-recon-card-payicons">
      <span>VISA</span><span>Mastercard</span><span>Amex</span><span>PayPal</span><span>SSL Secure</span>
    </div>
  </div>`;
}

function uniqueMechanismSection(mechanism: string): string {
  if (!mechanism) return "";
  return `<section class="pc-recon-section" id="mechanism">
    <h2 class="pc-recon-section-title">The Science Behind It</h2>
    <div class="pc-recon-mechanism-card">
      <div class="pc-recon-mechanism-icon">\u269B\uFE0F</div>
      <p>${escapeHtml(mechanism)}</p>
    </div>
  </section>`;
}

function comparisonSection(comparison: AiComparison): string {
  if (!comparison.us.length && !comparison.them.length) return "";
  const maxRows = Math.max(comparison.us.length, comparison.them.length);
  const rows: string[] = [];
  for (let i = 0; i < maxRows; i++) {
    const usPoint = comparison.us[i] || "";
    const themPoint = comparison.them[i] || "";
    rows.push(`<tr>
      <td class="pc-recon-comp-us"><span class="pc-recon-comp-check">\u2713</span> ${escapeHtml(usPoint)}</td>
      <td class="pc-recon-comp-them"><span class="pc-recon-comp-x">\u2715</span> ${escapeHtml(themPoint)}</td>
    </tr>`);
  }
  return `<section class="pc-recon-section" id="comparison">
    <h2 class="pc-recon-section-title">Why Choose Us Over the Rest</h2>
    <div class="pc-recon-comp-wrap">
      <table class="pc-recon-comp-table">
        <thead>
          <tr>
            <th class="pc-recon-comp-us-head">This Product</th>
            <th class="pc-recon-comp-them-head">Other Alternatives</th>
          </tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
  </section>`;
}

function faqSection(faq: AiFaqItem[]): string {
  if (!faq.length) return "";
  const items = faq
    .map(
      (f, i) =>
        `<details class="pc-recon-faq-item"${i === 0 ? " open" : ""}>
          <summary class="pc-recon-faq-q">${escapeHtml(f.q)}</summary>
          <p class="pc-recon-faq-a">${escapeHtml(f.a)}</p>
        </details>`,
    )
    .join("");
  return `<section class="pc-recon-section" id="faq">
    <h2 class="pc-recon-section-title">Frequently Asked Questions</h2>
    <div class="pc-recon-faq">${items}</div>
  </section>`;
}

function urgencyBadge(text: string): string {
  if (!text) return "";
  return `<div class="pc-recon-urgency">
    <span class="pc-recon-urgency-dot"></span>
    <span class="pc-recon-urgency-text">${escapeHtml(text)}</span>
  </div>`;
}

function benefitsSection(benefits: string[]): string {
  if (!benefits.length) return "";
  const cards = benefits
    .map(
      (b) =>
        `<div class="pc-recon-benefit"><span class="pc-recon-benefit-check">✓</span><span>${escapeHtml(b)}</span></div>`,
    )
    .join("");
  return `<section class="pc-recon-section" id="benefits">
    <h2 class="pc-recon-section-title">Why You'll Love It</h2>
    <div class="pc-recon-benefits-grid">${cards}</div>
  </section>`;
}

function gallerySection(images: { src: string; alt: string }[]): string {
  if (images.length < 2) return "";
  const imgs = images
    .map(
      (g) =>
        `<div class="pc-recon-gallery-item"><img src="${escapeAttr(g.src)}" alt="${escapeAttr(g.alt)}" loading="lazy" /></div>`,
    )
    .join("");
  return `<section class="pc-recon-section" id="gallery">
    <h2 class="pc-recon-section-title">Product Details</h2>
    <div class="pc-recon-gallery">${imgs}</div>
  </section>`;
}

function renderStars(rating: number): string {
  const full = Math.round(rating);
  let stars = "";
  for (let i = 0; i < 5; i++) {
    stars += i < full ? "\u2605" : "\u2606";
  }
  return stars;
}

function socialProofSection(reviews: AiReview[], fallbackTestimonials: string[]): string {
  if (!reviews.length && !fallbackTestimonials.length) return "";

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "4.9";
  const totalReviews = reviews.length || fallbackTestimonials.length;

  let cards = "";
  if (reviews.length) {
    cards = reviews
      .map(
        (rv) =>
          `<div class="pc-recon-review-card">
            <div class="pc-recon-review-top">
              <span class="pc-recon-review-stars">${renderStars(rv.rating)}</span>
              <span class="pc-recon-review-verified">\u2713 Verified Buyer</span>
            </div>
            ${rv.title ? `<div class="pc-recon-review-title">${escapeHtml(rv.title)}</div>` : ""}
            <p class="pc-recon-review-text">${escapeHtml(rv.text)}</p>
            <div class="pc-recon-review-author">
              <span class="pc-recon-review-name">${escapeHtml(rv.author)}</span>
              <span class="pc-recon-review-loc">${escapeHtml(rv.location)}</span>
            </div>
          </div>`,
      )
      .join("");
  } else {
    cards = fallbackTestimonials
      .map(
        (t) =>
          `<div class="pc-recon-review-card">
            <div class="pc-recon-review-top">
              <span class="pc-recon-review-stars">${renderStars(5)}</span>
              <span class="pc-recon-review-verified">\u2713 Verified Buyer</span>
            </div>
            <p class="pc-recon-review-text">${escapeHtml(t)}</p>
            <div class="pc-recon-review-author">
              <span class="pc-recon-review-name">Verified Customer</span>
              <span class="pc-recon-review-loc">Verified Customer</span>
            </div>
          </div>`,
      )
      .join("");
  }

  return `<section class="pc-recon-section" id="reviews">
    <h2 class="pc-recon-section-title">What Customers Are Saying</h2>
    <div class="pc-recon-reviews-header">
      <span class="pc-recon-reviews-bigstars">${renderStars(5)}</span>
      <span class="pc-recon-reviews-rating">${escapeHtml(avgRating)}/5</span>
      <span class="pc-recon-reviews-count">Based on ${totalReviews}+ reviews</span>
    </div>
    <div class="pc-recon-reviews-grid">${cards}</div>
  </section>`;
}

function reconstructStyles(): string {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#FFFFFF;color:#0F172A;line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto;display:block}
.pc-recon-wrap{max-width:1024px;margin:0 auto;padding:0 16px}
/* Compliance banner */
.pc-recon-banner{background:#F8FAFC;border-bottom:1px solid #E2E8F0;padding:8px 16px;text-align:center}
.pc-recon-banner span{font-size:11px;font-weight:600;letter-spacing:.08em;color:#64748B;text-transform:uppercase}
.pc-recon-banner time{font-weight:400;color:#94A3B8;margin-left:8px}
/* Hero */
.pc-recon-hero{display:flex;flex-direction:column;align-items:center;gap:24px;padding:48px 0 32px;text-align:center}
.pc-recon-hero h1{font-size:clamp(1.75rem,5vw,2.75rem);font-weight:800;line-height:1.2;letter-spacing:-.02em;max-width:720px}
.pc-recon-hero h1 mark{background:linear-gradient(transparent 55%,#FEF08A 55%);padding:0 2px;border-radius:2px;color:#0F172A}
.pc-recon-hero p{font-size:clamp(1rem,2.5vw,1.2rem);color:#475569;max-width:560px}
.pc-recon-hero-media{width:100%;max-width:560px;border-radius:16px;overflow:hidden;background:#F8FAFC}
.pc-recon-hero-media img,.pc-recon-hero-media iframe,.pc-recon-hero-media video{width:100%;border-radius:16px}
.pc-recon-hero-media iframe{aspect-ratio:16/9;border:0}
/* Generic section */
.pc-recon-section{padding:32px 0;border-top:1px solid #F1F5F9}
.pc-recon-section-title{font-size:clamp(1.3rem,3vw,1.75rem);font-weight:700;text-align:center;margin-bottom:24px}
/* Benefits */
.pc-recon-benefits-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:800px;margin:0 auto}
@media(min-width:640px){.pc-recon-benefits-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.pc-recon-benefits-grid{grid-template-columns:repeat(3,1fr)}}
.pc-recon-benefit{display:flex;align-items:flex-start;gap:10px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:16px 18px;font-size:.9375rem;color:#334155}
.pc-recon-benefit-check{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:#16A34A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;line-height:1}
/* Gallery */
.pc-recon-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;max-width:800px;margin:0 auto}
@media(min-width:640px){.pc-recon-gallery{grid-template-columns:repeat(3,1fr)}}
.pc-recon-gallery-item{border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;background:#F8FAFC}
.pc-recon-gallery-item img{aspect-ratio:1;object-fit:cover}
/* Social proof / Reviews */
.pc-recon-reviews-header{display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:28px}
.pc-recon-reviews-bigstars{font-size:1.75rem;color:#F59E0B;letter-spacing:2px}
.pc-recon-reviews-rating{font-size:1.5rem;font-weight:800;color:#0F172A}
.pc-recon-reviews-count{font-size:.875rem;color:#64748B}
.pc-recon-reviews-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:880px;margin:0 auto}
@media(min-width:640px){.pc-recon-reviews-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.pc-recon-reviews-grid{grid-template-columns:repeat(3,1fr)}}
.pc-recon-review-card{background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:20px 22px;display:flex;flex-direction:column;gap:10px;transition:box-shadow .2s,border-color .2s}
.pc-recon-review-card:hover{border-color:#BBF7D0;box-shadow:0 4px 20px rgba(0,0,0,.05)}
.pc-recon-review-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.pc-recon-review-stars{color:#F59E0B;font-size:1rem;letter-spacing:1px}
.pc-recon-review-verified{display:inline-flex;align-items:center;gap:4px;font-size:.75rem;font-weight:600;color:#16A34A;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:999px;padding:3px 10px}
.pc-recon-review-title{font-size:.9375rem;font-weight:700;color:#0F172A}
.pc-recon-review-text{font-size:.875rem;color:#475569;line-height:1.7;flex:1}
.pc-recon-review-author{display:flex;flex-direction:column;gap:2px;padding-top:8px;border-top:1px solid #F1F5F9}
.pc-recon-review-name{font-size:.8125rem;font-weight:700;color:#0F172A}
.pc-recon-review-loc{font-size:.75rem;color:#94A3B8}
/* Unique mechanism */
.pc-recon-mechanism-card{display:flex;align-items:flex-start;gap:16px;background:linear-gradient(135deg,#F0FDF4,#ECFEFF);border:1px solid #BBF7D0;border-radius:16px;padding:24px 28px;max-width:800px;margin:0 auto}
.pc-recon-mechanism-icon{flex-shrink:0;font-size:2rem;line-height:1.2}
.pc-recon-mechanism-card p{font-size:1rem;color:#334155;line-height:1.7}
/* Comparison table */
.pc-recon-comp-wrap{max-width:800px;margin:0 auto;overflow-x:auto}
.pc-recon-comp-table{width:100%;border-collapse:separate;border-spacing:0;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0}
.pc-recon-comp-table th{padding:16px 20px;font-size:.875rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;text-align:left}
.pc-recon-comp-us-head{background:#16A34A;color:#fff}
.pc-recon-comp-them-head{background:#FEE2E2;color:#B91C1C}
.pc-recon-comp-table td{padding:14px 20px;font-size:.9375rem;border-top:1px solid #F1F5F9;vertical-align:top}
.pc-recon-comp-us{background:#F0FDF4;color:#334155}
.pc-recon-comp-them{background:#FEF2F2;color:#64748B}
.pc-recon-comp-check{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#16A34A;color:#fff;font-size:12px;font-weight:700;margin-right:8px;flex-shrink:0}
.pc-recon-comp-x{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#DC2626;color:#fff;font-size:12px;font-weight:700;margin-right:8px;flex-shrink:0}
/* FAQ */
.pc-recon-faq{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.pc-recon-faq-item{background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;transition:border-color .2s}
.pc-recon-faq-item[open]{border-color:#16A34A}
.pc-recon-faq-q{padding:16px 20px;font-size:1rem;font-weight:600;color:#0F172A;cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between}
.pc-recon-faq-q::-webkit-details-marker{display:none}
.pc-recon-faq-q::after{content:"+";font-size:1.25rem;color:#16A34A;font-weight:700;transition:transform .2s}
.pc-recon-faq-item[open] .pc-recon-faq-q::after{transform:rotate(45deg)}
.pc-recon-faq-a{padding:0 20px 16px;font-size:.9375rem;color:#475569;line-height:1.7}
/* Urgency badge */
.pc-recon-urgency{display:flex;align-items:center;justify-content:center;gap:10px;max-width:800px;margin:0 auto 28px;background:linear-gradient(135deg,#FEF3C7,#FEE2E2);border:1px solid #FCD34D;border-radius:12px;padding:12px 20px}
.pc-recon-urgency-dot{flex-shrink:0;width:10px;height:10px;border-radius:50%;background:#DC2626;animation:pc-recon-blink 1.5s ease-in-out infinite}
@keyframes pc-recon-blink{0%,100%{opacity:1}50%{opacity:.3}}
.pc-recon-urgency-text{font-size:.875rem;font-weight:600;color:#92400E}
/* Offer grid */
.pc-recon-offers{padding:32px 0;border-top:1px solid #F1F5F9}
.pc-recon-offers h2{font-size:clamp(1.3rem,3vw,1.75rem);font-weight:700;text-align:center;margin-bottom:28px}
.pc-recon-offers-grid{display:grid;grid-template-columns:1fr;gap:20px;max-width:880px;margin:0 auto}
@media(min-width:768px){.pc-recon-offers-grid{grid-template-columns:repeat(3,1fr);align-items:start}}
.pc-recon-card{background:#FFFFFF;border:2px solid #E2E8F0;border-radius:16px;padding:28px 20px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;position:relative;transition:border-color .2s,box-shadow .2s}
.pc-recon-card:hover{border-color:#CBD5E1;box-shadow:0 8px 30px rgba(0,0,0,.06)}
.pc-recon-card--highlight{border-color:#16A34A;box-shadow:0 8px 30px rgba(22,163,74,.12)}
.pc-recon-card--highlight:hover{border-color:#16A34A;box-shadow:0 12px 40px rgba(22,163,74,.18)}
.pc-recon-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#16A34A;color:#fff;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 14px;border-radius:999px;white-space:nowrap}
.pc-recon-card-img{max-height:160px;object-fit:contain;margin:8px 0}
.pc-recon-card-qty{font-size:1.5rem;font-weight:800;color:#0F172A}
.pc-recon-card-label{font-size:.875rem;color:#64748B;text-transform:uppercase;letter-spacing:.05em}
.pc-recon-card-price{display:flex;align-items:baseline;gap:6px}
.pc-recon-card-per{font-size:2rem;font-weight:800;color:#16A34A}
.pc-recon-card-per-label{font-size:.75rem;color:#94A3B8}
.pc-recon-card-total{font-size:.875rem;color:#475569}
/* CTA button */
.pc-recon-cta{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:16px 24px;margin-top:12px;background:#16A34A;color:#fff;font-size:1.125rem;font-weight:700;text-decoration:none;border-radius:12px;border-bottom:4px solid #15803D;box-shadow:0 8px 24px rgba(22,163,74,.3);transition:transform .15s,box-shadow .3s;animation:pc-recon-pulse 2s ease-in-out infinite;cursor:pointer;text-align:center}
.pc-recon-cta:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(22,163,74,.45)}
.pc-recon-cta:active{transform:translateY(0)}
@keyframes pc-recon-pulse{0%,100%{box-shadow:0 8px 24px rgba(22,163,74,.3)}50%{box-shadow:0 8px 36px rgba(22,163,74,.55)}}
.pc-recon-card-trust{font-size:11px;color:#94A3B8;margin-top:8px}
.pc-recon-card-payicons{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:6px}
.pc-recon-card-payicons span{font-size:10px;font-weight:600;color:#94A3B8;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:4px;padding:2px 6px}
/* Guarantee */
.pc-recon-guarantee{display:flex;justify-content:center;padding:32px 0;border-top:1px solid #F1F5F9}
.pc-recon-guarantee-card{background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;padding:28px 32px;text-align:center;max-width:480px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
.pc-recon-guarantee-badge{position:relative;width:80px;height:80px;margin:0 auto 14px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.pc-recon-guarantee-badge svg{position:absolute;top:0;left:0;width:80px;height:80px}
.pc-recon-guarantee-num{font-size:1.5rem;font-weight:800;color:#16A34A;line-height:1;margin-top:4px;z-index:1}
.pc-recon-guarantee-label{font-size:.625rem;font-weight:700;letter-spacing:.1em;color:#16A34A;z-index:1}
.pc-recon-guarantee-card h3{font-size:1.1rem;font-weight:700;color:#0F172A;margin-bottom:6px}
.pc-recon-guarantee-card p{font-size:.875rem;color:#334155}
.pc-recon-guarantee-seals{display:flex;justify-content:center;flex-wrap:wrap;gap:12px 20px;margin-top:18px;padding-top:16px;border-top:1px solid #E2E8F0}
.pc-recon-guarantee-seal{font-size:.75rem;font-weight:600;color:#15803D}
/* Footer */
.pc-recon-footer{border-top:1px solid #E2E8F0;padding:32px 0 40px;text-align:center;background:#F8FAFC}
.pc-recon-footer-links{display:flex;justify-content:center;flex-wrap:wrap;gap:20px;margin-bottom:12px}
.pc-recon-footer-links a{font-size:13px;color:#64748B;text-decoration:none}
.pc-recon-footer-links a:hover{color:#0F172A}
.pc-recon-footer-copy{font-size:11px;color:#94A3B8}
`;
}

export function buildReconstructedHtml(ctx: CloneContext): string {
  const { title, headline, subheadline, ctaText, ctaHref, page } = ctx;
  const safeHref = ensureAbsoluteUrl(ctaHref);
  const ai = ctx.aiAnalysis;

  const unit: ProductUnit = ai
    ? { singular: ai.unitSingular, plural: ai.unitPlural }
    : detectProductUnit(title, headline);

  const heroImg = ai?.primaryProductImage
    ? { src: ai.primaryProductImage, alt: ai?.productName || headline }
    : page.images[0];
  const heroVideo = page.videos[0];
  const galleryImgs = ai?.secondaryImages?.length
    ? ai.secondaryImages.map((src) => ({ src, alt: "" }))
    : page.images.slice(1, 7);
  const benefits = ai?.benefits?.length ? ai.benefits.slice(0, 9) : page.benefits.slice(0, 9);
  const fallbackTestimonials = page.testimonials.slice(0, 6);
  const reviews = ai?.reviews || [];
  const uniqueMechanism = ai?.uniqueMechanism || "";
  const comparison = ai?.comparison || { us: [], them: [] };
  const faq = ai?.faq || [];
  const urgencyText = ai?.urgencyText || "";

  let heroMedia = "";
  if (heroVideo) {
    const yt = heroVideo.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
    if (yt) {
      heroMedia = `<div class="pc-recon-hero-media"><iframe src="https://www.youtube-nocookie.com/embed/${escapeAttr(yt[1])}" title="Video" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    } else {
      heroMedia = `<div class="pc-recon-hero-media"><iframe src="${escapeAttr(heroVideo)}" title="Video" allow="autoplay;fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
    }
  } else if (heroImg) {
    heroMedia = `<div class="pc-recon-hero-media"><img src="${escapeAttr(heroImg.src)}" alt="${escapeAttr(heroImg.alt || headline)}" loading="eager" /></div>`;
  }

  const kits: OfferKit[] = ai?.kits?.length
    ? ai.kits.map((k: AiKit) => ({
        label: k.label,
        qty: k.qty,
        perUnit: k.perUnit,
        total: k.total,
        badge: k.badge,
        highlight: k.highlight,
      }))
    : defaultKits();
  const kitImgs = galleryImgs.slice(0, 3);
  kits.forEach((k, i) => {
    if (kitImgs[i]) k.imgSrc = kitImgs[i].src;
  });

  const offerGrid = kits.map((k) => kitCard(k, unit, ctaText, safeHref)).join("");

  const rawGuaranteeDays = ai?.guaranteeDays || page.guaranteeDays || "";
  const daysNum = rawGuaranteeDays.replace(/\D/g, "") || "100";
  const isNumericDays = /^\d+$/.test(rawGuaranteeDays);
  const guaranteeTitle = isNumericDays
    ? `${daysNum}-Day Money-Back Guarantee`
    : "100% Risk-Free Guarantee";
  const guaranteeDesc = isNumericDays
    ? `Try it risk-free. If you are not completely satisfied within ${daysNum} days, contact us for a full refund — no questions asked.`
    : "Try it risk-free. If you are not completely satisfied, contact us for a full refund — no questions asked.";

  const body = `
  <div class="pc-recon-banner">
    <span>ADVERTISEMENT / PRODUCT DISCOVERY</span>
    <time>${todayISO()}</time>
  </div>
  <div class="pc-recon-wrap">
    <section class="pc-recon-hero">
      <h1>${escapeHtml(headline)}</h1>
      ${subheadline ? `<p>${escapeHtml(subheadline)}</p>` : ""}
      ${heroMedia}
    </section>
    ${benefitsSection(benefits)}
    ${uniqueMechanismSection(uniqueMechanism)}
    ${comparisonSection(comparison)}
    ${gallerySection(galleryImgs)}
    ${urgencyBadge(urgencyText)}
    <section class="pc-recon-offers" id="offers">
      <h2>Choose Your Package</h2>
      <div class="pc-recon-offers-grid">
        ${offerGrid}
      </div>
    </section>
    ${socialProofSection(reviews, fallbackTestimonials)}
    ${faqSection(faq)}
    <section class="pc-recon-guarantee">
      <div class="pc-recon-guarantee-card">
        <div class="pc-recon-guarantee-badge">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span class="pc-recon-guarantee-num">${escapeHtml(daysNum)}</span>
          <span class="pc-recon-guarantee-label">DAYS</span>
        </div>
        <h3>${escapeHtml(guaranteeTitle)}</h3>
        <p>${escapeHtml(guaranteeDesc)}</p>
        <div class="pc-recon-guarantee-seals" aria-label="Purchase protections">
          <span class="pc-recon-guarantee-seal">✓ 100% Risk-Free Purchase</span>
          <span class="pc-recon-guarantee-seal">✓ Instant Support &amp; Returns</span>
        </div>
      </div>
    </section>
  </div>
  <footer class="pc-recon-footer">
    <div class="pc-recon-wrap">
      <div class="pc-recon-footer-links">
        <a href="#">Terms of Service</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Contact Us</a>
      </div>
      <div class="pc-recon-footer-copy">&copy; ${new Date().getFullYear()} ${escapeHtml(title)}. All rights reserved.</div>
    </div>
  </footer>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<base href="${escapeAttr(page.url)}" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(subheadline || headline)}" />
<style>${reconstructStyles()}</style>
</head>
<body data-clone-mode="reconstruct" data-pageclone-source-url="${escapeAttr(page.url)}">
${body}
</body>
</html>`;
  const doc = parseCloneDocument(html);
  injectCustomFeatures(doc, ctx);
  return serializeCloneDocument(doc);
}
