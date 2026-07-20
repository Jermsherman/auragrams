DROP POLICY IF EXISTS "auragram-audio owner insert" ON storage.objects;
DROP POLICY IF EXISTS "auragram-audio owner update" ON storage.objects;
DROP POLICY IF EXISTS "auragram-audio owner delete" ON storage.objects;

CREATE POLICY "auragram-audio owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'auragram-audio'
  AND name LIKE (auth.uid()::text || '/%')
);

CREATE POLICY "auragram-audio owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'auragram-audio'
  AND name LIKE (auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'auragram-audio'
  AND name LIKE (auth.uid()::text || '/%')
);

CREATE POLICY "auragram-audio owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'auragram-audio'
  AND name LIKE (auth.uid()::text || '/%')
);