import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StripeEmbeddedCheckout } from "@/components/payments/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  promo_price_cents: number | null;
  interval: string;
  stripe_price_id: string | null;
  description: string | null;
};

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: typeof search.plan === "string" ? search.plan : undefined,
  }),
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — AvellPsy" },
      { name: "description", content: "Finalize sua assinatura AvellPsy com pagamento seguro." },
      { property: "og:title", content: "Checkout — AvellPsy" },
      { property: "og:description", content: "Finalize sua assinatura AvellPsy com pagamento seguro." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function CheckoutPage() {
  const { plan: planSlug } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({
        to: "/signup",
        search: { redirect: `/checkout?plan=${planSlug ?? ""}` } as never,
      });
    }
  }, [user, authLoading, navigate, planSlug]);

  useEffect(() => {
    if (!planSlug) return;
    supabase
      .from("plans")
      .select("*")
      .eq("slug", planSlug)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => setPlan((data as Plan) ?? null));
  }, [planSlug]);

  if (!user || authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
      </div>
    );
  }

  if (!planSlug || !plan) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold">Plano não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Volte e escolha um plano disponível.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex h-10 px-5 items-center rounded-lg bg-foreground text-background text-sm font-medium"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  const effective = plan.promo_price_cents ?? plan.price_cents;
  const hasPromo = plan.promo_price_cents != null && plan.promo_price_cents < plan.price_cents;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Pagamento seguro · Stripe
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          {!showCheckout ? (
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-6">
              <h1 className="text-2xl font-semibold tracking-tight">Você está assinando</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Revise o plano e prossiga para o pagamento.
              </p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Cupom de desconto (opcional)
                  </span>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="EX: LANCAMENTO"
                      className="flex-1 h-10 px-3 rounded-lg bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(coupon || undefined)}
                      className="h-10 px-4 rounded-lg border border-border text-sm hover:bg-surface"
                    >
                      Aplicar
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="mt-1 text-xs text-[oklch(0.78_0.16_155)]">
                      Cupom aplicado: {appliedCoupon}
                    </p>
                  )}
                </label>

                <button
                  onClick={() => setShowCheckout(true)}
                  disabled={!plan.stripe_price_id}
                  className="w-full h-11 rounded-lg bg-gradient-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {plan.stripe_price_id ? "Continuar para pagamento" : "Plano indisponível"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-surface/40 p-3 min-h-[600px]">
              <StripeEmbeddedCheckout
                priceId={plan.stripe_price_id!}
                userId={user.id}
                customerEmail={user.email ?? undefined}
                couponCode={appliedCoupon}
                returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
              />
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-6 self-start rounded-2xl border border-border/60 bg-surface p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumo</div>
          <div className="mt-3 text-lg font-semibold">{plan.name}</div>
          {plan.description && (
            <div className="mt-1 text-xs text-muted-foreground">{plan.description}</div>
          )}
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight">{brl(effective)}</span>
            <span className="text-sm text-muted-foreground">
              {plan.interval === "lifetime" ? "único" : "/mês"}
            </span>
          </div>
          {hasPromo && (
            <div className="mt-1 text-xs text-muted-foreground line-through">
              de {brl(plan.price_cents)}
            </div>
          )}
          <div className="mt-6 pt-5 border-t border-border/60 text-xs text-muted-foreground space-y-1.5">
            <p>✓ Cancele quando quiser</p>
            <p>✓ Acesso até o fim do período pago</p>
            <p>✓ Nota fiscal automática por email</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
