import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/50 px-8 py-16 text-center md:px-16">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 100% at 50% 0%, oklch(0.55 0.22 260 / 0.25), transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-brand">
              Comece hoje.
              <br />
              Eleve sua prática.
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
              14 dias grátis. Sem cartão de crédito. Sem fricção.
            </p>
            <a
              href="#pricing"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Criar minha conta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
