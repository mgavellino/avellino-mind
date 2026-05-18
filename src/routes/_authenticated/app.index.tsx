import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Users, DollarSign, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

const stats = [
  { label: "Pacientes ativos", value: "0", icon: Users, hint: "+0 este mês" },
  { label: "Consultas hoje", value: "0", icon: Calendar, hint: "Próximas 24h" },
  { label: "Faturamento (mês)", value: "R$ 0", icon: DollarSign, hint: "+0%" },
  { label: "Crescimento", value: "+0%", icon: TrendingUp, hint: "vs mês anterior" },
];

function Dashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "").toString();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Bem-vindo{name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aqui está um resumo da sua clínica hoje.
        </p>
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
          <h2 className="text-sm font-medium text-muted-foreground">Próximas consultas</h2>
          <div className="mt-6 text-center text-muted-foreground text-sm py-12">
            Nenhuma consulta agendada. Em breve você poderá criar uma na aba Agenda.
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-surface/40 p-6 min-h-64">
          <h2 className="text-sm font-medium text-muted-foreground">Atividade recente</h2>
          <div className="mt-6 text-center text-muted-foreground text-sm py-12">
            Sem atividade ainda.
          </div>
        </div>
      </div>
    </div>
  );
}
