-- Public-safe profile view (excludes auth_user_id and settings)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT id, username, display_name, avatar_url, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- FOLLOWS
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX follows_following_idx ON public.follows (following_id);
CREATE INDEX follows_follower_idx ON public.follows (follower_id);

GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows public read" ON public.follows
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "follows self insert" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (follower_id = public.current_profile_id());
CREATE POLICY "follows self delete" ON public.follows
  FOR DELETE TO authenticated USING (follower_id = public.current_profile_id());

-- REACTIONS
CREATE TABLE public.aura_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aura_id uuid NOT NULL REFERENCES public.auras(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  anon_key text,
  reaction text NOT NULL DEFAULT 'love',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (profile_id IS NOT NULL OR anon_key IS NOT NULL)
);
CREATE INDEX aura_reactions_aura_idx ON public.aura_reactions (aura_id);
CREATE UNIQUE INDEX aura_reactions_profile_unique
  ON public.aura_reactions (aura_id, profile_id) WHERE profile_id IS NOT NULL;
CREATE UNIQUE INDEX aura_reactions_anon_unique
  ON public.aura_reactions (aura_id, anon_key) WHERE profile_id IS NULL AND anon_key IS NOT NULL;

GRANT SELECT, INSERT, DELETE ON public.aura_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.aura_reactions TO authenticated;
GRANT ALL ON public.aura_reactions TO service_role;

ALTER TABLE public.aura_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions public read" ON public.aura_reactions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reactions anon insert" ON public.aura_reactions
  FOR INSERT TO anon WITH CHECK (profile_id IS NULL AND anon_key IS NOT NULL);
CREATE POLICY "reactions auth insert" ON public.aura_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    (profile_id IS NOT NULL AND profile_id = public.current_profile_id())
    OR (profile_id IS NULL AND anon_key IS NOT NULL)
  );
CREATE POLICY "reactions anon delete" ON public.aura_reactions
  FOR DELETE TO anon USING (profile_id IS NULL AND anon_key IS NOT NULL);
CREATE POLICY "reactions owner delete" ON public.aura_reactions
  FOR DELETE TO authenticated
  USING (profile_id = public.current_profile_id() OR (profile_id IS NULL AND anon_key IS NOT NULL));

-- COMMENTS
CREATE TABLE public.aura_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aura_id uuid NOT NULL REFERENCES public.auras(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX aura_comments_aura_idx ON public.aura_comments (aura_id, created_at DESC);

GRANT SELECT ON public.aura_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aura_comments TO authenticated;
GRANT ALL ON public.aura_comments TO service_role;

ALTER TABLE public.aura_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments public read" ON public.aura_comments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "comments author insert" ON public.aura_comments
  FOR INSERT TO authenticated WITH CHECK (author_id = public.current_profile_id());
CREATE POLICY "comments author update" ON public.aura_comments
  FOR UPDATE TO authenticated
  USING (author_id = public.current_profile_id())
  WITH CHECK (author_id = public.current_profile_id());
CREATE POLICY "comments author or aura owner delete" ON public.aura_comments
  FOR DELETE TO authenticated
  USING (
    author_id = public.current_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.auras a
      WHERE a.id = aura_comments.aura_id AND a.user_id = public.current_profile_id()
    )
  );

CREATE TRIGGER trg_aura_comments_updated
  BEFORE UPDATE ON public.aura_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();