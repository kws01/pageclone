function pickAccent(colors: string[]): string {
  const hex = colors.find((c) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c.trim()));
  return hex?.trim() || "#3b82f6";
}

export function cloneAccent(colors: string[]): string {
  return pickAccent(colors);
}

export function cloneStyles(mode: "full" | "slim", accent: string): string {
  const slim = mode === "slim";
  return `
:root{
  --accent:${accent};
  --bg:#0b0d12;
  --card:#151922;
  --border:#1f2937;
  --text:#f5f7fb;
  --muted:#94a3b8;
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
img,video,iframe{max-width:100%;height:auto;border:0;display:block}
.wrap{width:min(1120px,calc(100% - 32px));margin-inline:auto;padding:20px 0 48px}
header.brand{display:flex;justify-content:center;align-items:center;padding:12px 0 8px}
.logo{font-weight:700;font-size:18px;color:var(--accent)}
.logo-img{max-height:48px;margin:0 auto}
.hero{padding:28px 0 16px;text-align:center}
.hero h1{font-size:clamp(1.65rem,6vw,3.15rem);line-height:1.15;margin:0 0 12px;letter-spacing:-.02em}
.hero .sub{font-size:clamp(1rem,2.8vw,1.35rem);font-weight:500;color:var(--muted);margin:0 0 20px}
.hero-media{margin:20px auto;border-radius:12px;overflow:hidden}
.hero-media img{width:100%;margin:0 auto;border-radius:12px}
.cta{display:inline-flex;align-items:center;justify-content:center;background:var(--accent);color:#fff;font-weight:700;padding:16px 28px;border-radius:12px;text-decoration:none;font-size:1rem;min-height:48px;transition:transform .15s,opacity .15s}
.cta:hover{transform:translateY(-2px);opacity:.95}
.cta-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px}
.section{padding:28px 0}
.section h2{font-size:clamp(1.2rem,3vw,1.75rem);text-align:center;margin:0 0 20px}
.offer{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px 22px;max-width:720px;margin:0 auto;text-align:center}
.offer p{margin:0;color:#e2e8f0}
.benefits{display:grid;grid-template-columns:1fr;gap:12px}
.benefit{background:var(--card);padding:16px 18px;border-radius:12px;border:1px solid var(--border)}
.gallery{display:grid;grid-template-columns:1fr;gap:12px}
.gallery img{width:100%;border-radius:12px;margin:0}
.videos{display:grid;gap:16px}
.videos iframe,.videos video{width:100%;aspect-ratio:16/9;border-radius:12px;background:#000}
.testimonial{background:var(--card);padding:20px;border-radius:12px;border-left:4px solid var(--accent);margin:12px 0;font-style:italic;color:#e2e8f0}
.cta-band{text-align:center;padding:36px 0 12px}
footer.note{padding:32px 0 8px;text-align:center;color:#64748b;font-size:13px}
${slim ? `
.wrap{width:min(640px,calc(100% - 28px));padding-bottom:96px}
.hero{padding-top:12px}
.sticky-cta{position:fixed;left:0;right:0;bottom:0;padding:12px 16px 16px;background:linear-gradient(transparent,var(--bg) 28%);text-align:center;z-index:5}
.sticky-cta .cta{width:min(100%,520px)}
` : `
.hero-split{display:grid;gap:24px;align-items:center}
`}
@media (min-width:768px){
  .wrap{width:min(1120px,calc(100% - 48px));padding-top:28px}
  .hero{padding:40px 0 24px}
  .benefits{grid-template-columns:repeat(2,1fr);gap:16px}
  .gallery{grid-template-columns:repeat(2,1fr)}
  .cta{padding:18px 36px;font-size:1.125rem}
}
@media (min-width:1024px){
  ${slim ? "" : `
  .hero-split{grid-template-columns:1.05fr .95fr;text-align:left}
  .hero-split .cta-row{justify-content:flex-start}
  .hero-split h1,.hero-split .sub{text-align:left}
  `}
  .benefits{grid-template-columns:repeat(3,1fr)}
  .gallery{grid-template-columns:repeat(3,1fr)}
}
`;
}

export function fullPreserveStyles(): string {
  return `
img,video,iframe,embed,object{max-width:100%!important;height:auto;display:inline-block}
video,iframe{width:100%;max-height:none}
table{max-width:100%;display:block;overflow-x:auto}
pre,code{overflow-x:auto;max-width:100%}
body{overflow-x:hidden;min-width:0;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important}
body *{font-family:inherit!important}
h1,h2,h3,h4,h5,h6{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;letter-spacing:-.01em}
section,div,p,span,li,td,th,blockquote,figcaption{max-width:100%}
/* Fallback CTA button styles — applied when external CSS is blocked by CORS */
.pc-cta-fallback{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:100%!important;
  max-width:480px!important;
  padding:16px 32px!important;
  margin:16px auto!important;
  font-size:1.25rem!important;
  font-weight:800!important;
  text-transform:uppercase!important;
  text-decoration:none!important;
  color:#ffffff!important;
  background:#16a34a!important;
  border:0!important;
  border-bottom:4px solid #15803d!important;
  border-radius:12px!important;
  box-shadow:0 10px 30px rgba(22,163,74,.35)!important;
  cursor:pointer!important;
  text-align:center!important;
  transition:all .3s ease!important;
  animation:pc-pulse 2s ease-in-out infinite!important;
  box-sizing:border-box!important;
  line-height:1.4!important;
}
.pc-cta-fallback:hover{
  background:#22c55e!important;
  transform:scale(1.05)!important;
}
.pc-cta-fallback:active{
  transform:scale(1.02)!important;
}
@keyframes pc-pulse{
  0%,100%{box-shadow:0 10px 30px rgba(22,163,74,.35)}
  50%{box-shadow:0 10px 40px rgba(22,163,74,.6)}
}
.pc-scroll-fallback{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:8px!important;
  padding:12px 28px!important;
  margin:12px auto!important;
  font-size:1.125rem!important;
  font-weight:700!important;
  text-decoration:none!important;
  color:#ffffff!important;
  background:#2563eb!important;
  border:0!important;
  border-radius:10px!important;
  box-shadow:0 6px 20px rgba(37,99,235,.3)!important;
  cursor:pointer!important;
  text-align:center!important;
  transition:all .3s ease!important;
  transform:scale(1)!important;
  box-sizing:border-box!important;
  line-height:1.4!important;
}
.pc-scroll-fallback:hover{
  background:#1d4ed8!important;
  transform:scale(1.05)!important;
}
@media (max-width:767px){
  html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
  body,main,#page,#wrapper,.page,.wrapper,.container,.content{width:100%!important;max-width:100%!important;min-width:0!important}
  [style*="width:"]{max-width:100%!important}
}
@media (min-width:768px) and (max-width:1023px){
  body{max-width:100%}
}
@media (min-width:1024px){
  img{height:auto}
}
`;
}

function escapeTitle(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function documentShell(params: {
  title: string;
  description: string;
  accent: string;
  mode: "full" | "slim";
  body: string;
}): string {
  const { title, description, accent, mode, body } = params;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeTitle(title)}</title>
<meta name="description" content="${escapeTitle(description)}" />
<style>${cloneStyles(mode, accent)}</style>
</head>
<body data-clone-mode="${mode}">
${body}
</body>
</html>`;
}
