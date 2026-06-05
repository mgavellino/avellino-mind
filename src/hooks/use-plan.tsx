// Private app — no plans/subscriptions. Kept as a no-op stub so any
// remaining import keeps compiling without behavioural changes.
export type PlanLimits = {
  plan_slug?: string;
  plan_name?: string;
  max_patients?: number | null;
  capabilities?: Record<string, boolean>;
  status?: "lifetime";
  has_access?: boolean;
  trial_days_left?: number;
};

export function usePlan() {
  const limits: PlanLimits = {
    status: "lifetime",
    plan_name: "Acesso completo",
    has_access: true,
    capabilities: { export: true, multi_prof: true, admin_clinic: true },
  };
  return {
    limits,
    loading: false,
    hasAccess: true,
    can: (_cap?: string) => true,
    refresh: () => {},
  };
}
