-- Analytics events for public AuraLink pages (views, link clicks, aura plays, shares)
CREATE TABLE public.page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.auralinks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.page_events TO anon;
GRANT SELECT, INSERT ON public.page_events TO authenticated;
GRANT ALL ON public.page_events TO service_role;

ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- Anyone (even signed-out visitors) may log an event
CREATE POLICY "anyone can log page events"
ON public.page_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Only the AuraLink owner can read their events
CREATE POLICY "owners read their page events"
ON public.page_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.auralinks al
  WHERE al.id = page_id AND al.user_id = public.current_profile_id()
));

CREATE INDEX page_events_page_created_idx ON public.page_events (page_id, created_at);