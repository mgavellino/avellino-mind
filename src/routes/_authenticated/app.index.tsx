import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Users, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

type UpcomingAppointment = {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  patient_id: string;
  patients: { full_name: string } | null;
};

function Dashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "").toString();

  const [activePatients, setActivePatients] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [monthRevenueCents, setMonthRevenueCents] = useState(0);
  const [prevRevenueCents, setPrevRevenueCents] = useState(0);
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const inOneWeek = new Date(today);
    inOneWeek.setDate(inOneWeek.getDate() + 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    Promise.all([
      supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("starts_at", today.toISOString())
        .lt("starts_at", tomorrow.toISOString()),
      supabase
        .from("appointments")
        .select("id, title, starts_at, ends_at, patient_id, patients(full_name)")
        .gte("starts_at", new Date().toISOString())
        .lt("starts_at", inOneWeek.toISOString())
        .order("starts_at")
        .limit(5),
      supabase
        .from("appointment_receivables")
        .select("amount_cents,paid_at")
        .eq("status", "paid")
        .gte("paid_at", prevMonthStart.toISOString())
        .lt("paid_at", nextMonthStart.toISOString()),
    ]).then(([pat, today, upc, recs]) => {
      setActivePatients(pat.count ?? 0);
      setTodayCount(today.count ?? 0);
      setUpcoming((upc.data ?? []) as UpcomingAppointment[]);
      const list = (recs.data ?? []) as { amount_cents: number; paid_at: string }[];
      let cur = 0,
        prev = 0;
      for (const r of list) {
        const d = new Date(r.paid_at);
        if (d >= monthStart) cur += r.amount_cents ?? 0;
        else prev += r.amount_cents ?? 0;
      }
      setMonthRevenueCents(cur);
      setPrevRevenueCents(prev);
      setLoading(false);
    });
  }, [user]);

  const brl = (c: number) =>
    (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const growth =
    prevRevenueCents > 0
      ? Math.round(((monthRevenueCents - prevRevenueCents) / prevRevenueCents) * 100)
      : null;

  const stats = [
    {
      label: "Pacientes ativos",
      value: String(activePatients),
      icon: Users,
      hint: "Em acompanhamento",
    },
    {
      label: "Consultas hoje",
      value: String(todayCount),
      icon: Calendar,
      hint: "Próximas 24h",
    },
    {
      label: "Faturamento (mês)",
      value: brl(monthRevenueCents),
      icon: DollarSign,
      hint: monthRevenueCents > 0 ? "Recebido no mês" : "Sem recebimentos ainda",
    },
    {
      label: "Crescimento",
      value: growth === null ? "—" : `${growth >= 0 ? "+" : ""}${growth}%`,
      icon: TrendingUp,
      hint: "vs mês anterior",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Bem-vindo{name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-1 text-muted-foreground">Aqui está um resumo da sua clínica hoje.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border/60 bg-surface/40 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <s.icon className="h-4 w-4 text-[oklch(0.68_0.20_245)]" />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-surface/40 p-6 min-h-64">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Próximas consultas
            </h2>
            <Link
              to="/app/agenda"
              className="inline-flex items-center gap-1 text-xs text-[oklch(0.68_0.20_245)] hover:underline"
            >
              Ver agenda <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-5 space-y-2">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Carregando...
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Nenhuma consulta nos próximos 7 dias.
              </div>
            ) : (
              upcoming.map((a) => {
                const start = parseISO(a.starts_at);
                return (
                  <Link
                    key={a.id}
                    to="/app/agenda"
                    className="flex items-center gap-4 rounded-xl border border-border/40 bg-background/40 px-4 py-3 hover:bg-surface transition-colors"
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
                      <div className="text-sm font-medium truncate">
                        {a.patients?.full_name ?? a.title ?? "Consulta"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(start, "EEEE · HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {a.title ?? "Sessão"}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface/40 p-6 min-h-64">
          <h2 className="text-sm font-medium text-muted-foreground">Ações rápidas</h2>
          <div className="mt-5 grid gap-2">
            <Link
              to="/app/pacientes"
              className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-4 py-3 hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated grid place-items-center">
                  <Users className="h-4 w-4 text-[oklch(0.68_0.20_245)]" />
                </div>
                <div>
                  <div className="text-sm font-medium">Novo paciente</div>
                  <div className="text-xs text-muted-foreground">Cadastrar prontuário</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              to="/app/agenda"
              className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-4 py-3 hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated grid place-items-center">
                  <Calendar className="h-4 w-4 text-[oklch(0.68_0.20_245)]" />
                </div>
                <div>
                  <div className="text-sm font-medium">Agendar consulta</div>
                  <div className="text-xs text-muted-foreground">Bloquear horário</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
