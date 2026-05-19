-- Add plan column to profiles
ALTER TABLE public.profiles ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN admin_tier TEXT DEFAULT 'user'; -- user, admin, master_admin

-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'BRL',
  billing_period TEXT DEFAULT 'monthly', -- monthly, yearly, lifetime
  features JSONB NOT NULL DEFAULT '[]',
  max_patients INTEGER,
  max_records INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  stripe_payment_id TEXT,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method TEXT, -- stripe, manual
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  plan_id TEXT REFERENCES public.plans(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- Insert default plans
INSERT INTO public.plans (id, name, price, billing_period, features, max_patients, max_records) VALUES
('free', 'Gratuito', 0, 'lifetime', '["agendamento_basico", "5_pacientes", "100_anotacoes"]'::jsonb, 5, 100),
('starter', 'Iniciante', 29.90, 'monthly', '["agendamento_completo", "20_pacientes", "500_anotacoes", "relatorios_basicos"]'::jsonb, 20, 500),
('professional', 'Profissional', 79.90, 'monthly', '["agendamento_completo", "100_pacientes", "5000_anotacoes", "relatorios_avancados", "integracao_stripe"]'::jsonb, 100, 5000),
('lifetime', 'Acesso Vitalício', 697.00, 'lifetime', '["agendamento_completo", "pacientes_ilimitados", "anotacoes_ilimitadas", "relatorios_avancados", "integracao_stripe", "suporte_prioritario"]'::jsonb, NULL, NULL),
('enterprise', 'Empresa', 199.90, 'monthly', '["agendamento_completo", "pacientes_ilimitados", "anotacoes_ilimitadas", "relatorios_avancados", "integracao_stripe", "suporte_prioritario", "admin_master", "usuarios_adicionais"]'::jsonb, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_psychologist_id ON public.appointments(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_tier ON public.profiles(admin_tier);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = psychologist_id OR auth.uid() = patient_id);

CREATE POLICY "Psychologists can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = psychologist_id);

CREATE POLICY "Users can update their appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = psychologist_id);

-- Create RLS policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view all plans" ON public.plans
  FOR SELECT USING (true);

-- Create RLS policies for permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
  FOR SELECT USING (auth.uid() = user_id);
