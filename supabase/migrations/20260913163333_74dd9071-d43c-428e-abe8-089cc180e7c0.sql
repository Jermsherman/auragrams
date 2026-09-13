DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT id, username, display_name, avatar_url, created_at
FROM public.profiles;

-- Column-level grants: only the safe columns are readable by others
GRANT SELECT (id, username, display_name, avatar_url, created_at)
  ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE POLICY "profiles public card read" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);