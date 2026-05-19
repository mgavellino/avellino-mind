
REVOKE EXECUTE ON FUNCTION public.promote_founder() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;

CREATE POLICY "Avatars public read by path"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (
      auth.uid() IS NULL  -- anon can read individual files by URL (not list)
      OR (auth.uid()::text = (storage.foldername(name))[1])
      OR has_role(auth.uid(), 'admin_master'::app_role)
    )
  );
