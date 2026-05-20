import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, DollarSign, Activity, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState({
    psychologists: 0,
    activeSubs: 0,
    trials: 0,
    revenueCents: 0,
  });

  useEffect(() => {
    (async () => {
      const [psy, active, trial, paid] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "trial"),
        supabase.from("payments").select("amount_cents").eq("status", "completed"),
      ]);
      const revenue = (paid.data ?? []).reduce(
        (s, p: { amount_cents: number }) => s + (p.amount_cents ?? 0),
        0,
      );
      setStats({
        psychologists: psy.count ?? 0,
        activeSubs: active.count ?? 0,
        trials: trial.count ?? 0,
        revenueCents: revenue,
      });
    })();
  }, []);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold tracking-tight">Visão geral</h1>
      <p className="mt-1 text-sm text-muted-foreground">Métricas em tempo real da plataforma.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Psicólogos cadastrados" value={String(stats.psychologists)} />
        <StatCard icon={Sparkles} label="Em trial" value={String(stats.trials)} />
        <StatCard icon={Activity} label="Assinaturas ativas" value={String(stats.activeSubs)} />
        <StatCard
          icon={DollarSign}
          label="Receita acumulada"
          value={(stats.revenueCents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        />
      </div>

      <div className="mt-10 rounded-2xl border border-border/60 bg-surface/40 p-6">
        <h2 className="text-base font-semibold">Próximos passos</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Configure preços e planos em <strong className="text-foreground">Preços e planos</strong>.</li>
          <li>• Edite o banner de promoção em <strong className="text-foreground">Banner promo</strong>.</li>
          <li>• Gerencie psicólogos cadastrados em <strong className="text-foreground">Usuários</strong>.</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
