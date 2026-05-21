import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Crown, Gift, Search, Calendar, Plus, X, ShieldCheck, ShieldOff,
  Sparkles, Clock, CheckCircle2, AlertCircle, Infinity as InfinityIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/assinaturas")({
  component: AdminSubs,
});

type Profile = { id: string; full_name: string | null; created_at: string; specialty: string | null };
type Plan = { id: string; name: string; slug: string; interval: string };
type Sub = {
  id: string;
  user_id: string;
  status: string;
  plan_id: string | null;
  expires_at: string | null;
  created_at: string;
  gateway: string | null;
};

const PRESETS = [
  { key: "month",     label: "+1 mês",      days: 30,   slug: "mensal",      icon: Clock },
  { key: "quarter",   label: "+3 meses",    days: 90,   slug: "trimestral",  icon: Clock },
  { key: "year",      label: "+1 ano",      days: 365,  slug: "anual",       icon: Sparkles },
  { key: "lifetime",  label: "Vitalício",   days: null, slug: "vitalicio",   icon: InfinityIcon },
] as const;

function AdminSubs() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Record<string, Sub>>({});
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: u }, { data: p }, { data: s }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, created_at, specialty").order("created_at", { ascending: false }),
      supabase.from("plans").select("id, name, slug, interval").order("sort_order"),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin_master"),
    ]);
    setUsers((u as unknown as Profile[]) ?? []);
    setPlans((p as unknown as Plan[]) ?? []);
    const latest: Record<string, Sub> = {};
    for (const row of (s as unknown as Sub[]) ?? []) {
      if (!latest[row.user_id]) latest[row.user_id] = row;
    }
    setSubs(latest);
    setAdminIds(new Set(((r as unknown as { user_id: string }[]) ?? []).map((x) => x.user_id)));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => (u.full_name ?? "").toLowerCase().includes(q));
  }, [users, search]);

  const grantPreset = async (userId: string, preset: typeof PRESETS[number]) => {
    setBusy(true);
    const plan = plans.find((p) => p.slug === preset.slug) ?? plans.find((p) => p.slug === "mensal");
    if (!plan) { toast.error("Plano não encontrado"); setBusy(false); return; }
    const expires = preset.days === null ? null : new Date(Date.now() + preset.days * 86400_000).toISOString();
    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      starts_at: new Date().toISOString(),
      expires_at: expires,
      gateway: "manual",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${preset.label} concedido`);
    setOpenUserId(null);
    load();
  };

  const grantCustom = async (userId: string, planId: string, date: string | null) => {
    if (!planId) return toast.error("Selecione um plano");
    setBusy(true);
    const expires = date ? new Date(date).toISOString() : null;
    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: planId,
      status: "active",
      starts_at: new Date().toISOString(),
      expires_at: expires,
      gateway: "manual",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Plano personalizado concedido");
    setOpenUserId(null);
    load();
  };

  const extend = async (sub: Sub, days: number) => {
    const base = sub.expires_at ? new Date(sub.expires_at) : new Date();
    const next = new Date(Math.max(base.getTime(), Date.now()) + days * 86400_000);
    const { error } = await supabase.from("subscriptions").update({ expires_at: next.toISOString(), status: "active" }).eq("id", sub.id);
    if (error) return toast.error(error.message);
    toast.success(`+${days} dias adicionados`);
    load();
  };

  const cancel = async (subId: string) => {
    if (!confirm("Cancelar esta assinatura?")) return;
    const { error } = await supabase.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", subId);
    if (error) return toast.error(error.message);
    toast.success("Assinatura cancelada");
    load();
  };

  const toggleAdmin = async (userId: string) => {
    const isAdmin = adminIds.has(userId);
    if (isAdmin) {
      if (!confirm("Remover privilégios de admin master deste usuário?")) return;
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin_master");
      if (error) return toast.error(error.message);
      toast.success("Admin removido");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin_master" });
      if (error) return toast.error(error.message);
      toast.success("Promovido a admin master");
    }
    load();
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Assinaturas & Acessos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conceda planos, libere acesso vitalício e gerencie privilégios de admin com um clique.
          </p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar psicólogo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 h-10 pl-9 pr-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {filtered.map((u) => {
          const sub = subs[u.id];
          const plan = sub ? plans.find((p) => p.id === sub.plan_id) : undefined;
          const isAdmin = adminIds.has(u.id);
          const isOpen = openUserId === u.id;
          const isLifetime = sub?.status === "active" && !sub.expires_at && plan?.slug === "vitalicio";
          const daysLeft = sub?.expires_at
            ? Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400_000)
            : null;

          let badge: { text: string; cls: string; Icon: typeof CheckCircle2 } = {
            text: "Sem plano", cls: "bg-muted/40 text-muted-foreground border-border/40", Icon: AlertCircle,
          };
          if (isLifetime) badge = { text: "Vitalício", cls: "bg-[oklch(0.55_0.22_260)]/15 text-[oklch(0.82_0.16_250)] border-[oklch(0.55_0.22_260)]/40", Icon: InfinityIcon };
          else if (sub?.status === "active" && daysLeft !== null && daysLeft > 7) badge = { text: `Ativo · ${daysLeft}d`, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", Icon: CheckCircle2 };
          else if (sub?.status === "active" && daysLeft !== null && daysLeft > 0) badge = { text: `Expira em ${daysLeft}d`, cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", Icon: AlertCircle };
          else if (sub?.status === "trial") badge = { text: `Trial · ${daysLeft ?? 0}d`, cls: "bg-sky-500/15 text-sky-400 border-sky-500/30", Icon: Clock };
          else if (sub?.status === "cancelled") badge = { text: "Cancelado", cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: X };
          else if (sub && daysLeft !== null && daysLeft <= 0) badge = { text: "Expirado", cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: X };

          return (
            <div key={u.id} className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden transition-colors hover:border-border">
              <div className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[oklch(0.55_0.22_260)] to-[oklch(0.45_0.18_280)] flex items-center justify-center text-sm font-semibold shrink-0">
                  {(u.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{u.full_name ?? "Sem nome"}</span>
                    {isAdmin && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[oklch(0.55_0.22_260)]/20 text-[oklch(0.82_0.16_250)] border border-[oklch(0.55_0.22_260)]/40 inline-flex items-center gap-1">
                        <Crown className="h-2.5 w-2.5" /> Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{u.specialty ?? "Sem especialidade"}</span>
                    <span>·</span>
                    <span>{plan?.name ?? "Sem plano"}</span>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${badge.cls}`}>
                  <badge.Icon className="h-3 w-3" /> {badge.text}
                </span>
                <button
                  onClick={() => setOpenUserId(isOpen ? null : u.id)}
                  className="shrink-0 h-9 px-3 rounded-lg text-xs font-medium bg-foreground/10 hover:bg-foreground/15 border border-border/60 inline-flex items-center gap-1.5"
                >
                  <Plus className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-45" : ""}`} />
                  {isOpen ? "Fechar" : "Gerenciar"}
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-border/40 bg-surface/30 p-4 space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Concessão rápida</div>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.key}
                          disabled={busy}
                          onClick={() => grantPreset(u.id, preset)}
                          className={`h-9 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors disabled:opacity-50 ${
                            preset.key === "lifetime"
                              ? "bg-gradient-to-br from-[oklch(0.55_0.22_260)]/20 to-[oklch(0.45_0.18_280)]/20 border-[oklch(0.55_0.22_260)]/40 text-[oklch(0.86_0.14_260)] hover:from-[oklch(0.55_0.22_260)]/30 hover:to-[oklch(0.45_0.18_280)]/30"
                              : "bg-surface border-border/60 hover:bg-foreground/5"
                          }`}
                        >
                          {preset.key === "lifetime" ? <Gift className="h-3.5 w-3.5" /> : <preset.icon className="h-3.5 w-3.5" />}
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CustomGrant plans={plans} onGrant={(planId, date) => grantCustom(u.id, planId, date)} busy={busy} />

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                    {sub && sub.status === "active" && !isLifetime && (
                      <>
                        <button onClick={() => extend(sub, 30)} className="h-8 px-2.5 rounded-md text-xs border border-border/60 hover:bg-surface inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> +30 dias
                        </button>
                        <button onClick={() => extend(sub, 90)} className="h-8 px-2.5 rounded-md text-xs border border-border/60 hover:bg-surface inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> +90 dias
                        </button>
                      </>
                    )}
                    {sub && sub.status === "active" && (
                      <button onClick={() => cancel(sub.id)} className="h-8 px-2.5 rounded-md text-xs border border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex items-center gap-1">
                        <X className="h-3 w-3" /> Cancelar assinatura
                      </button>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => toggleAdmin(u.id)}
                      className={`h-8 px-2.5 rounded-md text-xs inline-flex items-center gap-1 border ${
                        isAdmin
                          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                          : "border-[oklch(0.55_0.22_260)]/40 text-[oklch(0.82_0.16_250)] hover:bg-[oklch(0.55_0.22_260)]/10"
                      }`}
                    >
                      {isAdmin ? <><ShieldOff className="h-3 w-3" /> Remover admin</> : <><ShieldCheck className="h-3 w-3" /> Tornar admin master</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/40 py-16 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

function CustomGrant({ plans, onGrant, busy }: { plans: Plan[]; onGrant: (planId: string, date: string | null) => void; busy: boolean }) {
  const [planId, setPlanId] = useState("");
  const [date, setDate] = useState("");
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Personalizado</div>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="h-9 px-2.5 rounded-lg bg-surface border border-border/60 text-xs min-w-[160px]"
        >
          <option value="">Selecione um plano</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 px-2.5 rounded-lg bg-surface border border-border/60 text-xs"
        />
        <button
          disabled={busy || !planId}
          onClick={() => onGrant(planId, date || null)}
          className="h-9 px-3 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Conceder
        </button>
        <span className="text-[11px] text-muted-foreground">Deixe a data em branco para acesso sem data de expiração.</span>
      </div>
    </div>
  );
}
