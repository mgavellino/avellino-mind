REVOKE ALL ON FUNCTION public.create_receivable_for_completed_consultation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.schedule_appointment_email_reminder() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.promote_founder() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;