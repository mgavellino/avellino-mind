import { useEffect, useState } from "react";
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
  status?: "trial" | "active" | "cancelled" | "expired" | "none";
  expires_at?: string | null;
  trial_days_left?: number;
};

export function usePlan() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PlanLimits>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .rpc("get_user_plan_limits", { _uid: user.id })
      .then(({ data }) => {
        setLimits((data as PlanLimits) ?? {});
        setLoading(false);
      });
  }, [user]);

  const can = (cap: keyof NonNullable<PlanLimits["capabilities"]>) => {
    // Trial users get all features
    if (limits.status === "trial") return true;
    return Boolean(limits.capabilities?.[cap]);
  };

  return { limits, loading, can };
}
