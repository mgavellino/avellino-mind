INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin_master'::app_role FROM auth.users
WHERE email IN ('miguels.avelin@gmail.com', 'contatoavellpsy@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure founder trigger is attached so future signups auto-promote
DROP TRIGGER IF EXISTS promote_founder_trigger ON auth.users;
CREATE TRIGGER promote_founder_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.promote_founder();