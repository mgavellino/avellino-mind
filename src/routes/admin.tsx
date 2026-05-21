import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, DollarSign, Megaphone, Users, LayoutDashboard, ArrowLeft, Ticket, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin", icon: LayoutDashboard, label: "Visão geral" },
  { to: "/admin/precos", icon: DollarSign, label: "Preços e planos" },
  { to: "/admin/promo", icon: Megaphone, label: "Banner promo" },
  { to: "/admin/cupons", icon: Ticket, label: "Cupons" },
  { to: "/admin/assinaturas", icon: Crown, label: "Assinaturas" },
  { to: "/admin/usuarios", icon: Users, label: "Usuários" },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: "/admin" } });
    } else if (!adminLoading && user && !isAdmin) {
      navigate({ to: "/app" });
    }
  }, [user, loading, isAdmin, adminLoading, navigate]);

  if (loading || adminLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-[oklch(0.18_0.04_260)]/40">
        <div className="p-5 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[oklch(0.78_0.16_250)]" />
          <div>
            <div className="text-sm font-semibold tracking-tight">Admin Master</div>
            <div className="text-[10px] text-muted-foreground">AvellPsy · Fundador</div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {adminNav.map((item) => {
            const active =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[oklch(0.55_0.22_260)]/20 text-foreground border border-[oklch(0.55_0.22_260)]/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <Link
            to="/app"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </Link>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-2 px-4 h-14 border-b border-border/60 bg-background/95 backdrop-blur">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[oklch(0.78_0.16_250)]" />
            <span className="text-sm font-semibold">Admin</span>
          </div>
          <div className="w-[72px]" />
        </div>
        <nav className="md:hidden flex gap-1.5 overflow-x-auto px-4 py-2 border-b border-border/40 bg-surface/30">
          {adminNav.map((item) => {
            const active =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs transition-colors border ${
                  active
                    ? "bg-[oklch(0.55_0.22_260)]/20 text-foreground border-[oklch(0.55_0.22_260)]/40"
                    : "text-muted-foreground border-border/60 hover:text-foreground hover:bg-surface"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1 p-4 md:p-10 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
