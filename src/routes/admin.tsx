import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck, DollarSign, Megaphone, Users, LayoutDashboard, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin", icon: LayoutDashboard, label: "Visão geral" },
  { to: "/admin/precos", icon: DollarSign, label: "Preços e planos" },
  { to: "/admin/promo", icon: Megaphone, label: "Banner promo" },
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
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
