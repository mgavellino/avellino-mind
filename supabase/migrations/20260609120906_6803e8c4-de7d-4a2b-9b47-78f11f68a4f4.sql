
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_goal_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clinic_commission_pct numeric(5,2) DEFAULT 0;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS therapeutic_plan jsonb DEFAULT '{}'::jsonb;

-- Waiting list
CREATE TABLE IF NOT EXISTS public.waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  priority text NOT NULL DEFAULT 'normal',
  notes text,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiting_list TO authenticated;
GRANT ALL ON public.waiting_list TO service_role;
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own waiting_list" ON public.waiting_list FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_waiting_list_updated BEFORE UPDATE ON public.waiting_list FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Referrals network
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  specialty text,
  phone text,
  email text,
  crp text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals" ON public.referrals FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Psychoeducation library
CREATE TABLE IF NOT EXISTS public.psychoeducation_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  description text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.psychoeducation_resources TO authenticated;
GRANT ALL ON public.psychoeducation_resources TO service_role;
ALTER TABLE public.psychoeducation_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own psychoed" ON public.psychoeducation_resources FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_psychoed_updated BEFORE UPDATE ON public.psychoeducation_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Recurring blocks (lunch, supervision)
CREATE TABLE IF NOT EXISTS public.recurring_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  weekday smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  color text DEFAULT '#94a3b8',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_blocks TO authenticated;
GRANT ALL ON public.recurring_blocks TO service_role;
ALTER TABLE public.recurring_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recurring_blocks" ON public.recurring_blocks FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_recurring_blocks_updated BEFORE UPDATE ON public.recurring_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
