import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/assinaturas")({
  component: AdminSubs,
});

type Profile = { id: string; full_name: string | null; created_at: string };
type Plan = { id: string; name: string; slug: string; interval: string };
type Sub = {
  id: string;
  user_id: string;
  status: string;
  plan_id: string | null;
  expires_at: string | null;
};

function AdminSubs() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Record<string, Sub>>({});
  const [pendingPlan, setPendingPlan] = useState<Record<string, string>>({});
  const [pendingExpires, setPendingExpires] = useState<Record<string, string>>({});

  const load = async () => {
    const [{ data: u }, { data: p }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
      supabase.from("plans").select("id, name, slug, interval").order("sort_order"),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    ]);
    setUsers((u as unknown as Profile[]) ?? []);
    setPlans((p as unknown as Plan[]) ?? []);
    const latest: Record<string, Sub> = {};
    for (const row of (s as unknown as Sub[]) ?? []) {
      if (!latest[row.user_id]) latest[row.user_id] = row;
    }
    setSubs(latest);
  };
  useEffect(() => { load(); }, []);

  const grant = async (userId: string, lifetime: boolean) => {
    const planId = pendingPlan[userId];
    if (!planId && !lifetime) return toast.error("Selecione um plano");
    const expires = lifetime ? null : pendingExpires[userId] ? new Date(pendingExpires[userId]).toISOString() : null;
    const finalPlanId = lifetime
      ? plans.find((p) => p.slug === "vitalicio")?.id ?? planId
      : planId;

    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: finalPlanId,
      status: "active",
      starts_at: new Date().toISOString(),
      expires_at: expires,
      gateway: "manual",
    });
    if (error) return toast.error(error.message);
    toast.success(lifetime ? "Acesso vitalício concedido" : "Plano concedido");
    load();
  };

  const cancel = async (subId: string) => {
    await supabase.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", subId);
    toast.success("Assinatura cancelada");
    load();
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-semibold tracking-tight">Assinaturas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conceda planos manualmente, libere acesso vitalício ou cancele assinaturas.
      </p>

      <div className="mt-6 rounded-2xl border border-border/60 bg-surface/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Usuário</th>
              <th className="text-left px-4 py-3">Plano atual</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Conceder plano</th>
              <th className="text-left px-4 py-3">Vence em</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const sub = subs[u.id];
              const planName = sub ? plans.find((p) => p.id === sub.plan_id)?.name ?? "—" : "Sem plano";
              return (
                <tr key={u.id} className="border-t border-border/40 align-middle">
                  <td className="px-4 py-3 font-medium">{u.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{planName}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      {sub?.status ?? "—"}
                      {sub?.expires_at && ` · até ${new Date(sub.expires_at).toLocaleDateString("pt-BR")}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={pendingPlan[u.id] ?? ""}
                      onChange={(e) => setPendingPlan({ ...pendingPlan, [u.id]: e.target.value })}
                      className="h-8 px-2 rounded-md bg-surface border border-border/60 text-xs"
                    >
                      <option value="">Selecione</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={pendingExpires[u.id] ?? ""}
                      onChange={(e) => setPendingExpires({ ...pendingExpires, [u.id]: e.target.value })}
                      className="h-8 px-2 rounded-md bg-surface border border-border/60 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => grant(u.id, false)} className="text-xs px-2 py-1 rounded-md border border-border/60 hover:bg-surface">
                      Conceder
                    </button>
                    <button onClick={() => grant(u.id, true)} className="text-xs px-2 py-1 rounded-md border border-[oklch(0.55_0.22_260)]/40 bg-[oklch(0.55_0.22_260)]/10 text-[oklch(0.82_0.16_250)] hover:bg-[oklch(0.55_0.22_260)]/20 inline-flex items-center gap-1">
                      <Gift className="h-3 w-3" /> Vitalício
                    </button>
                    {sub && sub.status === "active" && (
                      <button onClick={() => cancel(sub.id)} className="text-xs px-2 py-1 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10">
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">Nenhum usuário.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
