import { Link } from "react-router-dom";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import {
  Zap, Edit3, Download, Smartphone, Link2, ArrowRight, Check,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
          <div className="container relative mx-auto px-4 py-24 md:py-32 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand backdrop-blur">
              <Zap className="h-3.5 w-3.5" /> Ferramenta para Afiliados Profissionais
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
              Clone paginas de vendas.<br />
              <span className="text-brand">Troque o link de afiliado em 1 clique.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Cole a URL, edite no editor visual e exporte o código HTML/ZIP pronto para publicar em qualquer hospedagem (Netlify, Vercel, WordPress ou cPanel).
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/clone" className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 font-medium text-brand-foreground transition hover:opacity-90">
                Testar gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 font-medium hover:bg-accent">
                Como funciona
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border/60 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Tudo que afiliado profissional precisa</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Zap, t: "Clone Completo", d: "Replica toda a estrutura visual com responsividade melhorada." },
                { icon: Link2, t: "CTAs em 1 clique", d: "Substitua todos os links de afiliado de uma so vez." },
                { icon: Edit3, t: "Editor visual", d: "Edite texto, imagens, cores e logo direto no navegador." },
                { icon: Download, t: "Export HTML/ZIP", d: "Baixe HTML limpo pronto para Netlify ou Vercel." },
                { icon: Smartphone, t: "100% responsivo", d: "Preview mobile, tablet e desktop com 1 clique." },
                { icon: Check, t: "Otimizado para conversao", d: "Remove trackers e widgets que pesam a pagina." },
              ].map((f) => (
                <div key={f.t} className="rounded-xl border border-border bg-card p-6 transition hover:shadow-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="border-t border-border/60 py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Como funciona</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                ["Cole a URL", "Voce cola o link da pagina de vendas que quer clonar."],
                ["Edite o conteudo", "Troque headlines, CTAs, logo e imagens direto no editor visual."],
                ["Exporte", "Baixe HTML ou ZIP pronto para publicar no Netlify, Vercel ou qualquer host."],
              ].map(([t, d], i) => (
                <li key={t} className="rounded-xl border border-border bg-card p-6">
                  <div className="text-3xl font-bold text-brand">0{i + 1}</div>
                  <h3 className="mt-2 font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="border-t border-border/60 py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Perguntas frequentes</h2>
            <div className="mt-10 space-y-4">
              {[
                ["Funciona com qualquer pagina?", "Sim, qualquer pagina publica HTTP/HTTPS pode ser analisada."],
                ["Precisa de backend?", "Nao. Tudo roda no frontend com um proxy serverless para buscar a pagina."],
                ["Posso usar como afiliado?", "Sim, e o caso de uso principal. Voce troca todos os CTAs por seu link."],
                ["Onde fica salvo?", "Localmente no seu navegador. Voce pode exportar como HTML ou ZIP a qualquer momento."],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="cursor-pointer font-medium flex items-center justify-between">
                    {q}
                    <Check className="h-4 w-4 text-brand opacity-0 group-open:opacity-100 transition" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to="/clone" className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 font-medium text-brand-foreground hover:opacity-90">
                Comecar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
