
-- Create public bucket for uploaded audio
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'auragram-audio',
  'auragram-audio',
  true,
  104857600,
  array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave','audio/mp4','audio/x-m4a','audio/aac','audio/ogg','audio/webm','audio/flac']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read access
create policy "auragram-audio public read"
on storage.objects for select
using (bucket_id = 'auragram-audio');

-- Authenticated users may write only inside their own {auth.uid()}/ folder
create policy "auragram-audio owner insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'auragram-audio'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "auragram-audio owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'auragram-audio'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'auragram-audio'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "auragram-audio owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'auragram-audio'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Audio fields on auras
alter table public.auras
  add column if not exists audio_storage_path text,
  add column if not exists audio_public_url text,
  add column if not exists audio_file_name text,
  add column if not exists audio_mime_type text,
  add column if not exists audio_size_bytes bigint,
  add column if not exists audio_duration_seconds numeric;
