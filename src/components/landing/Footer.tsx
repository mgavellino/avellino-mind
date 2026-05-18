import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              A plataforma premium de gestão para psicólogos e clínicas.
              Mental Health Platform.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Produto
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#features" className="text-foreground/80 hover:text-foreground">Recursos</a></li>
              <li><a href="#pricing" className="text-foreground/80 hover:text-foreground">Planos</a></li>
              <li><a href="#faq" className="text-foreground/80 hover:text-foreground">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Empresa
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#" className="text-foreground/80 hover:text-foreground">Sobre</a></li>
              <li><a href="#" className="text-foreground/80 hover:text-foreground">Contato</a></li>
              <li><a href="#" className="text-foreground/80 hover:text-foreground">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© 2026 AvellPsy · Avellino Health, Inc.</div>
          <div>avellino.app</div>
        </div>
      </div>
    </footer>
  );
}
