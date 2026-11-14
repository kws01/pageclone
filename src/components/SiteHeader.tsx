import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/clone" className="hover:text-foreground">Clonar</Link>
          <Link to="/quiz-funnel" className="hover:text-foreground">Funil de Descoberta</Link>
          <Link to="/hybrid-guide" className="hover:text-foreground">Hybrid Guide</Link>
          <Link to="/sales-page" className="hover:text-foreground">Pagina de Vendas</Link>
          <Link to="/create-all" className="hover:text-foreground">Criar produto</Link>
          <Link to="/prompts" className="hover:text-foreground">Prompts</Link>
          <a href="/#features" className="hover:text-foreground">Recursos</a>
          <a href="/#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <Link
          to="/clone"
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
        >
          Testar gratis
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        &copy; {new Date().getFullYear()} PageClone AI — Clone, edite e exporte paginas de vendas em segundos.
      </div>
    </footer>
  );
}
