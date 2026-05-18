const testimonials = [
  {
    quote:
      "Migrei do Psicloud em uma tarde. O autosave do prontuário mudou minha forma de atender — não perco mais uma palavra.",
    name: "Dra. Camila Avelar",
    role: "Psicóloga clínica · SP",
  },
  {
    quote:
      "A agenda é absurdamente fluida. Meus pacientes elogiam o lembrete automático e eu economizo 6h por semana.",
    name: "Rafael Tonin",
    role: "Clínica Plenamente · POA",
  },
  {
    quote:
      "Interface impecável. Parece um software internacional. Finalmente algo à altura da nossa profissão.",
    name: "Dra. Mariana Souza",
    role: "Neuropsicóloga · BH",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-[oklch(0.68_0.20_245)]">
            Depoimentos
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-gradient-brand">
            Profissionais que confiam.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border/60 bg-surface/40 p-7"
            >
              <blockquote className="text-[15px] leading-relaxed text-foreground/90">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-brand" />
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
