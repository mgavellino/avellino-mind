-- Add SaaS tables for dynamic pricing, subscriptions, and landing page management

-- Pricing configuration table
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'BRL',
  billing_period TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, lifetime
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, paused
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_subscription_id TEXT,
  promo_code_used TEXT,
  discount_amount DECIMAL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (plan_id) REFERENCES public.pricing_config(plan_id)
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER,
  discount_amount DECIMAL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  applicable_plans JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Landing page content table
CREATE TABLE IF NOT EXISTS public.landing_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  cta_text TEXT,
  cta_link TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master admin configuration table
CREATE TABLE IF NOT EXISTS public.master_admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_promo_active BOOLEAN DEFAULT true,
  launch_promo_price DECIMAL NOT NULL DEFAULT 697,
  launch_promo_message TEXT DEFAULT 'Promoção de lançamento: 1º mês por R$ 697 · parcele em até 12x',
  launch_promo_valid_until TIMESTAMP WITH TIME ZONE,
  default_free_trial_days INTEGER DEFAULT 14,
  payment_gateway TEXT DEFAULT 'stripe', -- stripe, outro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default master admin config
INSERT INTO public.master_admin_config (
  launch_promo_active,
  launch_promo_price,
  launch_promo_message
) VALUES (
  true,
  697.00,
  'Promoção de lançamento: 1º mês por R$ 697 · parcele em até 12x'
) ON CONFLICT DO NOTHING;

-- Insert default pricing configurations
INSERT INTO public.pricing_config (plan_id, name, price, billing_period, description, features, display_order) VALUES
('free', 'Gratuito', 0, 'lifetime', 'Teste a plataforma gratuitamente', '["agendamento_basico", "5_pacientes", "100_anotacoes"]'::jsonb, 0),
('starter', 'Iniciante', 29.90, 'monthly', 'Para psicólogos autônomos', '["agendamento_completo", "20_pacientes", "500_anotacoes", "relatorios_basicos"]'::jsonb, 1),
('professional', 'Profissional', 79.90, 'monthly', 'Para consultórios estabelecidos', '["agendamento_completo", "100_pacientes", "5000_anotacoes", "relatorios_avancados", "integracao_stripe"]'::jsonb, 2),
('lifetime', 'Acesso Vitalício', 697.00, 'lifetime', 'Pague uma vez. Use para sempre', '["agendamento_completo", "pacientes_ilimitados", "anotacoes_ilimitadas", "relatorios_avancados", "integracao_stripe", "suporte_prioritario"]'::jsonb, 3),
('enterprise', 'Empresa', 199.90, 'monthly', 'Para clínicas com múltiplos psicólogos', '["agendamento_completo", "pacientes_ilimitados", "anotacoes_ilimitadas", "relatorios_avancados", "integracao_stripe", "suporte_prioritario", "admin_master", "usuarios_adicionais"]'::jsonb, 4)
ON CONFLICT DO NOTHING;

-- Insert default landing page content
INSERT INTO public.landing_page_content (key, title, description, order_index) VALUES
('hero_title', 'A plataforma definitiva para clínicas modernas.', NULL, 0),
('hero_subtitle', 'AvellPsy é o sistema premium de gestão para psicólogos: agenda, prontuário eletrônico com autosave, pagamentos e painel administrativo — tudo em um único ambiente seguro.', NULL, 1),
('promo_banner', 'Promoção de lançamento', '1º mês por R$ 697 · parcele em até 12x', 2)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pricing_config_is_active ON public.pricing_config(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON public.promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_landing_page_content_key ON public.landing_page_content(key);

-- Enable RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_admin_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_config (public read)
CREATE POLICY "Anyone can view active pricing" ON public.pricing_config
  FOR SELECT USING (is_active = true);

-- RLS Policies for subscriptions (user can view own)
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for landing_page_content (public read)
CREATE POLICY "Anyone can view active content" ON public.landing_page_content
  FOR SELECT USING (is_active = true);

-- RLS Policies for master_admin_config (public read)
CREATE POLICY "Anyone can view master config" ON public.master_admin_config
  FOR SELECT USING (true);
