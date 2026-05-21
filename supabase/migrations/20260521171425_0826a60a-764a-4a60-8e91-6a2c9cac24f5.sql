DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receivable_status') THEN
    CREATE TYPE public.receivable_status AS ENUM ('pending', 'paid', 'overdue', 'waived');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
    CREATE TYPE public.reminder_status AS ENUM ('scheduled', 'sent', 'failed', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.appointment_receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  patient_id uuid,
  amount_cents integer NOT NULL DEFAULT 0,
  status public.receivable_status NOT NULL DEFAULT 'pending',
  due_at timestamptz,
  paid_at timestamptz,
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_receivables_owner_status ON public.appointment_receivables(owner_id, status, due_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_receivables_appointment ON public.appointment_receivables(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_receivables_patient ON public.appointment_receivables(patient_id);

ALTER TABLE public.appointment_receivables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages receivables" ON public.appointment_receivables;
CREATE POLICY "Owner manages receivables"
ON public.appointment_receivables
FOR ALL
TO authenticated
USING ((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_master'::public.app_role))
WITH CHECK ((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_master'::public.app_role));

DROP TRIGGER IF EXISTS trg_appointment_receivables_updated ON public.appointment_receivables;
CREATE TRIGGER trg_appointment_receivables_updated
BEFORE UPDATE ON public.appointment_receivables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.create_receivable_for_completed_consultation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.kind = 'consulta'::appointment_kind
    AND NEW.status = 'completed'::appointment_status
    AND NEW.patient_id IS NOT NULL THEN
    INSERT INTO public.appointment_receivables (
      owner_id,
      appointment_id,
      patient_id,
      due_at,
      amount_cents,
      status
    )
    VALUES (
      NEW.owner_id,
      NEW.id,
      NEW.patient_id,
      NEW.ends_at,
      0,
      'pending'::public.receivable_status
    )
    ON CONFLICT (appointment_id) DO UPDATE SET
      patient_id = EXCLUDED.patient_id,
      due_at = EXCLUDED.due_at,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_receivable_for_completed_consultation ON public.appointments;
CREATE TRIGGER trg_create_receivable_for_completed_consultation
AFTER INSERT OR UPDATE OF status, kind, patient_id, ends_at ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.create_receivable_for_completed_consultation();

CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  patient_id uuid,
  reminder_type text NOT NULL DEFAULT 'email_24h',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status public.reminder_status NOT NULL DEFAULT 'scheduled',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_appointment_reminders_due ON public.appointment_reminders(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_owner ON public.appointment_reminders(owner_id, scheduled_for DESC);

ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads reminders" ON public.appointment_reminders;
CREATE POLICY "Owner reads reminders"
ON public.appointment_reminders
FOR SELECT
TO authenticated
USING ((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_master'::public.app_role));

DROP POLICY IF EXISTS "Owner manages reminders" ON public.appointment_reminders;
CREATE POLICY "Owner manages reminders"
ON public.appointment_reminders
FOR ALL
TO authenticated
USING ((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_master'::public.app_role))
WITH CHECK ((owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin_master'::public.app_role));

DROP TRIGGER IF EXISTS trg_appointment_reminders_updated ON public.appointment_reminders;
CREATE TRIGGER trg_appointment_reminders_updated
BEFORE UPDATE ON public.appointment_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.schedule_appointment_email_reminder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.kind = 'consulta'::appointment_kind
    AND NEW.status = 'scheduled'::appointment_status
    AND NEW.patient_id IS NOT NULL
    AND NEW.starts_at > now() THEN
    INSERT INTO public.appointment_reminders (
      owner_id,
      appointment_id,
      patient_id,
      reminder_type,
      scheduled_for,
      status
    )
    VALUES (
      NEW.owner_id,
      NEW.id,
      NEW.patient_id,
      'email_24h',
      NEW.starts_at - interval '24 hours',
      'scheduled'::public.reminder_status
    )
    ON CONFLICT (appointment_id, reminder_type) DO UPDATE SET
      patient_id = EXCLUDED.patient_id,
      scheduled_for = EXCLUDED.scheduled_for,
      status = CASE
        WHEN public.appointment_reminders.sent_at IS NULL THEN 'scheduled'::public.reminder_status
        ELSE public.appointment_reminders.status
      END,
      updated_at = now();
  ELSE
    UPDATE public.appointment_reminders
    SET status = 'cancelled'::public.reminder_status,
        updated_at = now()
    WHERE appointment_id = NEW.id
      AND reminder_type = 'email_24h'
      AND sent_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schedule_appointment_email_reminder ON public.appointments;
CREATE TRIGGER trg_schedule_appointment_email_reminder
AFTER INSERT OR UPDATE OF starts_at, status, kind, patient_id ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.schedule_appointment_email_reminder();

UPDATE public.plans
SET price_cents = 9700,
    promo_price_cents = NULL,
    description = 'Plano mensal para psicólogos autônomos.',
    stripe_price_id = 'plan_mensal_price',
    updated_at = now()
WHERE slug = 'mensal';

UPDATE public.plans
SET price_cents = 8700,
    promo_price_cents = NULL,
    description = 'Cobrança trimestral equivalente a R$87/mês.',
    stripe_price_id = 'plan_trimestral_price',
    updated_at = now()
WHERE slug = 'trimestral';

UPDATE public.plans
SET price_cents = 5900,
    promo_price_cents = NULL,
    description = 'Cobrança anual equivalente a R$59/mês.',
    stripe_price_id = 'plan_anual_price',
    updated_at = now()
WHERE slug = 'anual';

UPDATE public.plans
SET price_cents = 99700,
    promo_price_cents = 69700,
    description = 'Pague uma vez. Use para sempre.',
    stripe_price_id = 'plan_vitalicio_launch_price',
    updated_at = now()
WHERE slug = 'vitalicio';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin_master'::public.app_role
FROM auth.users
WHERE email = 'miguels.avelin@gmail.com'
ON CONFLICT DO NOTHING;

UPDATE public.subscriptions s
SET plan_id = p.id,
    status = CASE WHEN s.status::text IN ('trial', 'active') THEN s.status ELSE 'active'::public.subscription_status END,
    updated_at = now()
FROM public.plans p
WHERE s.plan_id IS NULL
  AND p.slug = CASE
    WHEN s.price_id IN ('plan_mensal_price') THEN 'mensal'
    WHEN s.price_id IN ('plan_trimestral_price') THEN 'trimestral'
    WHEN s.price_id IN ('plan_anual_price') THEN 'anual'
    WHEN s.price_id IN ('plan_vitalicio_price', 'plan_vitalicio_launch_price') THEN 'vitalicio'
    ELSE NULL
  END;

INSERT INTO public.appointment_receivables (owner_id, appointment_id, patient_id, due_at, amount_cents, status)
SELECT a.owner_id, a.id, a.patient_id, a.ends_at, 0, 'pending'::public.receivable_status
FROM public.appointments a
WHERE a.kind = 'consulta'::appointment_kind
  AND a.status = 'completed'::appointment_status
  AND a.patient_id IS NOT NULL
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO public.appointment_reminders (owner_id, appointment_id, patient_id, reminder_type, scheduled_for, status)
SELECT a.owner_id, a.id, a.patient_id, 'email_24h', a.starts_at - interval '24 hours', 'scheduled'::public.reminder_status
FROM public.appointments a
WHERE a.kind = 'consulta'::appointment_kind
  AND a.status = 'scheduled'::appointment_status
  AND a.patient_id IS NOT NULL
  AND a.starts_at > now()
ON CONFLICT (appointment_id, reminder_type) DO NOTHING;