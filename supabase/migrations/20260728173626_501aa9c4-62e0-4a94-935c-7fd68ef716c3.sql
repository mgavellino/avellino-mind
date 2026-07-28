ALTER TABLE public.appointment_receivables ALTER COLUMN appointment_id DROP NOT NULL;
ALTER TABLE public.appointment_receivables ADD COLUMN IF NOT EXISTS description text;