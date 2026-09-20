-- 1. Publishing status (separate from visibility_mode, which is identity display)
ALTER TABLE public.auras
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

ALTER TABLE public.auras
  ADD CONSTRAINT auras_status_check CHECK (status IN ('draft','unlisted','public'));

CREATE INDEX IF NOT EXISTS auras_status_created_idx ON public.auras (status, created_at DESC);

-- Existing rows: safest state. No prior publish action existed and none are
-- referenced by an AuraLink, so nothing public breaks.
UPDATE public.auras SET status = 'draft' WHERE status IS DISTINCT FROM 'draft';

-- 2. RLS: remove blanket anonymous read
DROP POLICY IF EXISTS "auras public read" ON public.auras;

CREATE POLICY "auras owner read" ON public.auras
  FOR SELECT TO authenticated
  USING (user_id = public.current_profile_id());

CREATE POLICY "auras public read published" ON public.auras
  FOR SELECT TO anon, authenticated
  USING (status = 'public');

-- 3. Public-safe shareable fetch (public OR unlisted, by exact id)
CREATE OR REPLACE FUNCTION public.get_shareable_auras(_ids uuid[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
  from (
    select
      a.id, a.user_id, a.artist_profile_id, a.visibility_mode, a.is_anonymous,
      a.status, a.track_title, a.source_type, a.platform_name, a.platform_url,
      a.embed_url, a.mood_tags, a.detected_key, a.pitch_center, a.energy_level,
      a.aura_name, a.aura_description, a.vibe_description, a.color_palette,
      a.palette_name, a.visual_style, a.public_artist_name, a.public_handle,
      a.extra, a.audio_file_name, a.audio_mime_type, a.audio_duration_seconds,
      a.insight, a.created_at, a.updated_at
    from public.auras a
    where a.id = any(_ids)
      and a.status in ('public','unlisted')
  ) x
$$;

REVOKE ALL ON FUNCTION public.get_shareable_auras(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shareable_auras(uuid[]) TO anon, authenticated, service_role;