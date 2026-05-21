import { Check, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  promo_price_cents: number | null;
  interval: string;
  features: string[];
  max_installments: number | null;
  is_featured: boolean;
  sort_order: number;
};

type Promo = {
  active?: boolean;
  title?: string;
  text?: string;
  badge?: string;
};

const intervalLabel: Record<string, string> = {
  monthly: "/mês",
  quarterly: "/mês",
  yearly: "/mês",
  lifetime: "único",
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
}

export function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promo, setPromo] = useState<Promo>({});

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data as unknown as Plan[]) ?? []));
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "launch_promo")
      .maybeSingle()
      .then(({ data }) => setPromo((data?.value as Promo) ?? {}));
  }, []);

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

        {promo.active && (
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
                <div className="text-sm font-semibold">{promo.title}</div>
                <div className="text-xs text-muted-foreground">{promo.text}</div>
              </div>
            </div>
            {promo.badge && (
              <span className="text-[10px] uppercase tracking-wider text-[oklch(0.78_0.16_250)] border border-[oklch(0.55_0.22_260)]/40 rounded-full px-3 py-1">
                {promo.badge}
              </span>
            )}
          </motion.div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => {
            const effective = plan.promo_price_cents ?? plan.price_cents;
            const hasPromo = plan.promo_price_cents != null && plan.promo_price_cents < plan.price_cents;
            const installments = plan.max_installments && plan.max_installments > 1
              ? `até ${plan.max_installments}x`
              : null;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative rounded-2xl border p-7 ${
                  plan.is_featured
                    ? "border-[oklch(0.58_0.22_260)]/50 bg-surface shadow-[0_0_60px_-20px_oklch(0.55_0.22_260/0.5)]"
                    : "border-border/60 bg-surface/40"
                }`}
              >
                {plan.is_featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                    Recomendado
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tight">
                    {formatBRL(effective)}
                  </span>
                  <span className="text-muted-foreground">{intervalLabel[plan.interval] ?? ""}</span>
                </div>
                {hasPromo && (
                  <div className="mt-1 text-xs text-muted-foreground line-through">
                    de {formatBRL(plan.price_cents)}
                  </div>
                )}
                {installments && (
                  <div className="mt-1 text-xs text-muted-foreground">{installments} no cartão</div>
                )}
                <ul className="mt-7 space-y-3">
                  {(plan.features ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-[oklch(0.68_0.20_245)] shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`mt-8 block w-full text-center rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-90 ${
                    plan.is_featured
                      ? "bg-gradient-brand text-white"
                      : "bg-foreground text-background"
                  }`}
                >
                  Começar agora
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
