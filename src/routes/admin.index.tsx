import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Calendar, FileText, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0,
    patients: 0,
    appointments: 0,
    revenueCents: 0,
  });

  useEffect(() => {
    (async () => {
      const [users, pat, appt, paid] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("appointment_receivables").select("amount_cents").eq("status", "paid"),
      ]);
      const revenue = (paid.data ?? []).reduce(
        (s, p: { amount_cents: number }) => s + (p.amount_cents ?? 0),
        0,
      );
      setStats({
        users: users.count ?? 0,
        patients: pat.count ?? 0,
        appointments: appt.count ?? 0,
        revenueCents: revenue,
      });
    })();
  }, []);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold tracking-tight">Visão geral</h1>
      <p className="mt-1 text-sm text-muted-foreground">Métricas internas do consultório.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Usuários" value={String(stats.users)} />
        <StatCard icon={Users} label="Pacientes" value={String(stats.patients)} />
        <StatCard icon={Calendar} label="Consultas" value={String(stats.appointments)} />
        <StatCard
          icon={DollarSign}
          label="Recebido (total)"
          value={(stats.revenueCents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4 text-brand" />
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-2">{value}</div>
    </div>
  );
}
