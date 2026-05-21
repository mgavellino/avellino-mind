import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { useIsAdmin } from "@/hooks/use-role";
import { AppShell } from "@/components/app/AppShell";
import { TrialExpiredScreen } from "@/components/app/TrialExpiredScreen";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const { limits, loading: planLoading } = usePlan();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: window.location.pathname } });
    }
  }, [user, loading, navigate]);

  if (loading || (user && planLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Hard block when trial expired / no active sub. Admins always pass.
  // Allow /app/billing-style paths so user can self-serve (here: financeiro contains plans UI).
  const accessExempt = isAdmin || location.pathname.startsWith("/app/financeiro");
  if (!accessExempt && limits.has_access === false) {
    return <TrialExpiredScreen />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
