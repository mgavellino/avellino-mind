
-- Tighten audit_logs INSERT: force user_id = auth.uid(), no NULL
DROP POLICY IF EXISTS "Authenticated insert audit" ON public.audit_logs;
CREATE POLICY "Authenticated insert audit"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Validation trigger: whitelist actions and cap metadata size
CREATE OR REPLACE FUNCTION public.validate_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'audit_logs: user_id must equal auth.uid()';
  END IF;

  IF NEW.action IS NULL OR length(NEW.action) > 64 THEN
    RAISE EXCEPTION 'audit_logs: invalid action';
  END IF;

  IF NEW.action NOT IN (
    'login','logout','password_reset','profile_update',
    'patient_create','patient_update','patient_delete',
    'appointment_create','appointment_update','appointment_delete',
    'record_create','record_update','record_delete','record_export',
    'receivable_update','expense_create','expense_delete',
    'document_upload','document_delete','export_data','settings_update'
  ) THEN
    RAISE EXCEPTION 'audit_logs: action % is not whitelisted', NEW.action;
  END IF;

  IF NEW.resource IS NOT NULL AND length(NEW.resource) > 64 THEN
    RAISE EXCEPTION 'audit_logs: resource too long';
  END IF;
  IF NEW.resource_id IS NOT NULL AND length(NEW.resource_id) > 128 THEN
    RAISE EXCEPTION 'audit_logs: resource_id too long';
  END IF;

  IF NEW.metadata IS NOT NULL AND octet_length(NEW.metadata::text) > 4096 THEN
    RAISE EXCEPTION 'audit_logs: metadata exceeds 4KB';
  END IF;

  -- Ignore any client-supplied timestamps; server sets created_at via default
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_audit_log ON public.audit_logs;
CREATE TRIGGER trg_validate_audit_log
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_audit_log();
