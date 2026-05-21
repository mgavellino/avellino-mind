import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { StripeEmbeddedCheckout } from "@/components/payments/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/payments/PaymentTestModeBanner";

export const Route = createFileRoute("/_authenticated/app/financeiro")({
  component: FinanceiroPage,
});

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  promo_price_cents: number | null;
  interval: string;
  stripe_price_id: string | null;
  is_featured: boolean;
  max_installments: number | null;
};

type Payment = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
  paid_at: string | null;
  user_id: string;
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function FinanceiroPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [openPriceId, setOpenPriceId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [showCheckout, setShowCheckout] = useState<{ priceId: string; coupon?: string } | null>(null);

  const loadPayments = async () => {
    const q = supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(100);
    const { data } = await q;
    setPayments((data as unknown as Payment[]) ?? []);
  };

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data as unknown as Plan[]) ?? []));
    loadPayments();
  }, []);

  const markPaid = async (id: string) => {
    const { error } = await supabase
      .from("payments")
      .update({ status: "approved", paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pagamento dado baixa");
    loadPayments();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PaymentTestModeBanner />
      <div className="mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-white mb-3">
          <CreditCard className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua assinatura, recibos e histórico de pagamentos.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Planos disponíveis
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const effective = p.promo_price_cents ?? p.price_cents;
            const hasPromo = p.promo_price_cents && p.promo_price_cents < p.price_cents;
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 ${
                  p.is_featured
                    ? "border-[oklch(0.55_0.22_260)]/50 bg-surface"
                    : "border-border/60 bg-surface/40"
                }`}
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.slug}</div>
                <div className="mt-1 text-lg font-semibold">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold">{brl(effective)}</span>
                  {hasPromo && (
                    <span className="text-xs text-muted-foreground line-through">{brl(p.price_cents)}</span>
                  )}
                </div>
                {p.max_installments && p.max_installments > 1 && (
                  <div className="text-xs text-muted-foreground mt-1">até {p.max_installments}x</div>
                )}
                <button
                  onClick={() => setOpenPriceId(p.stripe_price_id)}
                  disabled={!p.stripe_price_id}
                  className="mt-4 w-full h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-40"
                >
                  Assinar
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {openPriceId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 grid place-items-center p-4" onClick={() => setOpenPriceId(null)}>
          <div className="bg-background rounded-2xl border border-border/60 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Aplicar cupom (opcional)</h3>
              <button onClick={() => setOpenPriceId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Código do cupom"
              className="w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm"
            />
            <button
              onClick={() => {
                setShowCheckout({ priceId: openPriceId!, coupon: coupon || undefined });
                setOpenPriceId(null);
              }}
              className="mt-4 w-full h-10 rounded-lg bg-gradient-brand text-white text-sm font-medium"
            >
              Ir para pagamento
            </button>
          </div>
        </div>
      )}

      {showCheckout && user && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 overflow-y-auto p-4" onClick={() => setShowCheckout(null)}>
          <div className="max-w-2xl mx-auto bg-background rounded-2xl border border-border/60 p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[oklch(0.68_0.20_245)]" /> Finalizar assinatura
              </h3>
              <button onClick={() => setShowCheckout(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <StripeEmbeddedCheckout
              priceId={showCheckout.priceId}
              couponCode={showCheckout.coupon}
              userId={user.id}
              customerEmail={user.email ?? undefined}
            />
          </div>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de pagamentos
          </h2>
          {isAdmin && (
            <span className="text-[10px] uppercase tracking-wider text-[oklch(0.78_0.16_250)]">Visão admin</span>
          )}
        </div>
        <div className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Descrição</th>
                <th className="text-left px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Status</th>
                {isAdmin && <th className="text-right px-4 py-3">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{p.description ?? "Pagamento"}</td>
                  <td className="px-4 py-3 font-medium">{brl(p.amount_cents)}</td>
                  <td className="px-4 py-3">
                    {p.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[oklch(0.72_0.18_155)]">
                        <CheckCircle2 className="h-3 w-3" /> Aprovado
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400">{p.status}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {p.status !== "approved" && (
                        <button
                          onClick={() => markPaid(p.id)}
                          className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-surface"
                        >
                          Dar baixa
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    Nenhum pagamento registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
