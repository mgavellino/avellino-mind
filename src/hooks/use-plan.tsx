import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PlanLimits = {
  plan_slug?: "mensal" | "trimestral" | "anual" | "vitalicio";
  plan_name?: string;
  max_patients?: number | null;
  capabilities?: {
    export?: boolean;
    multi_prof?: boolean;
    admin_clinic?: boolean;
  };
  status?: "trial" | "active" | "cancelled" | "expired" | "past_due" | "lifetime" | "none";
  expires_at?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  stripe_customer_id?: string | null;
  has_access?: boolean;
  trial_days_left?: number;
};

export function usePlan() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PlanLimits>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .rpc("get_user_plan_limits", { _uid: user.id })
      .then(({ data }) => {
        setLimits((data as PlanLimits) ?? {});
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for subscription changes (e.g. after webhook fires)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`sub-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const can = (cap: keyof NonNullable<PlanLimits["capabilities"]>) => {
    if (!limits.has_access) return false;
    if (limits.status === "trial") return true;
    return Boolean(limits.capabilities?.[cap]);
  };

  const hasAccess = limits.has_access ?? false;

  return { limits, loading, can, hasAccess, refresh };
}
