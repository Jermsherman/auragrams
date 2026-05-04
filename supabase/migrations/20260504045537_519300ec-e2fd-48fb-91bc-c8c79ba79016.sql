
-- profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  default_visibility text not null default 'choose' check (default_visibility in ('artist','username','choose','anonymous')),
  allow_anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_username_lower on public.profiles ((lower(username)));
alter table public.profiles enable row level security;

-- artist_profiles
create table public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  artist_name text not null,
  artist_handle text,
  bio text,
  profile_image_url text,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index artist_profiles_user_id on public.artist_profiles (user_id);
create index artist_profiles_handle_lower on public.artist_profiles ((lower(artist_handle)));
alter table public.artist_profiles enable row level security;

-- auras
create table public.auras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  artist_profile_id uuid references public.artist_profiles(id) on delete set null,
  visibility_mode text not null default 'artist' check (visibility_mode in ('artist','username','anonymous')),
  is_anonymous boolean generated always as (visibility_mode = 'anonymous') stored,
  track_title text not null,
  source_type text,
  platform_name text,
  platform_url text,
  embed_url text,
  mood_tags jsonb not null default '[]'::jsonb,
  detected_key text,
  pitch_center text,
  energy_level numeric,
  aura_name text,
  aura_description text,
  vibe_description text,
  color_palette jsonb,
  palette_name text,
  visual_style jsonb,
  public_artist_name text,
  public_handle text,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index auras_user_id on public.auras (user_id);
create index auras_artist_profile_id on public.auras (artist_profile_id);
alter table public.auras enable row level security;

-- auracles
create table public.auracles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  artist_profile_id uuid references public.artist_profiles(id) on delete set null,
  visibility_mode text not null default 'artist' check (visibility_mode in ('artist','username','anonymous')),
  title text not null,
  description text,
  project_type text,
  aura_ids jsonb not null default '[]'::jsonb,
  public_artist_name text,
  public_handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index auracles_user_id on public.auracles (user_id);
alter table public.auracles enable row level security;

-- Helper: current profile id (now that profiles exists)
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1
$$;

-- RLS policies
create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles owner insert" on public.profiles for insert with check (auth_user_id = auth.uid());
create policy "profiles owner update" on public.profiles for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy "profiles owner delete" on public.profiles for delete using (auth_user_id = auth.uid());

create policy "artist_profiles public read" on public.artist_profiles for select using (true);
create policy "artist_profiles owner insert" on public.artist_profiles for insert with check (user_id = public.current_profile_id());
create policy "artist_profiles owner update" on public.artist_profiles for update using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "artist_profiles owner delete" on public.artist_profiles for delete using (user_id = public.current_profile_id());

create policy "auras public read" on public.auras for select using (true);
create policy "auras owner insert" on public.auras for insert with check (user_id = public.current_profile_id());
create policy "auras owner update" on public.auras for update using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "auras owner delete" on public.auras for delete using (user_id = public.current_profile_id());

create policy "auracles public read" on public.auracles for select using (true);
create policy "auracles owner insert" on public.auracles for insert with check (user_id = public.current_profile_id());
create policy "auracles owner update" on public.auracles for update using (user_id = public.current_profile_id()) with check (user_id = public.current_profile_id());
create policy "auracles owner delete" on public.auracles for delete using (user_id = public.current_profile_id());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id) values (new.id) on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_artist_profiles_updated before update on public.artist_profiles for each row execute function public.set_updated_at();
create trigger trg_auras_updated before update on public.auras for each row execute function public.set_updated_at();
create trigger trg_auracles_updated before update on public.auracles for each row execute function public.set_updated_at();
