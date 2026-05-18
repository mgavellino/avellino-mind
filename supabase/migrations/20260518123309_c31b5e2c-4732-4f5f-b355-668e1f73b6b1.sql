
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin_master', 'user');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'trial', 'lifetime');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected', 'refunded', 'cancelled');
CREATE TYPE public.plan_interval AS ENUM ('monthly', 'quarterly', 'yearly', 'lifetime');

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  crp TEXT,
  specialty TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================================
-- PLANS
-- =========================================
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL,
  interval public.plan_interval NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- =========================================
-- SUBSCRIPTIONS
-- =========================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  status public.subscription_status NOT NULL DEFAULT 'trial',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  gateway TEXT,
  gateway_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PATIENTS
-- =========================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_owner ON public.patients(owner_id);
CREATE INDEX idx_patients_name ON public.patients(owner_id, full_name);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- =========================================
-- APPOINTMENTS
-- =========================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_owner_time ON public.appointments(owner_id, starts_at);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- MEDICAL RECORDS (with versioning)
-- =========================================
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Prontuário',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_text TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_records_patient ON public.medical_records(patient_id);
CREATE INDEX idx_records_owner ON public.medical_records(owner_id);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Versioning history
CREATE TABLE public.medical_record_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_record_versions ON public.medical_record_versions(record_id, version DESC);
ALTER TABLE public.medical_record_versions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PAYMENTS
-- =========================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status public.payment_status NOT NULL DEFAULT 'pending',
  gateway TEXT NOT NULL DEFAULT 'mercadopago',
  gateway_payment_id TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_gateway_id ON public.payments(gateway_payment_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- DOCUMENTS (storage metadata)
-- =========================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_patient ON public.documents(patient_id);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  read_at TIMESTAMPTZ,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================================
-- AUDIT LOGS
-- =========================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id, created_at DESC);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- TIMESTAMP TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_records_updated BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================================
-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Start 14-day trial subscription
  INSERT INTO public.subscriptions (user_id, status, expires_at)
  VALUES (NEW.id, 'trial', now() + INTERVAL '14 days');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- RLS POLICIES
-- =========================================

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Admins insert profiles" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Only admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- plans (public read)
CREATE POLICY "Anyone reads active plans" ON public.plans FOR SELECT TO authenticated, anon
  USING (is_active = true OR public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Admins manage plans" ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- subscriptions
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- patients
CREATE POLICY "Owner manages patients" ON public.patients FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));

-- appointments
CREATE POLICY "Owner manages appointments" ON public.appointments FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));

-- medical_records
CREATE POLICY "Owner manages records" ON public.medical_records FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));

-- medical_record_versions
CREATE POLICY "Owner reads record versions" ON public.medical_record_versions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_records mr
      WHERE mr.id = record_id AND (mr.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'))
    )
  );
CREATE POLICY "Owner creates record versions" ON public.medical_record_versions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medical_records mr
      WHERE mr.id = record_id AND mr.owner_id = auth.uid()
    )
  );

-- payments
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_master'));

-- documents
CREATE POLICY "Owner manages documents" ON public.documents FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin_master'));

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- audit_logs (admin-only view; insert allowed for any authenticated for self-logging)
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Authenticated insert audit" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- =========================================
-- SEED PLANS
-- =========================================
INSERT INTO public.plans (name, slug, description, price_cents, interval, features, is_featured, sort_order) VALUES
  ('Mensal', 'monthly', 'Para psicólogos autônomos', 8900, 'monthly',
    '["Agenda completa","Prontuário ilimitado","Até 100 pacientes","Suporte por email"]'::jsonb, false, 1),
  ('Trimestral', 'quarterly', 'Economize 22% no plano trimestral', 20700, 'quarterly',
    '["Tudo do Mensal","Pacientes ilimitados","Pagamentos integrados","Suporte prioritário","Exportação PDF/DOCX"]'::jsonb, true, 2),
  ('Anual', 'yearly', 'Para clínicas estabelecidas', 70800, 'yearly',
    '["Tudo do Trimestral","Multi-profissionais","Painel administrativo","Analytics avançado","Onboarding dedicado"]'::jsonb, false, 3),
  ('Vitalício', 'lifetime', 'Acesso para sempre, sem renovações', 199900, 'lifetime',
    '["Tudo do Anual","Acesso vitalício","Atualizações para sempre","Suporte VIP"]'::jsonb, false, 4);
