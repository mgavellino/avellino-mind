import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

const links = [
  { label: "Produto", href: "#features" },
  { label: "Planos", href: "#pricing" },
  { label: "Depoimentos", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <nav className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-2.5 backdrop-blur-xl">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <a
              href="#login"
              className="hidden sm:inline-flex text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center text-sm px-3.5 py-1.5 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              Começar grátis
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
