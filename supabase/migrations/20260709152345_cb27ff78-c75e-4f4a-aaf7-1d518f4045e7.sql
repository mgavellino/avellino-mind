
-- 1) Re-scope owner-only policies from PUBLIC to AUTHENTICATED
DROP POLICY IF EXISTS "books_owner_all" ON public.books;
CREATE POLICY "books_owner_all" ON public.books
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "own psychoed" ON public.psychoeducation_resources;
CREATE POLICY "own psychoed" ON public.psychoeducation_resources
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner manages own notes" ON public.quick_notes;
CREATE POLICY "Owner manages own notes" ON public.quick_notes
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "own recurring_blocks" ON public.recurring_blocks;
CREATE POLICY "own recurring_blocks" ON public.recurring_blocks
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "own referrals" ON public.referrals;
CREATE POLICY "own referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "own waiting_list" ON public.waiting_list;
CREATE POLICY "own waiting_list" ON public.waiting_list
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 2) Hide stripe_price_id from anonymous users on plans
REVOKE SELECT (stripe_price_id) ON public.plans FROM anon;

-- 3) Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated.
-- These are trigger/helper functions invoked by the database itself or via RLS,
-- not callable by clients through the Data API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_founder() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_default_receivable_amount() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_appointment_email_reminder() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_receivable_for_completed_consultation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_audit_log() FROM PUBLIC, anon, authenticated;

-- has_role and user_has_access are used inside RLS policies and must remain
-- callable by authenticated users; block anon only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.user_has_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_access(uuid, text) TO authenticated;
