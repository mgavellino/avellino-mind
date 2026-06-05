import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, DollarSign, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/app/financeiro")({
  component: FinanceiroPage,
});

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
  pending: { label: "A receber", cls: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  paid: { label: "Recebido", cls: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
  overdue: { label: "Atrasado", cls: "text-red-600 bg-red-500/10 border-red-500/30" },
  waived: { label: "Isento", cls: "text-muted-foreground bg-surface border-border/60" },
};

function FinanceiroPage() {
  const { user } = useAuth();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [appts, setAppts] = useState<Record<string, AppointmentLite>>({});
  const [patients, setPatients] = useState<Record<string, PatientLite>>({});
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [defaultPrice, setDefaultPrice] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("default_session_price_cents")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const v = (data as { default_session_price_cents?: number } | null)
          ?.default_session_price_cents;
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
    toast.success("Atualizado");
    loadReceivables();
  };

  const markPaid = (r: Receivable, method: string) =>
    updateReceivable(r.id, {
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: method,
    });

  const setAmount = (r: Receivable, value: string) => {
    const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
    if (Number.isNaN(cents) || cents < 0) return;
    updateReceivable(r.id, { amount_cents: cents });
  };

  const saveDefaultPrice = async () => {
    if (!user) return;
    const cents = Math.round(parseFloat(defaultPrice.replace(",", ".")) * 100);
    if (Number.isNaN(cents) || cents < 0) return toast.error("Valor inválido");
    const { error } = await supabase
      .from("profiles")
      .update({ default_session_price_cents: cents })
      .eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Valor padrão salvo");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receba pelas consultas concluídas e acompanhe o mês.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <StatCard label="Recebido (mês)" value={brl(stats.received)} tone="emerald" />
        <StatCard label="A receber" value={brl(stats.pending)} tone="amber" />
        <StatCard label="Atrasado" value={brl(stats.overdue)} tone="red" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold">Valor padrão da consulta</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Aplicado automaticamente em novos recebíveis.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">R$</span>
          <input
            inputMode="decimal"
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(e.target.value)}
            placeholder="200,00"
            className="h-10 w-32 px-3 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <button
            onClick={saveDefaultPrice}
            className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {(["all", "pending", "paid", "overdue", "waived"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 h-8 rounded-full text-xs whitespace-nowrap border transition-colors ${
              filter === s
                ? "bg-foreground text-background border-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "Todos" : STATUS_META[s].label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum recebível por aqui.
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filtered.map((r) => {
              const ap = appts[r.appointment_id];
              const patient = r.patient_id ? patients[r.patient_id] : undefined;
              const meta = STATUS_META[r.status];
              return (
                <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {patient?.full_name ?? "Sem paciente"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {ap
                        ? format(parseISO(ap.starts_at), "dd 'de' MMM, HH:mm", { locale: ptBR })
                        : "Consulta"}
                      {r.payment_method ? ` · ${r.payment_method}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <input
                      inputMode="decimal"
                      defaultValue={(r.amount_cents / 100).toFixed(2).replace(".", ",")}
                      onBlur={(e) => {
                        const cents = Math.round(parseFloat(e.target.value.replace(",", ".")) * 100);
                        if (!Number.isNaN(cents) && cents !== r.amount_cents) setAmount(r, e.target.value);
                      }}
                      className="h-9 w-24 px-2 rounded-lg bg-background border border-border/60 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                    <span className={`text-[11px] px-2 py-1 rounded-full border ${meta.cls}`}>
                      {meta.label}
                    </span>
                    {r.status !== "paid" && (
                      <>
                        <button
                          onClick={() => markPaid(r, "pix")}
                          className="h-9 px-3 rounded-lg text-xs bg-emerald-600 text-white hover:opacity-90"
                          title="Marcar como recebido (PIX)"
                        >
                          PIX
                        </button>
                        <button
                          onClick={() => markPaid(r, "dinheiro")}
                          className="h-9 px-3 rounded-lg text-xs border border-border/60 hover:bg-surface"
                        >
                          $
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "red";
}) {
  const tones = {
    emerald: { icon: CheckCircle2, cls: "text-emerald-600" },
    amber: { icon: Clock, cls: "text-amber-600" },
    red: { icon: DollarSign, cls: "text-red-600" },
  } as const;
  const { icon: Icon, cls } = tones[tone];
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-4 w-4 ${cls}`} />
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-2">{value}</div>
    </div>
  );
}
