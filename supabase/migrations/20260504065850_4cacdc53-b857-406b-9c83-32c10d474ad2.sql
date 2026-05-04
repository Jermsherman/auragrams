insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'auralink-images',
  'auralink-images',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "auralink-images public read"
on storage.objects for select
using (bucket_id = 'auralink-images');

create policy "auralink-images owner insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'auralink-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "auralink-images owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'auralink-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'auralink-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "auralink-images owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'auralink-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
