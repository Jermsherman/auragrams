-- 1. Profiles: remove blanket public read
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;

CREATE POLICY "profiles owner read"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

REVOKE SELECT ON public.profiles FROM anon;

-- Safe username availability check (no row exposure)
CREATE OR REPLACE FUNCTION public.is_username_available(_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(_username))
      and auth_user_id is distinct from auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.is_username_available(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO authenticated;

-- 2. Internal helper functions should not be callable from the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;

-- 3. Storage: stop public listing of the images bucket
DROP POLICY IF EXISTS "auralink-images public read" ON storage.objects;

CREATE POLICY "auralink-images owner select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'auralink-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);