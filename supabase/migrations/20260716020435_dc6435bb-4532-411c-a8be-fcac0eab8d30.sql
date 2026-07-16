
-- Drop the now-obsolete public SELECT on the audio bucket (bucket is private; signed URLs bypass RLS).
DROP POLICY IF EXISTS "auragram-audio public read" ON storage.objects;

-- Enable extensions needed for the guest-cleanup cron.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily guest-aura cleanup (03:00 UTC). Calls the app's public cron route.
SELECT cron.unschedule('cleanup-guest-auras') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-guest-auras');

SELECT cron.schedule(
  'cleanup-guest-auras',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--986a65e0-86f3-4930-ae58-fc5efbc0fe45.lovable.app/api/public/cron/cleanup-guest-auras',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZXRhcXBjc3V1dGJhZnFkcWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTgxNzUsImV4cCI6MjA5MzQzNDE3NX0.iy4ZlFWPmaQEkvRB3MH78D4mGGs-3mrYjP4AQ_8Hs_4"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
