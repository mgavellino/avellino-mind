ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS default_session_price_cents integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.apply_default_receivable_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  default_amount integer;
BEGIN
  IF NEW.amount_cents IS NULL OR NEW.amount_cents = 0 THEN
    SELECT default_session_price_cents INTO default_amount
    FROM public.profiles WHERE id = NEW.owner_id;
    IF default_amount IS NOT NULL AND default_amount > 0 THEN
      NEW.amount_cents := default_amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_default_receivable_amount() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_apply_default_receivable_amount ON public.appointment_receivables;
CREATE TRIGGER trg_apply_default_receivable_amount
BEFORE INSERT ON public.appointment_receivables
FOR EACH ROW
EXECUTE FUNCTION public.apply_default_receivable_amount();