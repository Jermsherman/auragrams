## Auragram accounts, identity, anonymity

Add real authentication, user-owned data, Artist Profiles, and per-Aura visibility (artist / username / anonymous). Browsing the landing page stays public; everything that creates, saves, publishes, or shares requires an account.

### 1. Enable Lovable Cloud (Supabase)

The project has no backend yet. Enable Lovable Cloud so we get Supabase Auth + Postgres + RLS. (We will refer to it as "Lovable Cloud" in the UI.)

Auth methods (defaults): Email/password + Google. Sign out everywhere.

### 2. Database schema (migrations via Lovable Cloud)

Create the following tables. RLS is on for every table. `app_role` left out — not needed yet.

- `profiles`
  - `id uuid pk default gen_random_uuid()`
  - `auth_user_id uuid unique not null references auth.users(id) on delete cascade`
  - `username citext unique not null` (lowercase, `^[a-z0-9_.]{3,24}$`)
  - `display_name text`, `avatar_url text`, `default_visibility text default 'choose'`
  - `created_at`, `updated_at`
  - Trigger: on `auth.users` insert, create empty profile row (username filled at onboarding).
- `artist_profiles`
  - `id`, `user_id uuid references profiles(id) on delete cascade`
  - `artist_name text not null`, `artist_handle citext`, `bio text`, `profile_image_url text`, `links jsonb default '[]'`
  - `created_at`, `updated_at`
- `auras`
  - `id`, `user_id` (owner), `artist_profile_id` nullable
  - `visibility_mode text check in ('artist','username','anonymous') default 'artist'`
  - `is_anonymous bool generated always as (visibility_mode = 'anonymous') stored`
  - `track_title`, `source_type` (`upload`/`link`/`raw_recording`), `platform_name`, `platform_url`, `embed_url`
  - `mood_tags jsonb`, `detected_key text`, `pitch_center text`, `energy_level numeric`
  - `aura_name`, `aura_description`, `vibe_description`, `color_palette jsonb`, `palette_name`, `visual_style jsonb`
  - `public_artist_name text`, `public_handle text`
  - `created_at`, `updated_at`
- `auracles`
  - `id`, `user_id`, `artist_profile_id` nullable, `visibility_mode`, `title`, `project_type`, `description`, `aura_ids jsonb`
  - `created_at`, `updated_at`

RLS:
- `profiles`, `artist_profiles`, `auracles`: `select/insert/update/delete` only when `user_id = (select id from profiles where auth_user_id = auth.uid())` (helper SQL function `current_profile_id()` SECURITY DEFINER, stable).
- Auras: same owner rule for insert/update/delete; **public select policy**: `true` (so AuraLink pages work). Public consumers only see the columns we expose via a `public_auras` view that drops `user_id`, `artist_profile_id`, and `public_handle/public_artist_name` when `is_anonymous`.
- We will use the `public_auras` view (security_invoker = on) for the `/aura/$id` route's public reads, and the base table (RLS-scoped) for owner reads in `/farm`.

### 3. Auth surface

- New route `/auth` — single tabbed page (Sign in / Sign up). Email+password and "Continue with Google".
  - Copy: "Create your Auragram account." / "Save your Auras, grow your Farm, and share AuraLinks." / CTA "Continue".
- Use Supabase browser client (`@/integrations/supabase/client`). Set up `onAuthStateChange` listener BEFORE `getSession`.
- New `src/hooks/useAuth.ts` exposes `{ user, profile, loading, signIn, signUp, signInWithGoogle, signOut }`, refreshing profile via a `getMyProfile` server function.
- `_authenticated` pathless layout route gates: `/create`, `/farm`, `/auracle/create`, `/onboarding`, `/settings/*`. Unauthenticated → redirect to `/auth?redirect=...`.
- Public routes stay open: `/`, `/aura/$id`, `/auracle/$id`, `/artist/$handle`.

### 4. Onboarding `/onboarding`

Three steps in one screen with progress dots:
1. Username (+ optional display name). Validate format client-side; check uniqueness via server function `checkUsername`.
2. First Artist Profile: artistName (required), artistHandle, shortBio, profileImage (optional URL upload deferred — text input for now).
3. Default public identity: radio — `artist` / `username` / `choose` / plus toggle "Allow anonymous AuraLinks". Saved to `profiles.default_visibility`.
CTA "Start Creating" → `/create`.
Route guard: if `profile.username` is null after auth, force `/onboarding`.

### 5. Server functions (`src/server/*.functions.ts`)

All use `requireSupabaseAuth` middleware (RLS-scoped) unless noted.
- `getMyProfile`, `updateMyProfile`, `checkUsername`, `completeOnboarding`
- `listArtistProfiles`, `createArtistProfile`, `updateArtistProfile`, `deleteArtistProfile` (rejects when in-use unless `reassignTo` provided)
- `createAura`, `updateAura`, `updateAuraVisibility`, `deleteAura`, `listMyAuras`
- `getPublicAura(id)` — **no auth middleware**, queries `public_auras` view
- `createAuracle`, `updateAuracle`, `deleteAuracle`, `listMyAuracles`, `getPublicAuracle(id)`
- `getArtistByHandle(handle)` — public; returns artist profile + their non-anonymous public auras

Input validation: Zod, in `.inputValidator()`.

### 6. Identity selector + anonymity (Create flow)

Update `/create` (`src/routes/create.tsx`) — keeps current Source / Track Info / Mood / Preview layout. Add new "Public Identity" block after Track Info:

```
Who is this Aura for?
( ) Artist Profile  [ Stevie Cosmic ▾ ]   ← lists user's artist profiles + "+ New Artist Profile"
( ) Username        @yourname
( ) Anonymous       Posted as "Anonymous Aura"
```

If Anonymous: helper "Your AuraLink will not show your artist name or username, but it will still be saved privately to your Farm."

On submit: call `createAura` with `visibilityMode`, `artistProfileId`, `publicArtistName`, `publicHandle` derived from selection. The current `artistName` field becomes the artist-profile picker; for `username` mode we read `profile.username`; for `anonymous` we send empty publicArtistName.

`/auracle/create` gets the same identity selector and writes `auracles.visibility_mode` + `artist_profile_id`.

### 7. Farm = mine only (`/farm`)

- Owner-only: query `listMyAuras` and `listMyAuracles`. If unauthenticated → redirect via `_authenticated`.
- Header copy: "Your Aura Farm — Your growing collection of sonic identities."
- Each card: existing visuals + small "Anonymous" badge when `visibility_mode = 'anonymous'`. Per-card actions: Open, Share AuraLink, Edit visibility (popover with the same 3-radio selector), Delete.
- Existing local-storage `farm.ts` is replaced by the Supabase queries; we keep the type shape so cards don't need rewriting. A migration helper imports any existing `localStorage` farm rows into Supabase the first time the user lands on `/farm` after signing in (best-effort, optional).

### 8. Public AuraLink (`/aura/$id`) and Auracle pages

- Use `getPublicAura` (queries `public_auras` view).
- Identity block respects `visibility_mode`:
  - `artist` → artist name + handle, link to `/artist/$handle`.
  - `username` → `@username` (linked to artist page later — for now plain).
  - `anonymous` → label "Anonymous Aura", no profile link, no Farm link.
- Owner-only buttons (Edit visibility, Delete, Add to Auracle, Save to Farm) only render when `auth.user_id === aura.owner_user_id`. Owner identity comes from a separate authenticated `getAuraOwnership(id)` call that returns `{ isOwner: boolean }` (so anon visitors never see it).
- ShareDialog: when anonymous, footer says "Shared anonymously".

### 9. Account menu in Nav

Update `src/components/Nav.tsx`:
- Signed out: `Sign In` + `Gain Aura` (CTA goes to `/auth?redirect=/create`).
- Signed in: avatar (or initials) → DropdownMenu: `@username`, `Farm`, `Artist Profiles` (`/settings/artists`), `Settings`, `Sign Out`.
- Mobile keeps it minimal (avatar + Create).

### 10. Settings — Artist Profiles (`/settings/artists`)

Simple list page:
- Cards for each artist profile with edit/delete.
- "+ New Artist Profile" opens the same modal used in onboarding step 2.
- Delete: blocked if any aura references it; offer "Reassign to: [select]" before delete.

### 11. Sharing & gating

- AuraLink generation only persists for signed-in users. Unauthenticated preview path (e.g., someone landing on a freshly recorded Raw Aura via session) shows banner: "Create an account to save and share this AuraLink." with `Sign up` CTA.
- ShareDialog adds "Edit Visibility" entry that opens the visibility radio.

### 12. Files touched / created

Created:
- `src/integrations/supabase/{client.ts, client.server.ts, auth-middleware.ts, types.ts}` (auto-generated by Cloud)
- `src/hooks/useAuth.ts`
- `src/server/profiles.functions.ts`, `artists.functions.ts`, `auras.functions.ts`, `auracles.functions.ts`, `public.functions.ts`
- `src/routes/_authenticated.tsx` (pathless guard)
- `src/routes/auth.tsx`, `src/routes/onboarding.tsx`
- `src/routes/_authenticated/settings.artists.tsx`
- `src/components/IdentitySelector.tsx`, `src/components/VisibilityBadge.tsx`, `src/components/UserMenu.tsx`
- DB migration with the four tables + view + RLS + trigger

Edited:
- `src/routes/__root.tsx` — provide `auth` context
- `src/routes/index.tsx` — Nav swap (no other changes)
- `src/routes/create.tsx` — IdentitySelector, server-side save via `createAura`, redirect-to-auth gate
- `src/routes/auracle.create.tsx` — same gating + selector
- `src/routes/farm.tsx` — Supabase-backed lists + visibility badges + edit/delete
- `src/routes/aura.$id.tsx` and `src/routes/auracle.$id.tsx` — public read via view + identity block + owner-only actions
- `src/components/Nav.tsx` — UserMenu
- `src/components/ShareDialog.tsx` — anonymous footer + Edit Visibility entry
- `src/lib/farm.ts`, `src/lib/auracle.ts`, `src/lib/tracks.ts` — keep types, swap storage to thin server-fn wrappers; legacy localStorage kept only as a one-time import source

### 13. Out of scope

- Avatar / artist image uploads (text URL field only for now)
- Following / discovery feed
- Roles/admin
- Multi-Auracle public artist page beyond the existing `/artist/$handle`

### 14. Acceptance

Matches the 12 acceptance criteria in the brief: signup→login→logout work; `/create`, `/farm`, `/auracle/create` are gated; new users land on `/onboarding`; auras and auracles carry `user_id`; identity selector with artist/username/anonymous works; Farm shows only owner data; public AuraLink pages respect visibility (anonymous reveals nothing); owner-only actions are hidden for non-owners; artist profiles are CRUD-able; nav UX stays minimal.