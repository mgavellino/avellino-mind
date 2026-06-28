
-- 1) depoimentos: require authentication for inserts
DROP POLICY IF EXISTS "Qualquer pessoa pode publicar depoimento" ON public.depoimentos;
CREATE POLICY "Authenticated users can submit testimonials"
ON public.depoimentos
FOR INSERT
TO authenticated
WITH CHECK (
  char_length(nome) BETWEEN 2 AND 60
  AND estrelas BETWEEN 1 AND 5
  AND char_length(comentario) BETWEEN 10 AND 500
);

-- 2) plans: hide stripe_price_id from anon/authenticated reads (column-level)
REVOKE SELECT (stripe_price_id) ON public.plans FROM anon, authenticated;

-- 3) Revoke EXECUTE on SECURITY DEFINER helpers that should only be called
-- from triggers / internal contexts, not directly by clients.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_founder() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_default_receivable_amount() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_appointment_email_reminder() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_receivable_for_completed_consultation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role and user_has_access are intentionally callable by authenticated
-- users because RLS policies reference them; keep their default grants.
