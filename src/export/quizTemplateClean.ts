import type { QuizFunnelData } from "@/services/quizAnalyzer";

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

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function toScriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

interface Dict {
  back: string;
  continue: string;
  analyzing: string;
  adLabel: string;
  retake: string;
  start: string;
  loadingSub: string;
  resultBadge: string;
  disclaimer: string;
}

const DICTS: Record<string, Dict> = {
  pt: {
    back: "Voltar",
    continue: "Continuar",
    analyzing: "Analisando suas respostas",
    adLabel: "Conteúdo publicitário",
    retake: "Refazer quiz",
    start: "Começar",
    loadingSub: "Isso leva apenas alguns segundos",
    resultBadge: "Com base nas suas respostas",
    disclaimer: "Este site é um portal independente de conteúdo informativo e recomendações comerciais. As informações nesta página são educacionais e não substituem a orientação de profissionais qualificados. Para conferir condições de garantia, preços e disponibilidade oficial, visite o site do fabricante.",
  },
  en: {
    back: "Back",
    continue: "Continue",
    analyzing: "Analyzing your answers",
    adLabel: "Advertisement",
    retake: "Retake quiz",
    start: "Start",
    loadingSub: "This will only take a few seconds",
    resultBadge: "Based on your answers",
    disclaimer: "This site is an independent portal for informational content and commercial recommendations. The information on this page is educational and does not replace guidance from qualified professionals. To check guarantee conditions, prices, and official availability, please visit the manufacturer's website.",
  },
  es: {
    back: "Atrás",
    continue: "Continuar",
    analyzing: "Analizando tus respuestas",
    adLabel: "Contenido publicitario",
    retake: "Rehacer quiz",
    start: "Comenzar",
    loadingSub: "Esto solo tomará unos segundos",
    resultBadge: "Según tus respuestas",
    disclaimer: "Este sitio es un portal independiente de contenido informativo y recomendaciones comerciales. La información en esta página es educativa y no sustituye la orientación de profesionales cualificados. Para consultar las condiciones de garantía, precios y disponibilidad oficial, visite el sitio del fabricante.",
  },
  fr: {
    back: "Retour",
    continue: "Continuer",
    analyzing: "Analyse de vos réponses",
    adLabel: "Contenu publicitaire",
    retake: "Refaire le quiz",
    start: "Commencer",
    loadingSub: "Cela ne prendra que quelques secondes",
    resultBadge: "D'après vos réponses",
    disclaimer: "Ce site est un portail indépendant de contenu informatif et de recommandations commerciales. Les informations sur cette page sont éducatives et ne remplacent pas les conseils de professionnels qualifiés. Pour vérifier les conditions de garantie, les prix et la disponibilité officielle, visitez le site du fabricant.",
  },
  de: {
    back: "Zurück",
    continue: "Weiter",
    analyzing: "Ihre Antworten werden ausgewertet",
    adLabel: "Werbung",
    retake: "Quiz wiederholen",
    start: "Starten",
    loadingSub: "Dies dauert nur wenige Sekunden",
    resultBadge: "Basierend auf Ihren Antworten",
    disclaimer: "Diese Seite ist ein unabhängiges Portal für informative Inhalte und kommerzielle Empfehlungen. Die Informationen auf dieser Seite sind lehrreich und ersetzen nicht die Beratung durch qualifizierte Fachleute. Um Garantiebedingungen, Preise und offizielle Verfügbarkeit zu überprüfen, besuchen Sie die Website des Herstellers.",
  },
  it: {
    back: "Indietro",
    continue: "Continua",
    analyzing: "Analisi delle tue risposte",
    adLabel: "Contenuto pubblicitario",
    retake: "Rifai il quiz",
    start: "Inizia",
    loadingSub: "Richiederà solo pochi secondi",
    resultBadge: "In base alle tue risposte",
    disclaimer: "Questo sito è un portale indipendente di contenuti informativi e raccomandazioni commerciali. Le informazioni su questa pagina sono educative e non sostituiscono la consulenza di professionisti qualificati. Per verificare le condizioni di garanzia, i prezzi e la disponibilità ufficiale, visitare il sito del produttore.",
  },
};

export function generateCleanQuizHtml(
  data: QuizFunnelData,
  tracking: { headCode?: string; bodyCode?: string },
): string {
  const lang = data.language || "pt";
  const dict = DICTS[lang] || DICTS.en;
  const configJson = toScriptJson(data);
  const trackingJson = toScriptJson(tracking);

  return `<!doctype html>
<html lang="${escAttr(lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.landingHeadline || "")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --text:#0B1020;--muted:#5B6478;--blue:#2563EB;--blue-dark:#1D4ED8;--track:#E9EFFD;
  --border:#E5E7EB;--green:#16A34A;--green-dark:#15803D;--highlight:#EFF6FF;--white:#fff;
  --surface:#FAFBFC;--shadow-sm:0 1px 2px rgba(11,16,32,.06),0 1px 3px rgba(11,16,32,.04);
  --shadow-md:0 4px 12px rgba(11,16,32,.08),0 2px 4px rgba(11,16,32,.04);
  --shadow-lg:0 8px 28px rgba(11,16,32,.10),0 4px 10px rgba(11,16,32,.05);
  --radius:20px;--font:"Inter",system-ui,-apple-system,sans-serif;
}
body{font-family:var(--font);background:#F3F4F6;color:var(--text);min-height:100vh;overflow-x:hidden}
@media(min-width:640px){body{display:flex;justify-content:center;padding:24px 0}.quiz-app{max-width:560px;box-shadow:var(--shadow-lg);min-height:auto;border-radius:24px;overflow:hidden}}
.quiz-app{background:var(--white);min-height:100vh;display:flex;flex-direction:column;position:relative}
.progress-wrap{height:6px;background:var(--track);overflow:hidden;position:sticky;top:0;z-index:10;box-shadow:0 1px 2px rgba(11,16,32,.04)}
.progress-bar{height:100%;background:linear-gradient(90deg,var(--blue),var(--blue-dark));transition:width .4s cubic-bezier(.4,0,.2,1);width:0%}
.screen{flex:1;display:none;flex-direction:column;padding:28px 22px;animation:fadeIn .3s ease}
.screen.active{display:flex}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.landing-headline{font-size:26px;font-weight:800;line-height:1.22;letter-spacing:-.6px;margin-bottom:10px}
.landing-sub{font-size:15px;line-height:1.55;color:var(--muted);margin-bottom:28px}

.question-text{font-size:21px;font-weight:700;line-height:1.32;margin-bottom:18px}
.back-btn{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--muted);background:none;border:none;cursor:pointer;font-family:var(--font);padding:8px 0;margin-bottom:12px;transition:color .2s}
.back-btn:hover{color:var(--text)}

.option-btn{
  display:flex;align-items:center;gap:12px;width:100%;min-height:62px;
  padding:16px 18px;border:1.5px solid var(--border);border-radius:var(--radius);
  background:var(--white);cursor:pointer;transition:all .18s ease;
  font-size:18px;font-weight:600;text-align:left;color:var(--text);
  font-family:var(--font);margin-bottom:10px;box-shadow:var(--shadow-sm);
}
.option-btn:hover{border-color:var(--blue);background:var(--highlight);box-shadow:var(--shadow-md);transform:translateY(-1px)}
.option-btn.selected{border-color:var(--blue);background:var(--highlight);box-shadow:0 0 0 3px rgba(37,99,235,.15),var(--shadow-md)}
.option-emoji{font-size:32px;flex-shrink:0;line-height:1}

.btn-green{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:16px 24px;border:none;border-radius:14px;
  font-size:17px;font-weight:700;color:#fff;cursor:pointer;
  background:linear-gradient(135deg,var(--green),var(--green-dark));transition:transform .2s,box-shadow .2s;
  font-family:var(--font);box-shadow:0 4px 14px rgba(22,163,74,.28);
}
.btn-green:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(22,163,74,.38)}
.btn-green:active{transform:translateY(0)}

.btn-blue{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:16px 24px;border:none;border-radius:14px;
  font-size:17px;font-weight:700;color:#fff;cursor:pointer;
  background:linear-gradient(135deg,var(--blue),var(--blue-dark));transition:transform .2s,box-shadow .2s;
  font-family:var(--font);box-shadow:0 4px 14px rgba(37,99,235,.28);
}
.btn-blue:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,99,235,.38)}

.btn-outline{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:14px 24px;border:1.5px solid var(--border);border-radius:14px;
  font-size:15px;font-weight:600;color:var(--text);cursor:pointer;
  background:var(--white);transition:all .2s;font-family:var(--font);margin-top:12px;
}
.btn-outline:hover{border-color:var(--blue);background:var(--highlight);box-shadow:var(--shadow-sm)}

.insight-lead{font-size:16px;font-weight:600;color:var(--blue);margin-bottom:8px}
.insight-headline{font-size:21px;font-weight:700;line-height:1.32;margin-bottom:12px}
.insight-body{font-size:15px;line-height:1.6;color:var(--muted);margin-bottom:28px}

.loading-pct{font-size:44px;font-weight:800;color:var(--blue);margin-bottom:16px;font-variant-numeric:tabular-nums}
.loading-bar-wrap{height:8px;background:var(--track);border-radius:999px;overflow:hidden;margin-bottom:20px}
.loading-bar{height:100%;background:linear-gradient(90deg,var(--blue),var(--blue-dark));border-radius:999px;width:0%;transition:width .1s linear}
.loading-text{font-size:16px;font-weight:600;margin-bottom:4px}
.loading-sub{font-size:14px;color:var(--muted)}

.result-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:var(--highlight);color:var(--blue);font-size:12px;font-weight:700;margin-bottom:16px;align-self:flex-start;border:1px solid rgba(37,99,235,.15)}
.result-headline{font-size:23px;font-weight:800;line-height:1.28;letter-spacing:-.3px;margin-bottom:12px}
.result-body{font-size:15px;line-height:1.6;color:var(--muted);margin-bottom:28px}

.ad-label{display:inline-block;padding:4px 10px;border-radius:6px;background:#F3F4F6;color:var(--muted);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px}
.offer-headline{font-size:23px;font-weight:800;line-height:1.28;margin-bottom:20px}
.offer-headline u{text-decoration:underline;text-decoration-color:var(--blue);text-underline-offset:3px}
.hero-img{width:100%;border-radius:16px;margin-bottom:20px;display:block;box-shadow:var(--shadow-md)}

.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.compare-card{border:1.5px solid var(--border);border-radius:14px;padding:16px;box-shadow:var(--shadow-sm)}
.compare-card.without{background:#FEF2F2;border-color:#FECACA}
.compare-card.with{background:#F0FDF4;border-color:#BBF7D0}
.compare-title{font-size:14px;font-weight:700;margin-bottom:10px}
.compare-card.without .compare-title{color:#991B1B}
.compare-card.with .compare-title{color:#166534}
.compare-list{list-style:none;font-size:13px;line-height:1.5}
.compare-list li{display:flex;gap:6px;margin-bottom:6px}
.compare-emoji{font-size:16px;flex-shrink:0}

.features-title{font-size:17px;font-weight:700;margin-bottom:12px}
.features-list{list-style:none;margin-bottom:24px}
.features-list li{display:flex;align-items:flex-start;gap:8px;padding:10px 0;font-size:15px;line-height:1.5;border-bottom:1px solid var(--border)}
.features-list li:last-child{border-bottom:none}
.features-check{color:var(--green);font-size:18px;flex-shrink:0;font-weight:700}

.price-block{background:linear-gradient(135deg,var(--highlight),#DBEAFE);border:1px solid rgba(37,99,235,.12);border-radius:14px;padding:18px 20px;margin-bottom:16px;text-align:center;box-shadow:var(--shadow-sm)}
.price-label{font-size:13px;color:var(--muted);margin-bottom:4px}
.price-value{font-size:30px;font-weight:800;color:var(--blue-dark)}
.delivery-line{font-size:14px;color:var(--muted);text-align:center;margin-bottom:20px}

.cta-link{text-decoration:none;display:block}
.cta-link .btn-green{width:100%}

.footer{padding:20px;text-align:center;border-top:1px solid var(--border);background:var(--surface)}
.footer-text{font-size:11px;line-height:1.6;color:var(--muted);max-width:420px;margin:0 auto}
.landing-img{width:100%;max-height:220px;object-fit:cover;border-radius:16px;margin-bottom:20px;display:block}
</style>
${tracking.headCode || ""}
</head>
<body>
<div class="quiz-app" id="quizApp">
  <div class="progress-wrap"><div class="progress-bar" id="progressBar"></div></div>

  <div class="screen active" id="screen-landing">
    ${data.landingImageUrl && (isSafeUrl(data.landingImageUrl) || data.landingImageUrl.startsWith("data:image/")) ? `<img class="landing-img" id="landingImg" src="${escAttr(data.landingImageUrl)}" alt="${escAttr(data.landingImageAlt || "")}" width="520" height="220" fetchpriority="high" decoding="async" />` : ""}
    <div class="landing-headline" id="landingHeadline"></div>
    <div class="landing-sub" id="landingSub"></div>
    <button class="btn-blue" id="btn-start"></button>
  </div>

  <div class="screen" id="screen-question">
    <button class="back-btn" id="btn-back"><span>&larr;</span> <span id="backLabel"></span></button>
    <div class="question-text" id="questionText"></div>
    <div id="optionsContainer" style="flex:1"></div>
  </div>

  <div class="screen" id="screen-insight">
    <div class="insight-lead" id="insightLead"></div>
    <div class="insight-headline" id="insightHeadline"></div>
    <div class="insight-body" id="insightBody"></div>
    <button class="btn-green" id="btn-insight-continue"></button>
  </div>

  <div class="screen" id="screen-loading" style="justify-content:center;align-items:center;text-align:center">
    <div class="loading-pct" id="loadingPct">0%</div>
    <div class="loading-bar-wrap" style="width:100%"><div class="loading-bar" id="loadingBar"></div></div>
    <div class="loading-text" id="loadingText"></div>
    <div class="loading-sub" id="loadingSub"></div>
  </div>

  <div class="screen" id="screen-result">
    <div class="result-badge" id="resultBadge"></div>
    <div class="result-headline" id="resultHeadline"></div>
    <div class="result-body" id="resultBody"></div>
    <button class="btn-green" id="btn-result-continue"></button>
  </div>

  <div class="screen" id="screen-offer">
    <div class="ad-label" id="adLabel"></div>
    <div class="offer-headline" id="offerHeadline"></div>
    <img class="hero-img" id="heroImg" style="display:none" alt="" />
    <div class="compare-grid" id="compareGrid"></div>
    <div class="features-title" id="featuresTitle"></div>
    <ul class="features-list" id="featuresList"></ul>
    <div class="price-block" id="priceBlock" style="display:none">
      <div class="price-label" id="priceLabel"></div>
      <div class="price-value" id="priceValue"></div>
    </div>
    <div class="delivery-line" id="deliveryLine" style="display:none"></div>
    <a class="btn-green" id="btnCta" rel="sponsored nofollow noopener" target="_blank" style="text-decoration:none"></a>
    <a class="btn-outline" id="btnSecondCta" rel="sponsored nofollow noopener" target="_blank" style="text-decoration:none;display:none"></a>
  </div>

  <footer class="footer" id="footer" style="display:none">
    <p class="footer-text" id="footerText"></p>
  </footer>
</div>
<script>
try {
var DATA = ${configJson} || {};
var TRACKING = ${trackingJson} || {};
var LANG = ${toScriptJson(lang)};
var DICT = ${toScriptJson(dict)};
DATA.questions = Array.isArray(DATA.questions) ? DATA.questions : [];
DATA.offer = DATA.offer || {};
DATA.insight = DATA.insight || null;
DATA.facts = DATA.facts || {};
DATA.productBenefits = Array.isArray(DATA.productBenefits) ? DATA.productBenefits : [];
DATA.transitionMessages = Array.isArray(DATA.transitionMessages) ? DATA.transitionMessages : [];
var state = { step: 0, answers: [], phase: "q1_4" };
var screens = {
  landing: document.getElementById("screen-landing"),
  question: document.getElementById("screen-question"),
  insight: document.getElementById("screen-insight"),
  loading: document.getElementById("screen-loading"),
  result: document.getElementById("screen-result"),
  offer: document.getElementById("screen-offer")
};

var currentScreen = "landing";
var loadingInterval = null;
var loadingTimer = null;

function clearLoadingTimers() {
  clearInterval(loadingInterval);
  clearTimeout(loadingTimer);
  loadingInterval = null;
  loadingTimer = null;
}

function postToParent(msg) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(Object.assign({ source: "quiz-template" }, msg), "*");
    }
  } catch (e) {}
}

function showScreen(name) {
  if (!screens[name]) return;
  if (currentScreen === "loading" && name !== "loading") clearLoadingTimers();
  currentScreen = name;
  Object.keys(screens).forEach(function(k) { if (screens[k]) screens[k].classList.remove("active"); });
  screens[name].classList.add("active");
  var footer = document.getElementById("footer");
  if (footer) footer.style.display = (name === "offer") ? "block" : "none";
  window.scrollTo(0, 0);
  postToParent({ type: "quiz-state", screen: name });
}

function trackEvent(name, params) {
  try {
    if (window.fbq) {
      var std = { quiz_complete: "Lead", quiz_cta_click: "InitiateCheckout" };
      if (std[name]) window.fbq("track", std[name], params || {});
      window.fbq("trackCustom", name, params || {});
    }
  } catch (e) {}
  try {
    if (window.gtag) window.gtag("event", name, params || {});
  } catch (e) {}
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, params || {}));
  } catch (e) {}
}

function updateProgress() {
  var total = DATA.questions.length + 2;
  var pct = total > 0 ? Math.round((state.step / total) * 100) : 0;
  var bar = document.getElementById("progressBar");
  if (bar) bar.style.width = Math.min(pct, 100) + "%";
}

function renderLanding() {
  var el = document.getElementById("landingHeadline");
  if (el) el.textContent = DATA.landingHeadline || "";
  el = document.getElementById("landingSub");
  if (el) el.textContent = DATA.landingSubheadline || DICT.start;
  var btn = document.getElementById("btn-start");
  if (btn) btn.textContent = DATA.startButtonText || DICT.start;
  var limg = document.getElementById("landingImg");
  if (limg && DATA.landingImageUrl && /^https?:|^data:image/.test(DATA.landingImageUrl)) {
    limg.src = DATA.landingImageUrl;
    limg.alt = DATA.landingImageAlt || "";
    limg.style.display = "block";
  } else if (limg) {
    limg.style.display = "none";
  }
}

function afterStep() {
  var total = DATA.questions.length;
  if (state.phase === "q1_4" && state.step >= 4) {
    if (DATA.insight) {
      showInsight();
      return;
    }
    state.phase = "q5_6";
  }
  if (state.step >= total) {
    showLoading();
    return;
  }
  renderQuestion();
}

function popAnswerFor(index) {
  var q = DATA.questions[index];
  var last = state.answers[state.answers.length - 1];
  if (q && last && last.questionId === q.id) state.answers.pop();
}

function backToQuestionFour() {
  state.phase = "q1_4";
  state.step = 3;
  popAnswerFor(3);
  showScreen("question");
  renderQuestion();
}

function goBack() {
  if (state.phase === "insight") {
    backToQuestionFour();
    return;
  }
  if (state.phase === "q5_6" && state.step === 4) {
    if (DATA.insight) {
      state.phase = "insight";
      showScreen("insight");
    } else {
      backToQuestionFour();
    }
    return;
  }
  if (state.step > 0 && (state.phase === "q1_4" || state.phase === "q5_6")) {
    state.step--;
    popAnswerFor(state.step);
    renderQuestion();
  } else {
    showScreen("landing");
  }
}

function renderQuestion() {
  var q = DATA.questions[state.step];
  if (!q) { afterStep(); return; }
  if (screens.question && !screens.question.classList.contains("active")) showScreen("question");
  var qt = document.getElementById("questionText");
  if (qt) qt.textContent = q.question || "";
  var container = document.getElementById("optionsContainer");
  if (!container) return;
  container.innerHTML = "";
  var answered = false;
  (q.options || []).forEach(function(opt) {
    var btn = document.createElement("button");
    btn.className = "option-btn";
    if (opt.icon) {
      var emoji = document.createElement("span");
      emoji.className = "option-emoji";
      emoji.textContent = opt.icon;
      btn.appendChild(emoji);
    }
    var label = document.createElement("span");
    label.textContent = opt.title || "";
    btn.appendChild(label);
    btn.addEventListener("click", function() {
      if (answered) return;
      answered = true;
      btn.classList.add("selected");
      state.answers.push({ questionId: q.id, optionId: opt.id });
      trackEvent("quiz_step_" + (state.step + 1), { step: state.step + 1, total: DATA.questions.length });
      state.step++;
      updateProgress();
      setTimeout(afterStep, 180);
    });
    container.appendChild(btn);
  });
  var bl = document.getElementById("backLabel");
  if (bl) bl.textContent = DICT.back;
  var bb = document.getElementById("btn-back");
  if (bb) bb.style.visibility = state.step > 0 ? "visible" : "hidden";
  updateProgress();
}

function showInsight() {
  state.phase = "insight";
  trackEvent("quiz_insight");
  var ins = DATA.insight || {};
  var el = document.getElementById("insightLead");
  if (el) el.textContent = ins.lead || "";
  el = document.getElementById("insightHeadline");
  if (el) el.textContent = ins.headline || "";
  el = document.getElementById("insightBody");
  if (el) el.textContent = ins.body || "";
  el = document.getElementById("btn-insight-continue");
  if (el) el.textContent = DICT.continue;
  showScreen("insight");
  state.step = 4;
  updateProgress();
}

function showQuestionsPhase2() {
  state.phase = "q5_6";
  state.step = 4;
  showScreen("question");
  renderQuestion();
}

function showLoading() {
  state.phase = "loading";
  trackEvent("quiz_loading");
  var el = document.getElementById("loadingText");
  if (el) el.textContent = DICT.analyzing;
  el = document.getElementById("loadingSub");
  if (el) el.textContent = DICT.loadingSub;
  showScreen("loading");
  state.step = DATA.questions.length;
  updateProgress();
  var pct = 0;
  var bar = document.getElementById("loadingBar");
  var pctEl = document.getElementById("loadingPct");
  loadingInterval = setInterval(function() {
    pct += 2;
    if (pct > 100) pct = 100;
    if (bar) bar.style.width = pct + "%";
    if (pctEl) pctEl.textContent = pct + "%";
  }, 80);
  loadingTimer = setTimeout(function() {
    clearLoadingTimers();
    if (currentScreen !== "loading") return;
    if (bar) bar.style.width = "100%";
    if (pctEl) pctEl.textContent = "100%";
    showResult();
  }, 4000);
}

function showResult() {
  state.phase = "result";
  trackEvent("quiz_complete");
  var el = document.getElementById("resultBadge");
  if (el) el.textContent = DICT.resultBadge;
  el = document.getElementById("resultHeadline");
  if (el) el.textContent = DATA.resultHeadline || DATA.finalHeadline || DICT.resultBadge;
  el = document.getElementById("resultBody");
  if (el) el.textContent = DATA.resultBody || DATA.finalSummary || "";
  el = document.getElementById("btn-result-continue");
  if (el) el.textContent = DICT.continue;
  state.step = DATA.questions.length + 1;
  updateProgress();
  showScreen("result");
}

function formatPrice(value) {
  var text = String(value == null ? "" : value).trim();
  if (LANG === "pt" && /^\d/.test(text)) return "R$ " + text;
  return text;
}

function withFormattedPrice(text) {
  var price = DATA.facts && DATA.facts.price;
  if (!price || !text) return text;
  return String(text).split(price).join(formatPrice(price));
}

function setupCtaLink(el, url) {
  if (!el) return;
  el.onclick = function() { trackEvent("quiz_cta_click"); };
  if (/^https?:\\/\\//i.test(url)) {
    el.href = url;
    return;
  }
  console.warn("[quiz] URL de CTA inv\u00e1lida:", url);
  el.removeAttribute("href");
  el.setAttribute("aria-disabled", "true");
  el.style.opacity = "0.5";
  el.style.pointerEvents = "none";
}

function showOffer() {
  state.phase = "offer";
  trackEvent("quiz_offer");
  var el = document.getElementById("adLabel");
  if (el) el.textContent = DICT.adLabel;

  var offer = DATA.offer || {};
  var headlineEl = document.getElementById("offerHeadline");
  if (headlineEl) {
    if (offer.headline) {
      headlineEl.innerHTML = "";
      var text = offer.headline;
      var pname = DATA.productName || "";
      if (pname && text.indexOf(pname) >= 0) {
        var parts = text.split(pname);
        headlineEl.appendChild(document.createTextNode(parts[0]));
        var u = document.createElement("u");
        u.textContent = pname;
        headlineEl.appendChild(u);
        if (parts[1]) headlineEl.appendChild(document.createTextNode(parts[1]));
      } else {
        headlineEl.textContent = text;
      }
    } else {
      headlineEl.textContent = DATA.productName || "";
    }
  }

  var heroImg = document.getElementById("heroImg");
  if (heroImg && DATA.heroImageUrl && /^https?:/.test(DATA.heroImageUrl)) {
    heroImg.src = DATA.heroImageUrl;
    heroImg.style.display = "block";
    heroImg.alt = DATA.productName || "";
  }

  var compareGrid = document.getElementById("compareGrid");
  if (compareGrid) {
    compareGrid.innerHTML = "";
    if (offer.without && offer.with) {
      var wCard = document.createElement("div");
      wCard.className = "compare-card without";
      var wTitle = document.createElement("div");
      wTitle.className = "compare-title";
      wTitle.textContent = offer.withoutTitle || ("Sem " + (DATA.productName || ""));
      var wList = document.createElement("ul");
      wList.className = "compare-list";
      offer.without.forEach(function(item) {
        var li = document.createElement("li");
        var e = document.createElement("span");
        e.className = "compare-emoji";
        e.textContent = "\u{1F615}";
        var t = document.createElement("span");
        t.textContent = item;
        li.appendChild(e);
        li.appendChild(t);
        wList.appendChild(li);
      });
      wCard.appendChild(wTitle);
      wCard.appendChild(wList);

      var wCard2 = document.createElement("div");
      wCard2.className = "compare-card with";
      var wTitle2 = document.createElement("div");
      wTitle2.className = "compare-title";
      wTitle2.textContent = offer.withTitle || ("Com " + (DATA.productName || ""));
      var wList2 = document.createElement("ul");
      wList2.className = "compare-list";
      offer.with.forEach(function(item) {
        var li = document.createElement("li");
        var e = document.createElement("span");
        e.className = "compare-emoji";
        e.textContent = "\u{1F600}";
        var t = document.createElement("span");
        t.textContent = item;
        li.appendChild(e);
        li.appendChild(t);
        wList2.appendChild(li);
      });
      wCard2.appendChild(wTitle2);
      wCard2.appendChild(wList2);

      compareGrid.appendChild(wCard);
      compareGrid.appendChild(wCard2);
    }
  }

  var featuresTitle = document.getElementById("featuresTitle");
  var featuresList = document.getElementById("featuresList");
  if (featuresTitle) featuresTitle.textContent = (offer.features && offer.features.length > 0) ? (offer.featuresTitle || "") : "";
  if (featuresList) {
    featuresList.innerHTML = "";
    if (offer.features && offer.features.length > 0) {
      offer.features.forEach(function(f) {
        var li = document.createElement("li");
        var check = document.createElement("span");
        check.className = "features-check";
        check.textContent = "\u2713";
        var t = document.createElement("span");
        t.textContent = f;
        li.appendChild(check);
        li.appendChild(t);
        featuresList.appendChild(li);
      });
    } else {
      (DATA.productBenefits || []).forEach(function(b) {
        var li = document.createElement("li");
        var check = document.createElement("span");
        check.className = "features-check";
        check.textContent = "\u2713";
        var t = document.createElement("span");
        t.textContent = b;
        li.appendChild(check);
        li.appendChild(t);
        featuresList.appendChild(li);
      });
    }
  }

  var priceBlock = document.getElementById("priceBlock");
  if (priceBlock && DATA.facts && DATA.facts.price) {
    var pv = document.getElementById("priceValue");
    if (pv) pv.textContent = formatPrice(DATA.facts.price);
    priceBlock.style.display = "block";
  }
  var deliveryLine = document.getElementById("deliveryLine");
  if (deliveryLine && DATA.facts && DATA.facts.delivery) {
    deliveryLine.textContent = DATA.facts.delivery;
    deliveryLine.style.display = "block";
  }

  var ctaUrl = DATA.ctaUrl || "";
  var primaryCta = document.getElementById("btnCta");
  if (primaryCta) {
    primaryCta.textContent = withFormattedPrice((offer.ctaText) || DATA.ctaText || DICT.continue);
    setupCtaLink(primaryCta, ctaUrl);
  }

  var secondaryCta = document.getElementById("btnSecondCta");
  if (secondaryCta) {
    if (offer.secondCtaText) {
      secondaryCta.textContent = withFormattedPrice(offer.secondCtaText);
      secondaryCta.style.display = "inline-flex";
      setupCtaLink(secondaryCta, ctaUrl);
    } else {
      secondaryCta.style.display = "none";
    }
  }

  var ft = document.getElementById("footerText");
  if (ft) ft.textContent = DATA.disclaimer || DICT.disclaimer;
  showScreen("offer");
}

var btnStart = document.getElementById("btn-start");
if (btnStart) btnStart.addEventListener("click", function() {
  trackEvent("quiz_start");
  state.step = 0;
  state.answers = [];
  state.phase = "q1_4";
  showScreen("question");
  renderQuestion();
});

function goToScreen(screen) {
  if (screen === "landing") showScreen("landing");
  else if (screen === "insight" && DATA.insight) showInsight();
  else if (screen === "result") showResult();
  else if (screen === "offer") showOffer();
}

var btnBack = document.getElementById("btn-back");
if (btnBack) btnBack.addEventListener("click", goBack);

window.addEventListener("message", function(e) {
  try {
    if (!e.data || e.data.type !== "quiz-nav") return;
    if (window.parent && e.source !== window.parent) return;
    if (e.data.action === "goto") goToScreen(e.data.screen);
  } catch (err) {}
});

var btnInsight = document.getElementById("btn-insight-continue");
if (btnInsight) btnInsight.addEventListener("click", showQuestionsPhase2);
var btnResult = document.getElementById("btn-result-continue");
if (btnResult) btnResult.addEventListener("click", showOffer);

renderLanding();
postToParent({ type: "quiz-state", screen: "landing" });
} catch (err) {
  console.error("[quiz] Erro de renderiza\u00e7\u00e3o:", err);
  try {
    var app = document.getElementById("quizApp");
    if (app) app.innerHTML = '<div style="padding:40px;text-align:center;color:#6B7280;font-family:sans-serif"><p>N\u00e3o foi poss\u00edvel renderizar o quiz.</p></div>';
  } catch (e2) {}
}
</script>
${tracking.bodyCode || ""}
</body>
</html>`;
}
