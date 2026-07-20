DROP POLICY IF EXISTS "auragram-audio owner select" ON storage.objects;

CREATE POLICY "auragram-audio owner select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'auragram-audio'
  AND name LIKE (auth.uid()::text || '/%'::text)
);