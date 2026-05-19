import { Check, Sparkles } from "lucide-react";
import { motion } from "motion/react";

const plans = [
  {
    name: "Mensal",
    price: "R$ 89",
    period: "/mês",
    description: "Para psicólogos autônomos.",
    features: ["Agenda completa", "Prontuário ilimitado", "Até 100 pacientes", "Suporte por email"],
    cta: "Começar",
    featured: false,
  },
  {
    name: "Trimestral",
    price: "R$ 69",
    period: "/mês",
    description: "Economize 22% no plano trimestral.",
    features: [
      "Tudo do Mensal",
      "Pacientes ilimitados",
      "Pagamentos integrados",
      "Suporte prioritário",
      "Exportação PDF/DOCX",
    ],
    cta: "Mais popular",
    featured: true,
  },
  {
    name: "Anual",
    price: "R$ 59",
    period: "/mês",
    description: "Para clínicas estabelecidas.",
    features: [
      "Tudo do Trimestral",
      "Multi-profissionais",
      "Painel administrativo",
      "Analytics avançado",
      "Onboarding dedicado",
    ],
    cta: "Assinar anual",
    featured: false,
  },
  {
    name: "Vitalício",
    price: "R$ 997",
    period: "único",
    description: "Pague uma vez. Use para sempre.",
    features: [
      "Tudo do Anual",
      "Acesso vitalício",
      "Atualizações incluídas",
      "Suporte premium dedicado",
      "Sem mensalidades",
    ],
    cta: "Garantir vitalício",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-[oklch(0.68_0.20_245)]">
            Planos
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-gradient-brand">
            Preços transparentes.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            14 dias de teste grátis em qualquer plano. Sem cartão de crédito.
          </p>
        </div>

        {/* Launch promo banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 mx-auto max-w-3xl rounded-2xl border border-[oklch(0.55_0.22_260)]/40 bg-gradient-to-r from-[oklch(0.55_0.22_260)]/10 to-[oklch(0.68_0.20_245)]/10 px-6 py-5 flex flex-col sm:flex-row items-center gap-4 justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-semibold">Promoção de lançamento</div>
              <div className="text-xs text-muted-foreground">
                1º mês por <span className="text-foreground font-semibold">R$ 697</span> · parcele em até 12x
              </div>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[oklch(0.78_0.16_250)] border border-[oklch(0.55_0.22_260)]/40 rounded-full px-3 py-1">
            por tempo limitado
          </span>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-2xl border p-7 ${
                plan.featured
                  ? "border-[oklch(0.58_0.22_260)]/50 bg-surface shadow-[0_0_60px_-20px_oklch(0.55_0.22_260/0.5)]"
                  : "border-border/60 bg-surface/40"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                  Recomendado
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-7 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 mt-0.5 text-[oklch(0.68_0.20_245)] shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 w-full rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-90 ${
                  plan.featured
                    ? "bg-gradient-brand text-white"
                    : "bg-foreground text-background"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
