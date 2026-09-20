# Invite-only soft launch: publishing states + secure audio playback

## 1. What exists today (verified)

- `auras` has a `visibility_mode` field ('artist' / 'anonymous') — that is identity display, not privacy.
- `auras` currently has a **public read policy for everyone** (`using: true`), so every Aura is readable by anyone, including unfinished ones.
- The audio bucket `auragram-audio` is **private**, and the storage read rule only matches the uploader's own folder. So a visitor on a shared Aura page cannot get a playable link — this is the current "audio doesn't play for other people" bug.
- Surfaces reading Auras: individual Aura page, Discover (trending/new/following), public artist profile `/u/username`, AuraLink page `/l/slug`, My Auras, cleanup job, insight generation. Sitemap lists only static pages (no Auras) today.
- There are **10 existing Auras**, all with audio, owned by 2 accounts, and **none of them are referenced by any AuraLink**.

## 2. Publishing model

New field `status` on Auras with three values:

- **Draft** — only the owner can see it. This is the default for every new Aura.
- **Unlisted** — anyone with the exact link can open and play it, but it never appears in Discover, profiles, feeds, search, or the sitemap.
- **Public** — open to everyone and eligible to appear on public surfaces.

`visibility_mode` stays exactly as-is and keeps controlling whether the artist's name is shown.

### Migration decision for the 10 existing Auras

Every existing Aura becomes **Draft**. Reasoning: nothing in the current data proves an owner deliberately published anything — there was never a publish action to take, and no Aura is attached to a live AuraLink, so nothing public breaks. Draft is the safest state for unreleased music, and each owner can flip their own Auras to Unlisted or Public in one click. No rows are deleted or altered otherwise.

## 3. Security model

- Remove blanket anonymous read on the `auras` table.
- Owners keep full create / read / update / delete on their own Auras.
- Signed-out and other signed-in visitors read published Auras only:
  - list-style surfaces (Discover, profiles, feeds) return **Public** only;
  - a single-Aura fetch by exact ID additionally allows **Unlisted**.
- Drafts are unreachable by anyone but the owner, and a draft requested by a visitor renders a neutral "This Aura is private or unavailable" page that does not reveal whether it exists.
- Public surfaces read through a narrowed, public-safe projection so owner-internal fields aren't handed out.
- Sitemap and analytics stay limited to public records.

## 4. Audio playback

Original uploads stay private. A server endpoint mints a short-lived playback link only after it checks:

1. the Aura ID is a valid ID and the stored audio path belongs to that Aura;
2. the Aura is Public or Unlisted, **or** the requester is the owner;
3. drafts requested by non-owners are refused with a plain, non-revealing error.

The browser never receives storage credentials. The Aura page and AuraLink players switch to this flow and gain loading, unavailable, and playback-error states, with automatic refresh when a link expires.

## 5. Owner controls

- A status badge (Draft / Unlisted / Public) on the Aura page and in My Auras, visible to the owner only.
- A publishing control on the reveal/creation flow and Aura page with plain-language descriptions of each state.
- "Save as draft" is the primary action; going Public requires an explicit confirmation step. Nothing ever publishes on its own.

## 6. Risks and assumptions

- Existing Auras go dark publicly until their owners publish them — intended for an invite-only launch, and both owners are testers.
- Unlisted links are secret-URL security: anyone with the link can view. Stated plainly in the UI.
- Discover and profile pages will look empty until Auras are published; this is expected, not a bug.

## 7. Technical detail

- Migration: add `status text not null default 'draft'` with a check constraint + index; backfill existing rows to `'draft'`; keep `visibility_mode` untouched.
- RLS: drop the `auras public read` policy; add `auras owner all` (`user_id = current_profile_id()`) and `auras public read published` (`status = 'public'`) for anon/authenticated. Unlisted single-row access goes through a `security definer` RPC `get_shareable_aura(_id uuid)` returning public-safe columns for `status in ('public','unlisted')`, plus `list_public_auras(...)` / `list_public_auras_by_profile(...)` for feeds so no blanket table read is needed. GRANTs issued for `anon`, `authenticated`, `service_role` as appropriate.
- Playback: `createServerFn` `getAuraPlaybackUrl({ auraId })` in `src/lib/auraPlayback.functions.ts` — resolves the Aura via service-role read inside the handler, authorizes status/ownership (bearer token when present), validates that `audio_storage_path` matches the row, and returns a ~10-minute signed URL for `auragram-audio` only. Errors return `{ error: 'unavailable' | 'private' | 'missing' }`.
- Client: `src/lib/audioStorage.ts` gains `getPlaybackUrl(auraId)` backed by the server fn with an expiry-aware cache; owner-side direct signing stays as a fast path in My Auras. Callers updated: `aura.$id.tsx`, `l.$slug.tsx`, `AuraLinkView` / `AuraLinkAuraCard`, `FeedAuraCard`, `discover.tsx`, `u.$username.tsx`, `social.ts` (`listFeedAuras`), `cloudAura.ts` (`getPublicAura`, `hydrateSavedAuraAudioUrls`).
- New UI: `src/components/AuraStatusControl.tsx` (badge + state switch + publish confirmation dialog), wired into `AuraProfileCard` / `aura.$id.tsx` / `farm.tsx` / the reveal flow.
- Types regenerated after migration; `bunx tsgo --noEmit` plus a build run at the end.

## 8. Verification

Playwright + SQL checks covering: signed-out draft read blocked; other signed-in user blocked; owner reads and plays own draft; unlisted exact link loads and plays; unlisted absent from Discover/profile/feed/sitemap; public loads and plays signed out; public appears on eligible surfaces; Public → Draft revokes access immediately; expired playback link refreshes; AuraLink hides private/missing Auras; all 10 existing rows still present afterwards.

## 9. Manual QA checklist (delivered with the work)

Sign out and open a draft link, an unlisted link, and a public link; publish one Aura and confirm it appears in Discover; revert it to draft and confirm it disappears; play audio on a public Aura in a private window; leave a page idle past link expiry and press play again.
