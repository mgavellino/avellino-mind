import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { usePlan } from "@/hooks/use-plan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nav = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/agenda", icon: Calendar, label: "Agenda" },
  { to: "/app/pacientes", icon: Users, label: "Pacientes" },
  { to: "/app/prontuarios", icon: FileText, label: "Prontuários" },
  { to: "/app/financeiro", icon: CreditCard, label: "Financeiro" },
  { to: "/app/configuracoes", icon: Settings, label: "Configurações" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { limits } = usePlan();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null));
  }, [user]);

  const initial = (user?.user_metadata?.full_name || user?.email || "U")
    .toString()
    .charAt(0)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/" });
  };

  const planBadge =
    limits.status === "trial"
      ? `Teste · ${limits.trial_days_left ?? 0}d`
      : limits.status === "lifetime"
        ? `${limits.plan_name ?? "Vitalício"} ∞`
        : limits.plan_name ?? "Sem plano";
  const showUpgrade =
    limits.status === "trial" || limits.status === "past_due" || !limits.has_access;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/60 bg-surface/40">
        <div className="p-5">
          <Logo />
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {nav.map((item) => {
            const active =
              item.to === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-surface-elevated text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className="mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border border-[oklch(0.55_0.22_260)]/40 bg-[oklch(0.55_0.22_260)]/10 text-[oklch(0.82_0.16_250)] hover:bg-[oklch(0.55_0.22_260)]/20 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Master
            </Link>
          )}
        </nav>
        <div className="p-3 border-t border-border/60 space-y-2">
          <div className="px-3 py-2 rounded-lg bg-surface/60 border border-border/50">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Plano</div>
            <div className="text-xs font-medium mt-0.5">{planBadge}</div>
            {showUpgrade && (
              <Link
                to="/app/financeiro"
                className="mt-2 block text-center text-[11px] rounded-md py-1 bg-gradient-brand text-white"
              >
                Assinar
              </Link>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border/60 flex items-center px-4 md:px-6 gap-3 bg-background/80 backdrop-blur sticky top-0 z-30">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar pacientes, consultas..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface border border-border/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <button className="h-9 w-9 grid place-items-center rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <Link
            to="/app/configuracoes"
            className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-sm font-medium text-white overflow-hidden"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="flex items-stretch justify-around h-16 px-1 pb-[env(safe-area-inset-bottom)]">
          {nav.map((item) => {
            const active =
              item.to === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] rounded-lg transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-[oklch(0.78_0.16_250)]" : ""}`} />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
