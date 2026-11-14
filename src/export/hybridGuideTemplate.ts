import type { HybridGuideData, HybridImage, HybridStageId, ThemeConfig, HybridTracking } from "@/types/hybridGuide";
import { getHybridStrings } from "@/config/hybridOptions";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function safeHref(url: string): string {
  return /^https?:\/\//i.test(url) ? esc(url) : "#";
}

function safeRemoteImageSrc(url: string): string {
  return /^(https?:\/\/|data:image\/)/i.test(url) ? esc(url) : "";
}

function imageTag(image: HybridImage, assetPath?: string): string {
  const src = assetPath ?? (image.url ? safeRemoteImageSrc(image.url) : "");
  return src ? `<img class="media" src="${src}" alt="${esc(image.alt)}">` : "";
}

function slide(body: string): string {
  return `<section class="screen" data-slide hidden>${body}</section>`;
}

function nextButton(label: string): string {
  return `<button class="btn" type="button" data-next>${esc(label)}</button>`;
}

function stageSlides(guide: HybridGuideData, stage: HybridStageId, assetMap: Map<string, string>): string[] {
  const t = getHybridStrings(guide.project.language);
  const resolve = (image: HybridImage) => {
    if (image.url && assetMap.has(image.url)) return imageTag(image, assetMap.get(image.url));
    return imageTag(image);
  };

  switch (stage) {
    case "cover":
      return [
        slide(
          `${resolve(guide.cover.mainImage)}<h1>${esc(guide.cover.headline)}</h1><p class="muted">${esc(guide.cover.subheadline)}</p>${nextButton(guide.cover.buttonText || t.continue)}`,
        ),
      ];
    case "educational":
      return guide.educationalCards.map((card) =>
        slide(
          `${resolve(card.image)}<div class="card"><h2>${esc(card.title)}</h2><p class="muted">${esc(card.body)}</p>${
            card.practicalExample
              ? `<p class="example"><span class="label">${esc(t.practicalExample)}</span>${esc(card.practicalExample)}</p>`
              : ""
          }</div>${nextButton(t.next)}`,
        ),
      );
    case "quiz":
      return guide.quiz.map((question, index) => {
        const options = question.options
          .map(
            (option) =>
              `<button class="option" type="button" data-question="${index}" data-answer="${esc(option.label)}">${esc(option.label)}</button>`,
          )
          .join("");
        const progress = question.progressLabel || t.questionOf(index + 1, guide.quiz.length);
        return slide(`<p class="muted small">${esc(progress)}</p><h2>${esc(question.question)}</h2><div class="options">${options}</div>`);
      });
    case "transition":
      return [
        slide(
          `<h2>${esc(guide.transition.title)}</h2><p class="muted">${esc(guide.transition.body)}</p><div class="summary" data-summary></div>${nextButton(t.continue)}`,
        ),
      ];
    case "preOffer":
      return guide.preOffer.map((card) =>
        slide(`${resolve(card.image)}<h2>${esc(card.title)}</h2><p class="muted">${esc(card.transitionContent)}</p>${nextButton(t.continue)}`),
      );
    case "solution": {
      const { solution } = guide;
      const benefits = solution.realBenefits.map((item) => `<li>${esc(item)}</li>`).join("");
      const differentials = solution.confirmedDifferentials.map((item) => `<p>${esc(item)}</p>`).join("");
      return [
        slide(
          `<h2>${esc(solution.productName || t.yourSolution)}</h2><ul class="benefits">${benefits}</ul>${
            differentials ? `<div class="card"><span class="label">${esc(t.keyFeatures)}</span>${differentials}</div>` : ""
          }${nextButton(t.continue)}`,
        ),
      ];
    }
    case "finalCta": {
      const href = safeHref(guide.project.affiliateUrl || guide.project.ctaUrl);
      const productImg = resolve(guide.finalCta.productImage);
      const button =
        href === "#"
          ? `<p class="notice">${esc(t.noCtaLink)}</p>`
          : `<a class="btn" href="${href}" target="_blank" rel="noopener noreferrer" data-cta>${esc(guide.finalCta.buttonText || t.wantToKnow)}</a>`;
      return [
        slide(
          `<p class="cta-text">${esc(guide.finalCta.transitionText)}</p>${button}${productImg}<footer class="card-footer"><p class="muted small">${esc(t.informationNotice)}</p><button class="link" type="button" data-restart>${esc(t.restartGuide)}</button></footer>`,
        ),
      ];
    }
  }
}

function styles(theme: ThemeConfig): string {
  const { colors, fonts, radius, shadow } = theme;
  return `:root{
--bg:${colors.background};--surface:${colors.surface};--primary:${colors.primary};--primary-text:${colors.primaryText};
--accent:${colors.accent};--text:${colors.text};--muted:${colors.textMuted};--border:${colors.border};
--font-heading:${fonts.heading};--font-body:${fonts.body};--radius:${radius};--shadow:${shadow};
}
*{box-sizing:border-box}
[hidden]{display:none!important}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg);color:var(--text);font-family:var(--font-body);}
.frame{width:100%;max-width:960px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden;}
.bar{height:4px;background:var(--border)}
.bar-fill{height:100%;width:0;background:var(--primary);transition:width .4s ease}
.screen{padding:24px;min-height:460px;display:flex;flex-direction:column;gap:16px;animation:fade .35s ease}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
h1,h2{font-family:var(--font-heading);color:var(--text);line-height:1.2;margin:0}
h1{font-size:28px}
h2{font-size:22px}
p{margin:0;line-height:1.5}
.muted{color:var(--muted)}
.small{font-size:12px}
.media{width:100%;height:180px;object-fit:cover;border-radius:var(--radius)}
.card{padding:16px;display:flex;flex-direction:column;gap:12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg)}
.label{display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--primary);margin-bottom:6px}
.example{padding:12px;border-radius:var(--radius);background:var(--surface);font-size:14px}
.options{display:flex;flex-direction:column;gap:8px}
.option{width:100%;padding:12px 16px;text-align:left;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface);color:var(--text);font:500 14px var(--font-body);cursor:pointer;transition:transform .15s ease}
.option:hover{transform:scale(1.01)}
.btn{display:block;width:100%;padding:12px 20px;border:0;border-radius:var(--radius);background:var(--primary);color:var(--primary-text);font:600 14px var(--font-body);text-align:center;text-decoration:none;cursor:pointer;transition:opacity .2s ease}
.btn:hover{opacity:.9}
.benefits{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.benefits li{padding-left:24px;position:relative;font-size:14px}
.benefits li::before{content:"";position:absolute;left:4px;top:7px;width:8px;height:8px;border-radius:50%;background:var(--primary)}
.summary{display:flex;flex-direction:column;gap:12px}
.summary p{padding-bottom:12px;border-bottom:1px solid var(--border);font-size:14px;color:var(--text)}
.summary span{color:var(--muted)}
.cta-text{font-family:var(--font-heading);font-size:20px;color:var(--text)}
.notice{padding:12px;border-radius:var(--radius);background:var(--border);color:var(--muted);font-size:13px;text-align:center}
.card-footer{margin-top:32px;padding-top:20px;border-top:1px solid var(--border);text-align:center}
.card-footer .small{line-height:1.5;margin:0 0 12px}
.link{background:none;border:0;padding:0;color:var(--primary);font:600 12px var(--font-body);cursor:pointer;text-decoration:underline}
.nav{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-top:1px solid var(--border);font-size:12px;color:var(--muted)}
.nav button{background:none;border:0;padding:0;color:var(--text);font:600 12px var(--font-body);cursor:pointer}
.nav button:disabled{opacity:.3;cursor:default}
@media (min-width:768px){.screen{padding:40px;min-height:560px}h1{font-size:40px}h2{font-size:30px}.media{height:340px}.nav{padding:20px 40px}}
@media (max-width:480px){body{padding:0}.frame{max-width:none;min-height:100vh;border:0;border-radius:0;box-shadow:none}.screen{min-height:0}}`;
}

function pixelHead(tracking: HybridTracking): string {
  const parts: string[] = [];
  if (tracking.metaPixelId) {
    parts.push(
      `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(tracking.metaPixelId)}');</script>`,
    );
  }
  if (tracking.googleAdsTagId) {
    parts.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(tracking.googleAdsTagId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(tracking.googleAdsTagId)}');</script>`,
    );
  }
  return parts.join("\n  ");
}

function buildAppJs(): string {
  return `var slides=Array.from(document.querySelectorAll('[data-slide]'));
var answers={};
var current=0;
var fill=document.querySelector('[data-fill]');
var counter=document.querySelector('[data-counter]');
var backButton=document.querySelector('[data-back]');
var forwardButton=document.querySelector('[data-forward]');
var fired={};
var stageMap=[];
slides.forEach(function(node,i){
  var kind=node.querySelector('[data-answer]')?'quiz':node.querySelector('[data-summary]')?'transition':node.querySelector('[data-cta]')?'finalCta':i===0?'cover':'content';
  stageMap.push(kind);
});
function track(event,data){
  if(fired[event])return;
  fired[event]=true;
  if(typeof fbq!=='undefined')fbq('trackCustom',event,data||{});
  if(typeof gtag!=='undefined')gtag('event',event,data||{});
}
function trackStage(index){
  var kind=stageMap[index];
  if(kind==='quiz'){
    var qIndex=slides.slice(0,index+1).filter(function(n){return n.querySelector('[data-answer]')}).length-1;
    if(qIndex===0)track('quiz_start');
  }
}
function renderSummary(box){
  box.textContent='';
  QUESTIONS.forEach(function(question,index){
    if(!answers[index])return;
    var row=document.createElement('p');
    var q=document.createElement('span');q.textContent=question;
    var a=document.createElement('strong');a.textContent=answers[index];
    row.append(q,document.createElement('br'),a);
    box.append(row);
  });
}
function show(index){
  current=Math.max(0,Math.min(index,slides.length-1));
  slides.forEach(function(n,i){n.hidden=i!==current});
  var summary=slides[current].querySelector('[data-summary]');
  if(summary)renderSummary(summary);
  fill.style.width=(slides.length>1?(current/(slides.length-1))*100:100)+'%';
  counter.textContent=(current+1)+' / '+slides.length;
  backButton.disabled=current===0;
  forwardButton.disabled=current===slides.length-1;
  trackStage(current);
}
document.addEventListener('click',function(event){
  var option=event.target.closest('[data-answer]');
  if(option){
    answers[option.dataset.question]=option.dataset.answer;
    var total=QUESTIONS.length;
    var answered=Object.keys(answers).length;
    track('quiz_answer',{question:Number(option.dataset.question)+1,answer:option.dataset.answer});
    if(answered>=total)track('quiz_complete');
    show(current+1);return;
  }
  if(event.target.closest('[data-restart]')){Object.keys(answers).forEach(function(k){delete answers[k]});fired={};track('guide_view');track('guide_start');show(0);return}
  if(event.target.closest('[data-cta]')){track('advertorial_click');return}
  if(event.target.closest('[data-next], [data-forward]')){
    var s=stageMap[current];
    if(s==='cover')track('guide_start');
    if(s==='content')track('educational_card_view',{card:current});
    if(stageMap[current+1]==='finalCta')track('recommendation_view');
    show(current+1);return;
  }
  if(event.target.closest('[data-back]'))show(current-1);
});
track('guide_view');
show(0);
if(stageMap[0]==='cover')track('guide_start');`;
}

export interface HybridGuideAssets {
  indexHtml: string;
  css: string;
  js: string;
}

export function buildHybridGuideAssets(guide: HybridGuideData, assetMap: Map<string, string>): HybridGuideAssets {
  const { theme, tracking } = guide;
  const t = getHybridStrings(guide.project.language);
  const questions = JSON.stringify(guide.quiz.map((q) => q.question)).replace(/</g, "\\u003c");
  const slides = guide.stageOrder.flatMap((stage) => stageSlides(guide, stage, assetMap)).join("\n");
  const title = esc(guide.cover.headline || "Guia");
  const pixels = pixelHead(tracking);

  const indexHtml = `<!doctype html>
<html lang="${esc(guide.project.language || "pt")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap">
<link rel="stylesheet" href="css/style.css">
${pixels}
</head>
<body>
<main class="frame">
  <div class="bar"><div class="bar-fill" data-fill></div></div>
  ${slides}
  <nav class="nav">
    <button type="button" data-back>${esc(t.back)}</button>
    <span data-counter></span>
    <button type="button" data-forward>${esc(t.forward)}</button>
  </nav>
</main>
<script>var QUESTIONS=${questions};</script>
<script src="js/app.js"></script>
</body>
</html>`;

  return { indexHtml, css: styles(theme), js: buildAppJs() };
}

// Kept for backwards compatibility with the old single-file export.
export function buildHybridGuideHtml(guide: HybridGuideData): string {
  const { indexHtml, css, js } = buildHybridGuideAssets(guide, new Map());
  return indexHtml
    .replace('<link rel="stylesheet" href="css/style.css">', `<style>${css}</style>`)
    .replace('<script src="js/app.js"></script>', `<script>${js}</script>`);
}
