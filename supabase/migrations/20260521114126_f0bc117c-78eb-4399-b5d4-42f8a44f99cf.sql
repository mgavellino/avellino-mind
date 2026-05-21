
-- Coupons
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  max_redemptions integer,
  redemptions_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin_master')) WITH CHECK (has_role(auth.uid(),'admin_master'));
CREATE POLICY "Anyone validates active coupons" ON public.coupons FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  subscription_id uuid,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read all redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin_master'));
CREATE POLICY "Users read own redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Insert own redemption" ON public.coupon_redemptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(),'admin_master'));

-- Plans: add stripe lookup_key
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

UPDATE public.plans SET stripe_price_id = 'plan_mensal_price' WHERE slug = 'mensal';
UPDATE public.plans SET stripe_price_id = 'plan_trimestral_price' WHERE slug = 'trimestral';
UPDATE public.plans SET stripe_price_id = 'plan_anual_price' WHERE slug = 'anual';
UPDATE public.plans SET stripe_price_id = 'plan_vitalicio_price' WHERE slug = 'vitalicio';

-- Subscriptions: add stripe fields + environment + price tracking
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons(id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- Payments: add stripe + environment
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS description text;

-- Profiles: theme
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light','system'));

-- Service role policy on subscriptions (for webhook upsert)
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
