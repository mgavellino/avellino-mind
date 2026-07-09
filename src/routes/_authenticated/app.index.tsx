import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Users, DollarSign, TrendingUp, ArrowRight, Wallet, StickyNote, Cake, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { QuickNotes } from "@/components/app/QuickNotes";
import { BirthdaysCard } from "@/components/app/BirthdaysCard";
import { InactivePatientsCard } from "@/components/app/InactivePatientsCard";
import { PendingReceivablesCard } from "@/components/app/PendingReceivablesCard";
import { OnboardingDialog } from "@/components/app/OnboardingDialog";
import { BirthdayReminderBanner } from "@/components/app/BirthdayReminderBanner";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

type UpcomingAppointment = {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  patient_id: string | null;
  status: string;
  kind: string;
};

function Dashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "").toString();

  const [activePatients, setActivePatients] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [monthRevenueCents, setMonthRevenueCents] = useState(0);
  const [monthExpensesCents, setMonthExpensesCents] = useState(0);
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inTwoWeeks = new Date(todayStart);
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("starts_at", todayStart.toISOString())
        .lt("starts_at", tomorrow.toISOString()),
      supabase
        .from("appointments")
        .select("id, title, starts_at, ends_at, patient_id, status, kind")
        .gte("starts_at", now.toISOString())
        .lt("starts_at", inTwoWeeks.toISOString())
        .neq("status", "cancelled")
        .order("starts_at")
        .limit(6),
      supabase
        .from("appointment_receivables")
        .select("amount_cents")
        .eq("status", "paid")
        .gte("paid_at", monthStart)
        .lt("paid_at", nextMonthStart),
      supabase
        .from("expenses")
        .select("amount_cents")
        .gte("paid_at", monthStart)
        .lt("paid_at", nextMonthStart),
    ]).then(async ([pat, today, upc, recs, exps]) => {
      setActivePatients(pat.count ?? 0);
      setTodayCount(today.count ?? 0);
      const upcList = (upc.data ?? []) as UpcomingAppointment[];
      setUpcoming(upcList);

      const patIds = Array.from(new Set(upcList.map((a) => a.patient_id).filter(Boolean) as string[]));
      if (patIds.length) {
        const { data: ps } = await supabase.from("patients").select("id, full_name").in("id", patIds);
        const map: Record<string, string> = {};
        for (const p of (ps ?? []) as { id: string; full_name: string }[]) map[p.id] = p.full_name;
        setPatientNames(map);
      }

      const sum = (rows: { amount_cents: number }[] | null) =>
        (rows ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      setMonthRevenueCents(sum(recs.data as { amount_cents: number }[]));
      setMonthExpensesCents(sum(exps.data as { amount_cents: number }[]));
      setLoading(false);
    });
  }, [user]);

  const brl = (c: number) =>
    (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const profit = monthRevenueCents - monthExpensesCents;

  const stats = [
    { label: "Pacientes ativos", value: String(activePatients), icon: Users, hint: "Em acompanhamento" },
    { label: "Hoje", value: String(todayCount), icon: Calendar, hint: "Consultas" },
    { label: "Recebido (mês)", value: brl(monthRevenueCents), icon: DollarSign, hint: "Pagas no mês" },
    {
      label: "Lucro (mês)",
      value: brl(profit),
      icon: TrendingUp,
      hint: `Despesas ${brl(monthExpensesCents)}`,
      highlight: true,
    },
  ];

  return (
    <>
      <OnboardingDialog />
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Bem-vinda{name ? `, ${name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumo do consultório hoje.</p>
        </div>

        <BirthdayReminderBanner />

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">

          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border p-4 md:p-5 ${s.highlight ? "border-brand/40 bg-brand/5" : "border-border/60 bg-surface/40"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="h-4 w-4 text-brand" />
              </div>
              <div className="mt-2 md:mt-3 text-xl md:text-3xl font-semibold tracking-tight">
                {s.value}
              </div>
              <div className="mt-1 text-[10px] md:text-xs text-muted-foreground">{s.hint}</div>
            </div>
          ))}
        </div>

        {/* Próximas consultas + A receber */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-surface/40 p-5 md:p-6 min-h-64">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand" />
                <h2 className="text-sm font-medium">Próximas consultas</h2>
              </div>
              <Link to="/app/agenda" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                Ver agenda <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-5 space-y-2">
              {loading ? (
                <div className="text-center text-sm text-muted-foreground py-8">Carregando...</div>
              ) : upcoming.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma consulta nos próximos 14 dias.
                </div>
              ) : (
                upcoming.map((a) => {
                  const start = parseISO(a.starts_at);
                  const headline =
                    (a.patient_id && patientNames[a.patient_id]) || a.title || "Compromisso";
                  return (
                    <Link
                      key={a.id}
                      to="/app/agenda"
                      className="flex items-center gap-3 md:gap-4 rounded-xl border border-border/40 bg-background/40 px-3 md:px-4 py-2.5 md:py-3 hover:bg-surface transition-colors"
                    >
                      <div className="text-center shrink-0 w-12">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {format(start, "MMM", { locale: ptBR })}
                        </div>
                        <div className="text-lg font-semibold leading-none mt-0.5">
                          {format(start, "dd")}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{headline}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {format(start, "EEEE · HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <PendingReceivablesCard />
        </div>

        {/* Lembretes — bloco próprio */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <StickyNote className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold tracking-tight">Bloco de notas</h2>
          </div>
          <QuickNotes />
        </section>

        {/* Aniversariantes + Inativos */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Cake className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold tracking-tight">Pacientes em foco</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BirthdaysCard />
            <InactivePatientsCard />
          </div>
        </section>

        {/* Atalhos */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Zap className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold tracking-tight">Atalhos</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Quick to="/app/pacientes" icon={Users} title="Pacientes" hint="Cadastros e prontuário" />
            <Quick to="/app/agenda" icon={Calendar} title="Agendar" hint="Bloquear horário" />
            <Quick to="/app/financeiro" icon={Wallet} title="Financeiro" hint="Receber e despesas" />
          </div>
        </section>

      </div>
    </>
  );
}

function Quick({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: string;
  icon: typeof Users;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-4 py-3 hover:bg-surface transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-surface-elevated grid place-items-center">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
