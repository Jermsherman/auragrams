## MVP stabilization pass

After reviewing the codebase against the acceptance criteria, the core flow (sign in → create → upload → save → AuraLink → public page → playback) is wired end-to-end. There are four real correctness gaps and a couple of polish items. No new features.

### 1. Delete actually deletes (Farm + Aura page)

Today `AuraFarmCard` and `routes/aura.$id.tsx` call `deleteAura` from `@/lib/farm` only, which removes the localStorage copy. After refresh, the cloud row reappears in the Farm.

Fix:
- In `AuraFarmCard.remove()` and `aura.$id.handleDelete()`:
  - If `profile.id === aura.userId`, also call `deleteAura(id)` and `deleteAuraAudio(audioStoragePath)` from `@/lib/cloudAura`.
  - Then remove the localStorage copy and update UI.
- Show a friendly error toast on failure; still clear local copy so the UI matches cloud truth.

### 2. Owner gating on `/aura/$id`

The page renders Save / Delete / Edit Aura / Edit Palette / Shuffle / Add to Auracle / Influence regardless of who's viewing. A public visitor arriving from an AuraLink should only see view + share + play.

Fix:
- Track ownership: `const isOwner = !!profile?.id && cloudRow?.user_id === profile.id` (use existing `getPublicAura` result we already fetch).
- Hide all mutation controls (Save to Farm chip, Delete, Edit Aura, Edit Palette, Shuffle, Add to Auracle, Influence link) when `!isOwner`.
- Keep Share AuraLink, Story Preview, and the audio player visible for everyone.
- The `/aura/$id/influence` route already redirects; add an `isOwner` gate (redirect to `/aura/$id` if not the owner).

### 3. Robust cloud hydration of the Aura page

In `aura.$id.tsx`, the cloud-fallback only builds a Track shell when `row.audio_public_url` exists. A visitor on a different device opening `/aura/:id` for a platform-link or external Aura (no uploaded audio) sees a 404 even though the cloud row exists.

Fix:
- Always build the Track shell from `getPublicAura(id)` when `getTrack(id)` returns `null`.
- Set `audioUrl` from `audio_public_url` when present; otherwise show the existing "no longer available" / embed / platform card fallback (already implemented).
- Add a short "Loading Aura…" skeleton while the cloud lookup is in flight, so we don't briefly throw notFound.

### 4. Clean missing-audio fallback

`AuraLinkAuraCard` shows a play button whenever `aura.audioPublicUrl` is present. If the underlying file is gone (rare), the audio element silently errors.

Fix:
- Listen for the audio element's `error` event; on error, hide the play button and show a small "Audio unavailable" caption. Public AuraLink page still works.

### 5. Mobile polish (small, presentational only)

- `routes/aura.$id.tsx` header: the right-side cluster (Save/Delete + Saved chip + Share) can clip on narrow phones. Wrap with `flex-wrap` and ensure each button stays ≥40px tall (already 40px); collapse the "Saved" pill on `sm:hidden` (already done) and let the Share button always be visible.
- `routes/farm.tsx` action row: filter chips and the "Build AuraLink from Farm" button already wrap; just tighten spacing on small screens (`gap-1.5` and `text-[11px]` for filter chips on mobile).
- `AuraLinkView` already uses `max-w-md` and pill-style buttons; no change needed beyond confirming the share button doesn't overlap a small viewport (already `top-4 right-4` with `glass`, fine).

### Files touched

- `src/lib/farm.ts` — no schema change; `SavedAura.userId?` added so cards can check ownership cheaply (filled in by `mapAuraRowToSaved`).
- `src/lib/cloudAura.ts` — include `user_id` in `mapAuraRowToSaved` output.
- `src/components/AuraFarmCard.tsx` — cloud-aware delete; owner check (defensive — Farm should only show owner rows).
- `src/routes/aura.$id.tsx` — owner gating, always-hydrate Track shell from cloud, loading skeleton.
- `src/routes/aura.$id.influence.tsx` — owner redirect.
- `src/components/AuraLinkAuraCard.tsx` — audio `onError` → hide controls, show caption.
- Minor mobile classnames in `routes/aura.$id.tsx` and `routes/farm.tsx`.

### Out of scope (explicit)

- Producer credits, Fave 5, MySpace-style customization, new dashboards.
- Local→cloud migration prompt (existing flow already merges; no demo blocker).
- Re-architecting Farm to drop localStorage entirely (kept only as a hydration fallback).

### Acceptance verification

After the patch I'll spot-check: sign in → create Aura with upload → see in Farm → build AuraLink → open `/l/:slug` in a new tab → play Aura inline → refresh → still works → sign out → public page still works, no owner controls leak through.
