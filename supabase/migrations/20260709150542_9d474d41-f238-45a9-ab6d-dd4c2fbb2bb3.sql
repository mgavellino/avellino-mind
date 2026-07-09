
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS assessment_date date,
  ADD COLUMN IF NOT EXISTS reassessment_date date,
  ADD COLUMN IF NOT EXISTS financial_responsible_name text,
  ADD COLUMN IF NOT EXISTS financial_responsible_cpf text,
  ADD COLUMN IF NOT EXISTS session_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS father_phone text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS mother_phone text;
