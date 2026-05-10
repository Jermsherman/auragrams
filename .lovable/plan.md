# Fixes: AuraLink Builder, Influence Modal, Remove Volume

## 1. Fix AuraLink Builder (Linktree parity)

The builder (`src/routes/auralink.create.tsx`) and live preview are out of sync with the new `AuraLinkView` data shape:

- Builder saves links into the legacy `links` array and writes empty `streamingLinks`/`customLinks`/`socialLinks`. The public page works only because of read-time migration, but the **live preview is empty** and **social links are missing entirely**.
- No social links section, no featured-aura selection, and the layout feels like an afterthought next to the "aura" side.

**Changes (`src/routes/auralink.create.tsx`):**
- Replace single `links` state with three states: `streamingLinks`, `customLinks`, `socialLinks` (typed to match `AuraLinkPage`).
- Add a **Social Links** section (Instagram, TikTok, YouTube, X, Threads, etc.) using `SOCIAL_PLATFORMS` from `@/lib/auralink`.
- Section ordering for stronger Linktree feel: Mode → Identity → **Streaming** → **Social** → **Custom** → Auras → Theme.
- Add **Featured Aura** picker (sets `featuredAuraId`) when ≥1 Aura is selected.
- `previewPage` and `publish()` write the three split arrays directly (drop legacy `links`).
- Update `canPublish` to count all three arrays.

**Changes (`src/components/AuraLinkView.tsx`):**
- Render social links as a compact icon row (small pill buttons) above streaming buttons, matching Linktree-style hierarchy.
- Keep the existing playable Aura mini-player intact.

## 2. Influence Aura → Modal

Convert `Influence Aura` from a full route into an in-place dialog that opens from the Aura page's "Influence Aura" button (and from the just-generated state).

**Changes:**
- New `src/components/InfluenceAuraDialog.tsx` — wraps the existing controls (MoodPicker, ColorInfluence, Vibe Note, IdentitySelector, live preview) inside a `Dialog` from `@/components/ui/dialog`. Same save logic as the current route page (writes track, saves to Farm/cloud).
- `src/routes/aura.$id.tsx`: replace the `<Link to="/aura/$id/influence">` button with a button that opens `InfluenceAuraDialog`. Remove that link instance.
- `src/routes/generating.tsx` (or wherever the post-generate CTA lives): if it links to `/aura/$id/influence`, swap to opening the dialog on the Aura page (or pass a `?influence=1` query that auto-opens the dialog on mount).
- Keep `src/routes/aura.$id.influence.tsx` as a thin redirect to `/aura/$id?influence=1` so any existing share links still work. (No breaking deletes.)

## 3. Remove Volume Controls

Strip every volume UI from playback components.

**Changes (`src/components/AudioUploadPlayer.tsx`):**
- Remove `Volume2`, `VolumeX`, `Volume1` imports, `VOLUME_KEY` constant, `volume`/`muted` state, the persistence effect, `onVolumeChange`, `VolIcon`, and the entire "Volume row" JSX block.
- Leave the underlying `<audio>` element's default volume (1.0) — no `a.volume = ...` assignment.
- Internal `metricsRef.current.volume` (audio analyser RMS) **stays** — it drives Aurascope reactivity and is not user-facing volume.

No volume controls exist elsewhere; `AuraLinkAuraCard` and `OrbVisual` already have none.

## Files

**Edited:**
- `src/routes/auralink.create.tsx`
- `src/components/AuraLinkView.tsx`
- `src/routes/aura.$id.tsx`
- `src/routes/aura.$id.influence.tsx` (becomes a redirect)
- `src/components/AudioUploadPlayer.tsx`

**New:**
- `src/components/InfluenceAuraDialog.tsx`
