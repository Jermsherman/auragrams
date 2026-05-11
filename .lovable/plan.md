## What's already in place

Patch 2 is largely scaffolded — most of the persistence layer already exists. The audit confirms:

- **Auth**: Email/password signup + signin on `/auth`, `useAuth()` hook with profile lookup, `/onboarding` to fill username + first artist profile.
- **Schema**: `profiles`, `artist_profiles`, `auras`, `auracles` tables exist with public-read + owner-write RLS via `current_profile_id()`.
- **Storage**: `auragram-audio` (public) bucket exists. `src/lib/audioStorage.ts` uploads to `{authUserId}/{auraId}/{file}` and returns a public URL. `auralink-images` bucket exists for cover images.
- **Cloud writes**: `src/lib/cloudAura.ts` handles `saveAuraToCloud`, `listMyAuras`, `getPublicAura`, vibe/visibility updates, artist profile CRUD, auracle save/list/delete, username availability.
- **Create flow**: `src/routes/create.tsx` already calls `saveAuraToCloud` and uses `IdentitySelector` for artist/username/anonymous.
- **Aura page**: `aura.$id.tsx` already fetches via `getPublicAura`, so refreshed uploaded audio plays from `audio_public_url`.

What is **still localStorage-only** and breaks the "real platform" promise:

1. **AuraLinks** — `src/lib/auralink.ts` is 100% localStorage. No DB table. Means: public `/l/$slug` only works on the device that built it; AuraLinks don't survive a different browser/session; visitors to a shared link see "AuraLink not found".
2. **Farm** — `src/routes/farm.tsx` reads `getSavedAuras()` from localStorage, ignoring the user's cloud `auras` table. After a fresh login on a new device, the Farm is empty even though their auras are in the DB.
3. **AuraLink public page Aura cards** — `l.$slug.tsx` resolves selected auras from `getSavedAuras()` (the *visitor's* localStorage), so referenced Auras never render to anyone but the owner.

Everything else in the spec (loading copy, error strings, anonymous masking, owner-only controls) is wiring on top of these three gaps.

## Plan

### 1. New `auralinks` table (migration)

```sql
create table public.auralinks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                 -- profiles.id (matches existing pattern)
  artist_profile_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  artist_name text not null default '',
  slug text not null unique,
  description text null,
  profile_image_url text null,
  mode text not null default 'mixed',           -- 'streaming_links' | 'auras' | 'mixed'
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

-- Public read (anyone visiting /l/:slug)
create policy "auralinks public read" on public.auralinks
  for select using (true);
-- Owner CRUD, scoped through current_profile_id() like sibling tables
create policy "auralinks owner insert" on public.auralinks
  for insert with check (user_id = public.current_profile_id());
create policy "auralinks owner update" on public.auralinks
  for update using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());
create policy "auralinks owner delete" on public.auralinks
  for delete using (user_id = public.current_profile_id());

-- updated_at trigger
create trigger auralinks_set_updated_at
  before update on public.auralinks
  for each row execute function public.set_updated_at();
```

### 2. AuraLink service (`src/lib/auralinkService.ts`)

New async API mirroring the current localStorage signatures so call sites can switch with minimal churn:

- `listMyAuraLinks(profileId)` → public.auralinks where user_id = profileId
- `getAuraLinkBySlug(slug)` → public read, used by `/l/$slug`
- `saveAuraLink(profileId, page)` → insert; `ensureUniqueSlug` runs against DB
- `updateAuraLink(id, patch)`
- `deleteAuraLink(id)`
- `mapRowToPage(row)` / `mapPageToRow(page, profileId)` translate between DB jsonb shape and the existing `AuraLinkPage` type so `AuraLinkView` doesn't change.

Keep `src/lib/auralink.ts` for **type definitions, theme catalogs, platform catalogs, slugify, migratePage** (still useful for the one-time migration). Drop its localStorage `read/write` from the import surface that the builder/public page use, replacing with the new async service.

### 3. Wire the builder + Add-to-AuraLink dialog to the service

- `src/components/AuraLinkBuilder.tsx`
  - Replace synchronous calls (`getAuraLinks`, `getAuraLink`, `saveAuraLink`, `updateAuraLink`, `deleteAuraLink`) with awaited service calls.
  - Use `useAuth().profile?.id` as `user_id`. Gate the page on auth (it's already wrapped in `RequireAuth`).
  - Use `useState` + `useEffect` to load `savedLinks` on mount and after publish/delete; show "Loading…" copy while pending.
  - Status copy: "Publishing AuraLink…" on the publish button, "Could not save AuraLink. Please try again." on error.
- `src/components/AddToAuraLinkDialog.tsx`
  - Load the current user's AuraLinks via `listMyAuraLinks(profile.id)`, write via `updateAuraLink`.

### 4. Convert `/l/$slug` to a real public page

- `src/routes/l.$slug.tsx`
  - Loader: call `getAuraLinkBySlug` (Supabase, public RLS). When found, also pre-fetch the auras referenced by `selected_aura_ids` from `public.auras` (public read RLS), translating to the existing `SavedAura` shape via `mapAuraRowToSaved` (already implicit in `aura.$id.tsx`; extract a shared helper into `src/lib/cloudAura.ts` → `mapAuraRowToSaved(row)`).
  - Pass the cloud-resolved page and the resolved Auras to `AuraLinkView`. This makes the page render for any visitor.
  - Anonymous masking: if `page.visibility === 'public'` but the linked aura row has `visibility_mode === 'anonymous'`, strip `artistName` / `artistHandle` before rendering (already supported in `AuraLinkAuraCard` since it just displays props).
  - Dynamic head() continues to derive SEO title/description/og image from the loader's `page` (keeps the work done in patch 1).
  - SSR-safe: the cloud client works server-side too, so we can drop the `typeof window` guard for this route and serve real OG metadata to crawlers.

### 5. Convert `/farm` to a real cloud-backed view

- `src/routes/farm.tsx`
  - Use `useAuth()`. If not signed in, show "Sign in to view your Aura Farm." + CTA to `/auth?redirect=/farm`.
  - On mount + auth-state change, `listMyAuras(profile.id)` and translate rows via the new `mapAuraRowToSaved` helper.
  - Hydrate from localStorage cache **first** to avoid an empty flicker, then overwrite with cloud results once they arrive.
  - `AuraFarmCard.delete` already calls `deleteAura` from `src/lib/farm.ts` (localStorage). Add a parallel cloud delete via `cloudAura.deleteAura(id)` and an optional `supabase.storage.from(AUDIO_BUCKET).remove([audio_storage_path])` when present.
  - Show "Deleting…" while pending, then "Aura deleted." on success.

### 6. One-time localStorage → cloud migration

Add `src/lib/localMigration.ts` and call it from `useAuth` once when a session becomes available *and* a profile exists:

- Read `auragram_farm_auras` and `auragram_auralinks` from localStorage.
- For each aura that doesn't already exist by id in the user's `auras` table, prompt once via toast with action button "Move local Auras into your account?" (only if there's at least one item to migrate).
- On accept, upsert auras via `saveAuraToCloud` (audio that was a blob URL is left null with a "reupload to restore playback" placeholder; metadata is preserved).
- For AuraLinks, insert via the new service with a fresh `ensureUniqueSlug` check.
- Mark migration done with `localStorage.setItem('auragram_migration_done', '1')` so we don't re-prompt.

This is optional and dismissible; it never blocks the UI.

### 7. Loading + error copy pass

Standardize the user-facing strings spec'd in the request across:

- `create.tsx` ("Uploading audio…", "Creating your Aura…", "Saving to your Farm…", "Upload failed. Please try again.", "This file is too large. Try a smaller audio file.")
- `AuraLinkBuilder.tsx` ("Publishing AuraLink…", "Could not save AuraLink. Please try again.")
- `RequireAuth` gating ("You need to sign in to do that." / "Create an account to save and share your Aura.")
- Never surface raw Supabase error messages: wrap in `try/catch` and toast a friendly version while logging the original to `console.error`.

### 8. Owner vs visitor controls on `/aura/$id`

`aura.$id.tsx` already uses `getPublicAura`; add explicit gating around Influence / Edit Vibe / Edit Palette / Delete / Add to AuraLink / Add to Auracle: only render them when `useAuth().profile?.id === row.user_id`. Public visitors see Play, Open platform link, Share, View AuraLink (when one references it). Anonymous mask (`visibility_mode === 'anonymous'`) hides `public_artist_name`, `public_handle`, and the artist link block.

## Files

**New**
- `supabase/migrations/<ts>_auralinks_table.sql` — table + RLS + trigger above
- `src/lib/auralinkService.ts` — async DB CRUD for AuraLinks
- `src/lib/localMigration.ts` — one-time localStorage → cloud migration

**Edited**
- `src/lib/auralink.ts` — keep types/catalogs/slug/migratePage; drop localStorage helpers from public exports used elsewhere
- `src/lib/cloudAura.ts` — add `mapAuraRowToSaved(row)` shared helper + storage deletion helper
- `src/components/AuraLinkBuilder.tsx` — async load/save/delete via service
- `src/components/AddToAuraLinkDialog.tsx` — async list/update
- `src/routes/l.$slug.tsx` — cloud loader + cloud-resolved auras
- `src/routes/farm.tsx` — cloud-backed list + sign-in gate + cloud delete
- `src/routes/aura.$id.tsx` — owner-only control gating + anonymous masking
- `src/hooks/useAuth.ts` — fire `localMigration` after profile resolves
- `src/routes/create.tsx` — friendly loading/error copy pass

**Untouched**: storage bucket, all design tokens, layouts, Aurascope, audio analyser, identity types, onboarding, auth route.

## Out of scope

- Google OAuth (currently disabled; will re-enable in a follow-up patch).
- Switching `auragram-audio` to private + signed URLs (public is acceptable for MVP per spec).
- Drag-and-drop reorder UX changes (existing arrow controls remain).
- Real-time AuraLink view counter / analytics.