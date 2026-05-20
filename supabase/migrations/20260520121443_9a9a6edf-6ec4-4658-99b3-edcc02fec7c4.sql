CREATE OR REPLACE FUNCTION public.get_user_plan_limits(_uid uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'plan_slug', p.slug,
      'plan_name', p.name,
      'max_patients', p.max_patients,
      'capabilities', p.capabilities,
      'status', s.status::text,
      'expires_at', s.expires_at,
      'trial_days_left', GREATEST(0, EXTRACT(DAY FROM (s.expires_at - now()))::int)
    ),
    jsonb_build_object('status','none','capabilities','{}'::jsonb)
  )
  FROM public.subscriptions s
  LEFT JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _uid
  ORDER BY s.created_at DESC
  LIMIT 1
$$;