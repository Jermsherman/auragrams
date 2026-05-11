create table public.auralinks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  artist_profile_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  artist_name text not null default '',
  slug text not null unique,
  description text null,
  profile_image_url text null,
  mode text not null default 'mixed',
  selected_aura_ids jsonb not null default '[]'::jsonb,
  featured_aura_id uuid null,
  streaming_links jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '[]'::jsonb,
  custom_links jsonb not null default '[]'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  seo_title text null,
  seo_description text null,
  social_preview_image text null,
  visibility text not null default 'public'
);
create index auralinks_user_idx on public.auralinks(user_id);
create index auralinks_slug_idx on public.auralinks(slug);
alter table public.auralinks enable row level security;

create policy "auralinks public read" on public.auralinks
  for select using (true);
create policy "auralinks owner insert" on public.auralinks
  for insert with check (user_id = public.current_profile_id());
create policy "auralinks owner update" on public.auralinks
  for update using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());
create policy "auralinks owner delete" on public.auralinks
  for delete using (user_id = public.current_profile_id());

create trigger auralinks_set_updated_at
  before update on public.auralinks
  for each row execute function public.set_updated_at();