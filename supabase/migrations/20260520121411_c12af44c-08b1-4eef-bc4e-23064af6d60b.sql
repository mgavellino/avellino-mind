-- ============ APPOINTMENT KINDS & STATUSES ============
DO $$ BEGIN
  CREATE TYPE appointment_kind AS ENUM ('consulta','reuniao','supervisao','pessoal','outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS kind appointment_kind NOT NULL DEFAULT 'consulta',
  ADD COLUMN IF NOT EXISTS custom_kind text;

ALTER TABLE public.appointments
  ALTER COLUMN patient_id DROP NOT NULL;

-- Add missing status values (enum exists already as appointment_status)
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'cancelled';

-- ============ PLANS: limits & capabilities ============
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_patients integer,
  ADD COLUMN IF NOT EXISTS capabilities jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============ PAYMENTS: default gateway = stripe ============
ALTER TABLE public.payments ALTER COLUMN gateway SET DEFAULT 'stripe';

-- ============ SITE SETTINGS (admin-editable) ============
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads site_settings" ON public.site_settings;
CREATE POLICY "Anyone reads site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins write site_settings" ON public.site_settings;
CREATE POLICY "Admins write site_settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed default launch promo banner
INSERT INTO public.site_settings (key, value) VALUES
  ('launch_promo', '{"active":true,"title":"Promoção de lançamento","text":"1º mês por R$ 697 · parcele em até 12x","badge":"por tempo limitado"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"eyebrow":"Para psicólogos modernos","title":"A plataforma definitiva para clínicas modernas.","subtitle":"Agenda, prontuário, pacientes e gestão em um só lugar — com a precisão de um software clínico premium."}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============ PLAN LIMITS FUNCTION ============
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(_uid uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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

-- ============ SEED PLANS with limits/capabilities ============
INSERT INTO public.plans (slug, name, description, price_cents, interval, features, max_installments, is_featured, sort_order, max_patients, capabilities)
VALUES
  ('mensal','Mensal','Para psicólogos autônomos.',8900,'monthly','["Agenda completa","Prontuário ilimitado","Até 100 pacientes","Suporte por email"]'::jsonb,1,false,1,100,'{"export":false,"multi_prof":false,"admin_clinic":false}'::jsonb),
  ('trimestral','Trimestral','Economize 22% no plano trimestral.',20700,'quarterly','["Tudo do Mensal","Pacientes ilimitados","Suporte prioritário","Exportação PDF/DOCX","Importação CSV"]'::jsonb,3,true,2,NULL,'{"export":true,"multi_prof":false,"admin_clinic":false}'::jsonb),
  ('anual','Anual','Para clínicas estabelecidas.',70800,'yearly','["Tudo do Trimestral","Multi-profissionais","Painel administrativo da clínica","Analytics avançado","Onboarding dedicado"]'::jsonb,12,false,3,NULL,'{"export":true,"multi_prof":true,"admin_clinic":true}'::jsonb),
  ('vitalicio','Vitalício','Pague uma vez. Use para sempre.',99700,'lifetime','["Tudo do Anual","Acesso vitalício","Atualizações incluídas","Suporte premium dedicado","Sem mensalidades"]'::jsonb,12,false,4,NULL,'{"export":true,"multi_prof":true,"admin_clinic":true}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  max_installments = EXCLUDED.max_installments,
  max_patients = EXCLUDED.max_patients,
  capabilities = EXCLUDED.capabilities,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;