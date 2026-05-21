-- Promote contatoavellpsy@gmail.com if account already exists
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin_master'::app_role
FROM auth.users u
WHERE u.email = 'contatoavellpsy@gmail.com'
ON CONFLICT DO NOTHING;

-- Update founder trigger to include both emails
CREATE OR REPLACE FUNCTION public.promote_founder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IN ('miguels.avelin@gmail.com', 'contatoavellpsy@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin_master')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;