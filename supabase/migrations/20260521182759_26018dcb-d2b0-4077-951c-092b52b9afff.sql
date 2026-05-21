
-- 1) Add past_due to status enum
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'past_due';

-- 2) Cleanup duplicate inactive plans with legacy slugs
DELETE FROM public.plans
WHERE is_active = false
  AND slug IN ('monthly','quarterly','yearly','lifetime');

-- 3) Access check function (single source of truth)
CREATE OR REPLACE FUNCTION public.user_has_access(_uid uuid, _env text DEFAULT 'sandbox')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _uid
      AND s.environment = _env
      AND (
        -- Active recurring with future period end
        (s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now()))
        -- Lifetime (one-time payment)
        OR s.status = 'lifetime'
        -- Trial that hasn't expired
        OR (s.status = 'trial' AND s.expires_at > now())
        -- Cancelled but grace period (continues until period end)
        OR (s.status = 'cancelled' AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
      )
  );
$$;

-- 4) Update get_user_plan_limits to expose is_active flag
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(_uid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'plan_slug', p.slug,
      'plan_name', p.name,
      'max_patients', p.max_patients,
      'capabilities', p.capabilities,
      'status', s.status::text,
      'expires_at', s.expires_at,
      'current_period_end', s.current_period_end,
      'cancel_at_period_end', s.cancel_at_period_end,
      'stripe_customer_id', s.stripe_customer_id,
      'has_access', public.user_has_access(_uid, s.environment),
      'trial_days_left', GREATEST(0, EXTRACT(DAY FROM (s.expires_at - now()))::int)
    ),
    jsonb_build_object('status','none','capabilities','{}'::jsonb,'has_access', false)
  )
  FROM public.subscriptions s
  LEFT JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _uid
  ORDER BY s.created_at DESC
  LIMIT 1
$$;
