import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, CreditCard, DollarSign, Filter, Sparkles, X } from "lucide-react";
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
};

type Receivable = {
  id: string;
  appointment_id: string;
  patient_id: string | null;
  amount_cents: number;
  status: "pending" | "paid" | "overdue" | "waived";
  due_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  owner_id: string;
};

type AppointmentLite = {
  id: string;
  starts_at: string;
  ends_at: string;
  patient_id: string | null;
  status: string;
  kind: string;
  title: string | null;
};

type PatientLite = { id: string; full_name: string };

type StatusFilter = "all" | "pending" | "paid" | "overdue" | "waived";

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_META: Record<Receivable["status"], { label: string; cls: string }> = {
  pending: { label: "A receber", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  paid: { label: "Recebido", cls: "text-[oklch(0.78_0.18_155)] bg-[oklch(0.55_0.18_155)]/10 border-[oklch(0.55_0.18_155)]/30" },
  overdue: { label: "Atrasado", cls: "text-[oklch(0.78_0.16_25)] bg-[oklch(0.55_0.20_25)]/10 border-[oklch(0.55_0.20_25)]/30" },
  waived: { label: "Isento", cls: "text-muted-foreground bg-surface border-border/60" },
};

function FinanceiroPage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  // Plans for subscription panel
  const [plans, setPlans] = useState<Plan[]>([]);
  const [openPriceId, setOpenPriceId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [showCheckout, setShowCheckout] = useState<{ priceId: string; coupon?: string } | null>(
    null,
  );

  // Receivables module
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [appts, setAppts] = useState<Record<string, AppointmentLite>>({});
  const [patients, setPatients] = useState<Record<string, PatientLite>>({});
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [defaultPrice, setDefaultPrice] = useState<string>("");

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data as unknown as Plan[]) ?? []));

    if (!user) return;
    supabase
      .from("profiles")
      .select("default_session_price_cents")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const v = (data as any)?.default_session_price_cents;
        if (typeof v === "number" && v > 0) setDefaultPrice(String(v / 100));
      });

    loadReceivables();
  }, [user]);

  const loadReceivables = async () => {
    if (!user) return;
    const { data: recs } = await supabase
      .from("appointment_receivables")
      .select("*")
      .order("due_at", { ascending: false })
      .limit(500);
    const list = (recs as unknown as Receivable[]) ?? [];
    setReceivables(list);

    const apptIds = Array.from(new Set(list.map((r) => r.appointment_id)));
    const patIds = Array.from(new Set(list.map((r) => r.patient_id).filter(Boolean) as string[]));
    if (apptIds.length) {
      const { data: a } = await supabase
        .from("appointments")
        .select("id, starts_at, ends_at, patient_id, status, kind, title")
        .in("id", apptIds);
      const m: Record<string, AppointmentLite> = {};
      for (const row of (a as unknown as AppointmentLite[]) ?? []) m[row.id] = row;
      setAppts(m);
    }
    if (patIds.length) {
      const { data: p } = await supabase
        .from("patients")
        .select("id, full_name")
        .in("id", patIds);
      const m: Record<string, PatientLite> = {};
      for (const row of (p as unknown as PatientLite[]) ?? []) m[row.id] = row;
      setPatients(m);
    }
  };

  const filtered = useMemo(
    () => (filter === "all" ? receivables : receivables.filter((r) => r.status === filter)),
    [receivables, filter],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now).toISOString();
    const monthEnd = endOfMonth(now).toISOString();
    let received = 0;
    let pending = 0;
    let overdue = 0;
    for (const r of receivables) {
      const ref = r.paid_at ?? r.due_at;
      const inMonth = ref && ref >= monthStart && ref <= monthEnd;
      if (r.status === "paid" && inMonth) received += r.amount_cents;
      if (r.status === "pending") pending += r.amount_cents;
      if (r.status === "overdue") overdue += r.amount_cents;
    }
    return { received, pending, overdue };
  }, [receivables]);

  const updateReceivable = async (id: string, patch: Partial<Receivable>) => {
    const { error } = await supabase.from("appointment_receivables").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setReceivables((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const markPaid = (r: Receivable, method: string) =>
    updateReceivable(r.id, {
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: method,
    });

  const setAmount = (r: Receivable, value: string) => {
    const cents = Math.round(parseFloat(value || "0") * 100);
    if (Number.isNaN(cents) || cents < 0) return;
    updateReceivable(r.id, { amount_cents: cents });
  };

  const saveDefaultPrice = async () => {
    if (!user) return;
    const cents = Math.round(parseFloat(defaultPrice || "0") * 100);
    const { error } = await supabase
      .from("profiles")
      .update({ default_session_price_cents: cents })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Valor padrão atualizado");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PaymentTestModeBanner />
      <div className="mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-white mb-3">
          <DollarSign className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle os recebimentos de cada consulta e gerencie a sua assinatura AvellPsy.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          icon={CheckCircle2}
          tone="positive"
          label="Recebido no mês"
          value={brl(stats.received)}
        />
        <StatCard icon={Clock} tone="warning" label="A receber" value={brl(stats.pending)} />
        <StatCard icon={Sparkles} tone="danger" label="Atrasado" value={brl(stats.overdue)} />
      </div>

      {/* Default session price */}
      <div className="mb-8 rounded-2xl border border-border/60 bg-surface/40 p-5 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Valor padrão por consulta (R$)</label>
          <input
            type="number"
            step="0.01"
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(e.target.value)}
            placeholder="ex: 250.00"
            className="mt-1 w-full sm:w-60 h-10 px-3 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Aplicado automaticamente em novos recebimentos criados pelas consultas realizadas.
          </p>
        </div>
        <button
          onClick={saveDefaultPrice}
          className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium"
        >
          Salvar
        </button>
      </div>

      {/* Filter */}
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {(["all", "pending", "paid", "overdue", "waived"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === s
                ? "bg-foreground text-background border-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "Todos" : STATUS_META[s as Receivable["status"]].label}
          </button>
        ))}
      </div>

      {/* Receivables table */}
      <div className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden mb-12">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Paciente</th>
              <th className="text-left px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const ap = appts[r.appointment_id];
              const pat = r.patient_id ? patients[r.patient_id] : null;
              const meta = STATUS_META[r.status];
              return (
                <tr key={r.id} className="border-t border-border/40 align-middle">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {ap?.starts_at
                      ? format(parseISO(ap.starts_at), "dd MMM yyyy · HH:mm", { locale: ptBR })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {pat?.full_name ?? ap?.title ?? "Consulta"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="text-muted-foreground text-xs">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={(r.amount_cents / 100).toFixed(2)}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (Math.round(parseFloat(v || "0") * 100) !== r.amount_cents)
                            setAmount(r, v);
                        }}
                        className="w-24 h-8 px-2 rounded-md bg-background border border-border/60 text-sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                    {r.paid_at && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {r.payment_method ?? "Pago"} ·{" "}
                        {format(parseISO(r.paid_at), "dd/MM/yy", { locale: ptBR })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {r.status === "paid" ? (
                      <button
                        onClick={() =>
                          updateReceivable(r.id, { status: "pending", paid_at: null, payment_method: null })
                        }
                        className="text-xs px-2 py-1 rounded-md border border-border/60 hover:bg-surface"
                      >
                        Reabrir
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => markPaid(r, "Pix")}
                          className="text-xs px-2 py-1 rounded-md border border-border/60 hover:bg-surface"
                        >
                          Pix
                        </button>
                        <button
                          onClick={() => markPaid(r, "Dinheiro")}
                          className="text-xs px-2 py-1 rounded-md border border-border/60 hover:bg-surface"
                        >
                          Dinheiro
                        </button>
                        <button
                          onClick={() => markPaid(r, "Cartão")}
                          className="text-xs px-2 py-1 rounded-md border border-border/60 hover:bg-surface"
                        >
                          Cartão
                        </button>
                        <button
                          onClick={() => updateReceivable(r.id, { status: "waived" })}
                          className="text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground"
                        >
                          Isentar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Nenhum recebimento aqui. Marque uma consulta como "Realizada" na agenda para ela
                  aparecer no financeiro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Subscription section */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sua assinatura AvellPsy
          </h2>
          <ManageSubscriptionButton />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const effective = p.promo_price_cents ?? p.price_cents;
            const hasPromo = p.promo_price_cents && p.promo_price_cents < p.price_cents;
            const suffix = p.interval === "lifetime" ? "" : " / mês";
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 ${
                  p.is_featured
                    ? "border-[oklch(0.55_0.22_260)]/50 bg-surface"
                    : "border-border/60 bg-surface/40"
                }`}
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {p.slug}
                </div>
                <div className="mt-1 text-lg font-semibold">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">{brl(effective)}</span>
                  <span className="text-xs text-muted-foreground">{suffix}</span>
                </div>
                {hasPromo && (
                  <div className="text-xs text-muted-foreground line-through">
                    {brl(p.price_cents)}
                  </div>
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
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur z-50 grid place-items-center p-4"
          onClick={() => setOpenPriceId(null)}
        >
          <div
            className="bg-background rounded-2xl border border-border/60 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Aplicar cupom (opcional)</h3>
              <button onClick={() => setOpenPriceId(null)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
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
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur z-50 overflow-y-auto p-4"
          onClick={() => setShowCheckout(null)}
        >
          <div
            className="max-w-2xl mx-auto bg-background rounded-2xl border border-border/60 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[oklch(0.68_0.20_245)]" /> Finalizar assinatura
              </h3>
              <button onClick={() => setShowCheckout(null)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
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
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "positive" | "warning" | "danger";
}) {
  const toneCls =
    tone === "positive"
      ? "text-[oklch(0.78_0.18_155)]"
      : tone === "warning"
        ? "text-amber-400"
        : "text-[oklch(0.78_0.16_25)]";
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <Icon className={`h-4 w-4 ${toneCls}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
