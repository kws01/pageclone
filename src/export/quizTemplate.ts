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

function isSafeImgUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith("data:image/");
}

interface ClassicDict {
  discovery: string;
  back: string;
  transitionSub: string;
  resultBadge: string;
  retake: string;
  whatYouShouldKnow: string;
  practicalTips: string;
  whatOthersSay: string;
  analyzing: string;
}

const CLASSIC_DICTS: Record<string, ClassicDict> = {
  pt: {
    discovery: "Quiz de Descoberta", back: "Voltar", transitionSub: "Isso leva apenas um momento",
    resultBadge: "Com base nas suas respostas", retake: "Refazer quiz",
    whatYouShouldKnow: "O que você deve saber", practicalTips: "Dicas práticas para você",
    whatOthersSay: "O que outros dizem", analyzing: "Analisando...",
  },
  en: {
    discovery: "Discovery Quiz", back: "Back", transitionSub: "This will only take a moment",
    resultBadge: "Based on your answers", retake: "Retake quiz",
    whatYouShouldKnow: "What you should know", practicalTips: "Practical tips for you",
    whatOthersSay: "What others are saying", analyzing: "Analyzing...",
  },
  es: {
    discovery: "Quiz de Descubrimiento", back: "Atrás", transitionSub: "Esto solo tomará un momento",
    resultBadge: "Según tus respuestas", retake: "Rehacer quiz",
    whatYouShouldKnow: "Lo que debes saber", practicalTips: "Consejos prácticos para ti",
    whatOthersSay: "Lo que otros dicen", analyzing: "Analizando...",
  },
  fr: {
    discovery: "Quiz de Découverte", back: "Retour", transitionSub: "Cela ne prendra qu'un moment",
    resultBadge: "D'après vos réponses", retake: "Refaire le quiz",
    whatYouShouldKnow: "Ce que vous devez savoir", practicalTips: "Conseils pratiques pour vous",
    whatOthersSay: "Ce que disent les autres", analyzing: "Analyse...",
  },
  de: {
    discovery: "Entdeckungs-Quiz", back: "Zurück", transitionSub: "Dies dauert nur einen Moment",
    resultBadge: "Basierend auf Ihren Antworten", retake: "Quiz wiederholen",
    whatYouShouldKnow: "Was Sie wissen sollten", practicalTips: "Praktische Tipps für Sie",
    whatOthersSay: "Was andere sagen", analyzing: "Analyse...",
  },
  it: {
    discovery: "Quiz di Scoperta", back: "Indietro", transitionSub: "Richiederà solo un momento",
    resultBadge: "In base alle tue risposte", retake: "Rifai il quiz",
    whatYouShouldKnow: "Cosa devi sapere", practicalTips: "Consigli pratici per te",
    whatOthersSay: "Cosa dicono gli altri", analyzing: "Analisi...",
  },
};

export function generateQuizHtml(
  data: QuizFunnelData,
  tracking: { headCode: string; bodyCode: string },
): string {
  const lang = data.language || "en";
  const dict = CLASSIC_DICTS[lang] || CLASSIC_DICTS.en;
  const configJson = JSON.stringify(data).replace(/<\//g, "<\\/");
  const trackingJson = JSON.stringify(tracking).replace(/<\//g, "<\\/");

  return `<!doctype html>
<html lang="${escAttr(lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.landingHeadline)}</title>
<meta name="description" content="${escAttr(data.landingSubheadline)}" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0a0e1a;--surface:#111827;--surface2:#1e293b;--text:#f1f5f9;--muted:#94a3b8;
  --accent:#00D2FF;--accent2:#3A7BD5;--accentGrad:linear-gradient(135deg,#00D2FF,#3A7BD5);
  --success:#10b981;--border:rgba(255,255,255,.08);--radius:16px;
  --cta-gold:#fbbf24;--cta-gold-grad:linear-gradient(135deg,#fbbf24,#f59e0b);
  --star:#fbbf24;
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
.quiz-app{max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;position:relative}
.quiz-screen{flex:1;display:none;flex-direction:column;padding:24px 20px;animation:fadeIn .4s ease}
.quiz-screen.active{display:flex}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

/* Progress bar */
.progress-wrap{height:6px;background:var(--surface2);border-radius:999px;overflow:hidden;margin-bottom:28px}
.progress-bar{height:100%;background:var(--accentGrad);border-radius:999px;transition:width .5s cubic-bezier(.4,0,.2,1);width:0%}

/* Landing screen */
.landing{justify-content:center;align-items:center;text-align:center;gap:0}
.landing-logo{font-size:14px;font-weight:700;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:24px}
.landing h1{font-size:28px;line-height:1.25;font-weight:800;letter-spacing:-.5px;margin-bottom:16px}
.landing .sub{font-size:16px;line-height:1.55;color:var(--muted);margin-bottom:36px;max-width:360px}
.landing .hero-visual{width:120px;height:120px;border-radius:28px;background:var(--accentGrad);display:flex;align-items:center;justify-content:center;font-size:48px;margin-bottom:36px;box-shadow:0 20px 60px rgba(0,210,255,.25)}
.btn-primary{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:16px 24px;border:none;border-radius:12px;
  font-size:16px;font-weight:700;color:#001020;cursor:pointer;
  background:var(--accentGrad);transition:transform .2s,box-shadow .2s;
  box-shadow:0 8px 30px rgba(0,210,255,.3);
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,210,255,.4)}
.btn-primary:active{transform:translateY(0)}
.btn-primary.large{font-size:18px;padding:18px 32px}

/* High-contrast CTA for result screen */
.btn-cta-result{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:20px 32px;border:none;border-radius:14px;
  font-size:18px;font-weight:800;color:#1a1200;cursor:pointer;
  background:var(--cta-gold-grad);transition:transform .2s,box-shadow .2s;
  box-shadow:0 10px 40px rgba(251,191,36,.35);text-align:center;line-height:1.3;
}
.btn-cta-result:hover{transform:translateY(-3px);box-shadow:0 14px 50px rgba(251,191,36,.5)}
.btn-cta-result:active{transform:translateY(-1px)}

/* Question screen */
.question-head{margin-bottom:24px}
.question-text{font-size:22px;line-height:1.35;font-weight:700;letter-spacing:-.3px}
.question-sub{font-size:14px;color:var(--muted);margin-top:8px;line-height:1.5}
.option-card{
  display:flex;gap:14px;align-items:flex-start;padding:14px;
  background:var(--surface);border:2px solid var(--border);border-radius:var(--radius);
  cursor:pointer;transition:all .25s;margin-bottom:12px;text-align:left;width:100%;
}
.option-card:hover{border-color:var(--accent);background:var(--surface2);transform:translateX(4px);box-shadow:0 0 20px rgba(0,210,255,.15)}
.option-card.selected{border-color:var(--accent);background:rgba(0,210,255,.08);box-shadow:0 0 24px rgba(0,210,255,.25)}
.option-visual{width:72px;height:72px;border-radius:12px;overflow:hidden;flex-shrink:0;position:relative;background:var(--surface2)}
.option-visual img{width:100%;height:100%;object-fit:cover;display:block}
.option-fallback{width:72px;height:72px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid var(--border)}
.option-icon{width:72px;height:72px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid var(--border)}
.option-body{flex:1;min-width:0}
.option-title{font-size:15px;font-weight:700;line-height:1.3;margin-bottom:4px;color:#FFFFFF}
.option-desc{font-size:13px;color:#E2E8F0;line-height:1.45}

/* Transition screen */
.transition{justify-content:center;align-items:center;text-align:center}
.spinner{width:56px;height:56px;border:4px solid var(--surface2);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite;margin-bottom:28px}
.transition-msg{font-size:18px;font-weight:600;animation:pulse 1.5s ease infinite}
.transition-sub{font-size:14px;color:var(--muted);margin-top:12px}
.transition-dots{display:flex;gap:6px;margin-top:20px}
.transition-dots span{width:8px;height:8px;border-radius:50%;background:var(--surface2);animation:pulse 1s ease infinite}
.transition-dots span:nth-child(2){animation-delay:.2s}
.transition-dots span:nth-child(3){animation-delay:.4s}

/* Result screen */
.result{gap:0}
.result-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:rgba(16,185,129,.15);color:var(--success);font-size:12px;font-weight:700;margin-bottom:20px;align-self:flex-start}
.result h2{font-size:24px;line-height:1.3;font-weight:800;letter-spacing:-.3px;margin-bottom:16px}
.result-summary{font-size:15px;line-height:1.6;color:var(--muted);margin-bottom:24px;padding:16px;background:var(--surface);border-radius:12px;border-left:3px solid var(--accent)}
.result-educational{font-size:14px;line-height:1.65;color:var(--text);margin-bottom:24px}
.result-educational h3{font-size:16px;font-weight:700;margin-bottom:10px}

/* Educational cards */
.edu-section{margin-bottom:24px}
.edu-section-title{font-size:16px;font-weight:700;margin-bottom:14px;color:var(--text)}
.edu-card{
  display:flex;gap:14px;align-items:flex-start;padding:16px;
  background:var(--surface);border:1px solid var(--border);border-radius:12px;
  margin-bottom:10px;transition:border-color .2s
}
.edu-card:hover{border-color:rgba(0,210,255,.3)}
.edu-card-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid var(--border)}
.edu-card-body{flex:1;min-width:0}
.edu-card-title{font-size:14px;font-weight:700;color:#FFFFFF;line-height:1.3;margin-bottom:4px}
.edu-card-desc{font-size:13px;color:#E2E8F0;line-height:1.5}

/* Bridge text */
.bridge-text{font-size:15px;line-height:1.6;color:var(--muted);margin-bottom:24px;padding:16px 18px;background:rgba(0,210,255,.05);border-radius:12px;border:1px solid rgba(0,210,255,.12)}

/* Product recommendation */
.product-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:20px;text-align:center}
.product-card .product-name{font-size:20px;font-weight:800;margin-bottom:8px}
.product-card .urgency{font-size:13px;color:#f59e0b;margin-top:12px}
.benefit-list{list-style:none;margin-bottom:28px;text-align:left}
.benefit-list li{display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid var(--border);font-size:14px;line-height:1.5}
.benefit-list li:last-child{border-bottom:none}
.benefit-list .check{color:var(--success);font-size:18px;flex-shrink:0;line-height:1.4}
.result .btn-cta-result{margin-top:8px;margin-bottom:28px}
.result-back{font-size:13px;color:var(--muted);text-align:center;margin-top:16px;cursor:pointer;text-decoration:underline;background:none;border:none;font-family:var(--font)}
.back-btn{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--muted);background:none;border:none;cursor:pointer;font-family:var(--font);padding:8px 0;margin-bottom:16px;transition:color .2s}
.back-btn:hover{color:var(--text)}
.back-arrow{font-size:18px;line-height:1;transition:transform .2s}
.back-btn:hover .back-arrow{transform:translateX(-3px)}

/* Testimonials / social proof */
.testimonials-section{margin-bottom:28px}
.testimonials-title{font-size:16px;font-weight:700;margin-bottom:16px;color:var(--text);text-align:center}
.testimonials-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tcard{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px}
.tcard-stars{font-size:14px;color:var(--star);letter-spacing:2px}
.tcard-text{font-size:13px;line-height:1.55;color:#E2E8F0}
.tcard-author{display:flex;align-items:center;gap:8px;margin-top:auto}
.tcard-avatar{width:32px;height:32px;border-radius:50%;background:var(--accentGrad);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#001020;flex-shrink:0}
.tcard-name{font-size:13px;font-weight:700;color:#fff;line-height:1.2}
.tcard-location{font-size:11px;color:var(--muted);line-height:1.3}

/* Disclaimer footer */
.quiz-footer{padding:20px;text-align:center}
.quiz-disclaimer{font-size:11px;line-height:1.6;color:#64748b;max-width:400px;margin:0 auto}
@media(max-width:520px){.quiz-app{max-width:100%}.landing h1{font-size:24px}.question-text{font-size:20px}.option-visual,.option-icon{width:60px;height:60px}.testimonials-grid{grid-template-columns:1fr}}
</style>
${tracking.headCode || ""}
</head>
<body>
<div class="quiz-app" id="quizApp">
  <div class="quiz-screen landing active" id="screen-landing">
    <div class="landing-logo">${esc(dict.discovery)}</div>
    ${data.landingImageUrl && isSafeImgUrl(data.landingImageUrl) ? `<img class="hero-visual" src="${escAttr(data.landingImageUrl)}" alt="${escAttr(data.landingImageAlt || "")}" style="object-fit:cover" fetchpriority="high" decoding="async" />` : `<div class="hero-visual">🧭</div>`}
    <h1>${esc(data.landingHeadline)}</h1>
    <p class="sub">${esc(data.landingSubheadline)}</p>
    <button class="btn-primary large" id="btn-start">${esc(data.startButtonText)}</button>
  </div>

  <div class="quiz-screen" id="screen-questions">
    <div class="progress-wrap"><div class="progress-bar" id="progressBar"></div></div>
    <div class="question-head">
      <div class="question-text" id="questionText"></div>
      <div class="question-sub" id="questionSub"></div>
    </div>
    <div id="optionsContainer" style="flex:1"></div>
    <button class="back-btn" id="btn-back"><span class="back-arrow">&larr;</span> ${esc(dict.back)}</button>
  </div>

  <div class="quiz-screen transition" id="screen-transition">
    <div class="spinner"></div>
    <div class="transition-msg" id="transitionMsg"></div>
    <div class="transition-sub">${esc(dict.transitionSub)}</div>
    <div class="transition-dots"><span></span><span></span><span></span></div>
  </div>

  <div class="quiz-screen result" id="screen-result">
    <div class="progress-wrap"><div class="progress-bar" style="width:100%"></div></div>
    <div class="result-badge">✓ ${esc(dict.resultBadge)}</div>
    <h2 id="resultHeadline"></h2>
    <div class="result-summary" id="resultSummary"></div>
    <div class="result-educational" id="resultEducational"></div>
    <div class="edu-section" id="eduCardsContainer"></div>
    <div class="bridge-text" id="bridgeText"></div>
    <ul class="benefit-list" id="benefitList"></ul>
    <div class="product-card">
      <div class="product-name" id="productName"></div>
      <div class="urgency" id="urgencyText"></div>
    </div>
    <button class="btn-cta-result" id="btn-cta"></button>
    <div class="testimonials-section" id="testimonialsContainer"></div>
    <button class="result-back" id="btn-restart">${esc(dict.retake)}</button>
  </div>

  <footer class="quiz-footer" id="quizFooter" style="display:none">
    <p class="quiz-disclaimer">${esc(data.disclaimer)}</p>
  </footer>
</div>
<script>
try {
var DATA = ${configJson} || {};
var TRACKING = ${trackingJson} || {};
var DICT = ${JSON.stringify(dict).replace(/<\//g, "<\\/")};
DATA.questions = Array.isArray(DATA.questions) ? DATA.questions : [];
DATA.transitionMessages = Array.isArray(DATA.transitionMessages) ? DATA.transitionMessages : [];
DATA.productBenefits = Array.isArray(DATA.productBenefits) ? DATA.productBenefits : [];
DATA.eduCards = Array.isArray(DATA.eduCards) ? DATA.eduCards : [];
DATA.testimonials = Array.isArray(DATA.testimonials) ? DATA.testimonials : [];
var state = { step: 0, answers: [] };
var screens = {
  landing: document.getElementById("screen-landing"),
  questions: document.getElementById("screen-questions"),
  transition: document.getElementById("screen-transition"),
  result: document.getElementById("screen-result")
};

function showScreen(name) {
  if (!screens[name]) return;
  Object.keys(screens).forEach(function(k) { if (screens[k]) screens[k].classList.remove("active"); });
  screens[name].classList.add("active");
  var footer = document.getElementById("quizFooter");
  if (footer) footer.style.display = (name === "result") ? "block" : "none";
  window.scrollTo(0, 0);
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
  var total = DATA.questions.length || 1;
  var pct = Math.round((state.step / total) * 100);
  var bar = document.getElementById("progressBar");
  if (bar) bar.style.width = pct + "%";
}

function postToParent(msg) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(Object.assign({ source: "quiz-template" }, msg), "*");
    }
  } catch (e) {}
}

function makeOptionVisual(opt) {
  var div = document.createElement("div");
  if (opt.imageUrl) {
    div.className = "option-visual";
    var img = document.createElement("img");
    img.src = opt.imageUrl;
    img.alt = "";
    img.onerror = function() {
      div.className = "option-fallback";
      div.innerHTML = "";
      var span = document.createElement("span");
      span.textContent = opt.icon;
      div.appendChild(span);
    };
    div.appendChild(img);
  } else {
    div.className = "option-icon";
    div.textContent = opt.icon;
  }
  return div;
}

function renderQuestion() {
  var q = DATA.questions[state.step];
  if (!q) { showResult(); return; }
  var el = document.getElementById("questionText");
  if (el) el.textContent = q.question || "";
  el = document.getElementById("questionSub");
  if (el) el.textContent = q.subtitle || "";
  var container = document.getElementById("optionsContainer");
 if (!container) return;
  container.innerHTML = "";
  (q.options || []).forEach(function(opt) {
    var card = document.createElement("button");
    card.className = "option-card";
    var visual = makeOptionVisual(opt);
    var body = document.createElement("div");
    body.className = "option-body";
    var title = document.createElement("div");
    title.className = "option-title";
    title.textContent = opt.title;
    var desc = document.createElement("div");
    desc.className = "option-desc";
    desc.textContent = opt.description;
    body.appendChild(title);
    body.appendChild(desc);
    card.appendChild(visual);
    card.appendChild(body);
    card.addEventListener("click", function() {
      state.answers.push({ questionId: q.id, optionId: opt.id, title: opt.title });
      trackEvent("quiz_step_" + (state.step + 1), { step: state.step + 1, total: DATA.questions.length });
      state.step++;
      updateProgress();
      if (state.step >= DATA.questions.length) {
        showTransition();
      } else {
        renderQuestion();
      }
    });
    container.appendChild(card);
  });
  updateProgress();
}

function showTransition() {
  showScreen("transition");
  var msgs = DATA.transitionMessages || [];
  var msgEl = document.getElementById("transitionMsg");
  var idx = 0;
  if (msgEl) msgEl.textContent = msgs[idx] || DICT.analyzing;
  var interval = setInterval(function() {
    idx++;
    if (idx < msgs.length && msgEl) { msgEl.textContent = msgs[idx]; }
  }, 1100);
  trackEvent("quiz_transition");
  setTimeout(function() {
    clearInterval(interval);
    showResult();
  }, 3500);
}

function getInitials(name) {
  var parts = name.trim().split(/\\s+/);
  if (parts.length >= 2) return (parts[0][0] || "") + (parts[1][0] || "");
  return name.slice(0, 2) || "?";
}

function showResult() {
  trackEvent("quiz_complete");
  var el = document.getElementById("resultHeadline");
  if (el) el.textContent = DATA.finalHeadline || "";
  el = document.getElementById("resultSummary");
  if (el) el.textContent = DATA.finalSummary || "";

  var eduEl = document.getElementById("resultEducational");
  if (eduEl) eduEl.innerHTML = "<h3>" + DICT.whatYouShouldKnow + "</h3><p>" + (DATA.finalEducational || "") + "</p>";

  var eduCardsEl = document.getElementById("eduCardsContainer");
 if (!eduCardsEl) return;
  eduCardsEl.innerHTML = "";
  if (DATA.eduCards && DATA.eduCards.length > 0) {
    var sectionTitle = document.createElement("div");
    sectionTitle.className = "edu-section-title";
    sectionTitle.textContent = DICT.practicalTips;
    eduCardsEl.appendChild(sectionTitle);
    DATA.eduCards.forEach(function(card) {
      var el = document.createElement("div");
      el.className = "edu-card";
      var icon = document.createElement("div");
      icon.className = "edu-card-icon";
      icon.textContent = card.icon;
      var body = document.createElement("div");
      body.className = "edu-card-body";
      var t = document.createElement("div");
      t.className = "edu-card-title";
      t.textContent = card.title;
      var d = document.createElement("div");
      d.className = "edu-card-desc";
      d.textContent = card.description;
      body.appendChild(t);
      body.appendChild(d);
      el.appendChild(icon);
      el.appendChild(body);
      eduCardsEl.appendChild(el);
    });
  }

  el = document.getElementById("bridgeText");
  if (el) el.textContent = DATA.bridgeText || "";

  var benefitList = document.getElementById("benefitList");
  if (benefitList) {
    benefitList.innerHTML = "";
    (DATA.productBenefits || []).forEach(function(b) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="check">&#10003;</span><span>' + b + '</span>';
      benefitList.appendChild(li);
    });
  }

  el = document.getElementById("productName");
  if (el) el.textContent = DATA.productName || "";
  el = document.getElementById("urgencyText");
  if (el) el.textContent = DATA.urgencyText || "";

  var ctaBtn = document.getElementById("btn-cta");
  if (ctaBtn) {
    ctaBtn.textContent = DATA.ctaText || "";
    ctaBtn.addEventListener("click", function() {
      trackEvent("quiz_cta_click");
      if (DATA.ctaUrl && DATA.ctaUrl !== "#") {
        window.location.href = DATA.ctaUrl;
      }
    });
  }

  var testimonialsEl = document.getElementById("testimonialsContainer");
 if (!testimonialsEl) { showScreen("result"); return; }
  testimonialsEl.innerHTML = "";
  if (DATA.testimonials && DATA.testimonials.length > 0) {
    var title = document.createElement("div");
    title.className = "testimonials-title";
    title.textContent = DICT.whatOthersSay;
    testimonialsEl.appendChild(title);
    var grid = document.createElement("div");
    grid.className = "testimonials-grid";
    DATA.testimonials.forEach(function(t) {
      var card = document.createElement("div");
      card.className = "tcard";
      var stars = document.createElement("div");
      stars.className = "tcard-stars";
      stars.textContent = "\\u2605\\u2605\\u2605\\u2605\\u2605";
      var text = document.createElement("div");
      text.className = "tcard-text";
      text.textContent = '"' + t.text + '"';
      var author = document.createElement("div");
      author.className = "tcard-author";
      var avatar = document.createElement("div");
      avatar.className = "tcard-avatar";
      avatar.textContent = getInitials(t.name);
      var info = document.createElement("div");
      var name = document.createElement("div");
      name.className = "tcard-name";
      name.textContent = t.name;
      var loc = document.createElement("div");
      loc.className = "tcard-location";
      loc.textContent = t.location;
      info.appendChild(name);
      info.appendChild(loc);
      author.appendChild(avatar);
      author.appendChild(info);
      card.appendChild(stars);
      card.appendChild(text);
      card.appendChild(author);
      grid.appendChild(card);
    });
    testimonialsEl.appendChild(grid);
  }

  showScreen("result");
}

var btnStart = document.getElementById("btn-start");
if (btnStart) btnStart.addEventListener("click", function() {
  trackEvent("quiz_start");
  state.step = 0;
  state.answers = [];
  showScreen("questions");
  renderQuestion();
});

var btnBack = document.getElementById("btn-back");
if (btnBack) btnBack.addEventListener("click", function() {
  if (state.step > 0) {
    state.step--;
    state.answers.pop();
    renderQuestion();
  } else {
    showScreen("landing");
  }
});

var btnRestart = document.getElementById("btn-restart");
if (btnRestart) btnRestart.addEventListener("click", function() {
  state.step = 0;
  state.answers = [];
  showScreen("landing");
});

postToParent({ type: "quiz-state", screen: "landing" });
} catch (err) {
  console.error("[quiz] Erro de renderização:", err);
  try {
    var app = document.getElementById("quizApp");
    if (app) app.innerHTML = '<div style="padding:40px;text-align:center;color:#6B7280;font-family:sans-serif"><p>Não foi possível renderizar o quiz.</p></div>';
  } catch (e2) {}
}
</script>
${tracking.bodyCode || ""}
</body>
</html>`;
}
