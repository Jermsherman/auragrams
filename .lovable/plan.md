## Goal

The full AuraLink builder already exists at `/auralink/create` (modes, identity, streaming/social/custom links, Aura selection, featured Aura, theme presets + custom colors, live preview, publish). The problem is that `/auralink` currently shows a *library*, so the "Linktree aspect" feels missing. We'll consolidate so `/auralink` *is* the builder again (matching the older working build), keep the library visible alongside it, polish the featured-Aura UI, and make Farm tiles inside the builder showcase each Aura's unique color palette.

No existing builder feature is removed. All current routes/components stay functional.

---

## 1. Route consolidation

- Make `/auralink` render the builder UI (move `BuilderPage` from `auralink.create.tsx` into `auralink.tsx`).
- Keep `/auralink/create` as a thin route that re-exports the same component (back-compat for any inbound link / `Nav.tsx`).
- Move the existing library list to a new section *inside* the builder page (top strip: "Your AuraLinks" — chips for each saved page with edit / open / delete, plus a "+ New" reset action). No separate `/auralink/library` route needed; this restores the single-page builder feel from the older build.
- Update `Nav.tsx` so the "AuraLink" tab → `/auralink` (already does) and `RootComponent`/redirects unchanged.

## 2. Edit existing AuraLink

- Builder accepts `?id=<auraLinkId>` search param. On mount, if present, hydrate all form state from `getAuraLink(id)` (title, artist, slug, description, image, mode, links, selectedAuraIds, featuredAuraId, theme/customTheme).
- `publish()` becomes "save": if editing, call `updateAuraLink(id, …)`; otherwise create new via `saveAuraLink`. Toast copy switches between "Published" / "Updated".
- Add a "New AuraLink" button that resets state + clears the `id` query param.

## 3. Featured-Aura UI polish

Inside the builder Auras section (order list):
- Replace the plain "Feature / Featured" pill with a card-style row: small Aurascope thumbnail on the left, track + Aura name, and a star-icon toggle on the right. When featured, the whole row gets a soft aura-gradient ring and the star fills with the gradient.
- Add a clear "Featured" header chip above the order list ("⭐ This Aura plays on your AuraLink hero").

In `AuraLinkView` (already renders featured as hero):
- When `featuredAuraId` resolves, add a subtle glow ring tinted by that Aura's palette around the hero Aurascope and a tiny "Featured" caption underneath the title.

## 4. Farm tiles showcase Aura colors

In the builder's selectable Aura grid (currently flat dark tiles):
- Tint each tile's background using `getPersonality(aura.palette).atmosphere` (same approach as `AuraFarmCard.tsx`), with a soft radial gradient from the top.
- Add a thin colored bar / dot row showing the Aura's top 3 colors (`aura.colors`) to make each tile visually unique even before the orb renders.
- Selected state: bump ring color to the Aura's primary color instead of a generic foreground tint.

## 5. Preserve everything else

- Streaming/social/custom links logic, theme picker (Midnight Glass, Sunset Pulse, Ocean Glow, Velvet Neon, Aurora Drift, Ember Smoke, Emerald Hour, Rose Quartz, Onyx Bloom, Minimal Dark) + Custom color theme — untouched.
- `AuraLinkAuraCard` mini-player (play/pause + progress, Aurascope reacts, no volume control) — untouched.
- `AuraLinkView` public renderer at `/l/$slug` — untouched aside from the small featured-glow polish in §3.
- Aura Farm, creation flow, Influence dialog, Aurascope, audio playback — untouched.

---

## Technical notes

**Files edited**
- `src/routes/auralink.tsx` — becomes the builder. Includes a top "Your AuraLinks" strip (reuses `getAuraLinks`, `deleteAuraLink`, `resolveTheme`) and hydrates from `?id=` for editing.
- `src/routes/auralink.create.tsx` — slimmed to `export { Route }` style wrapper that mounts the same `BuilderPage` component (moved into a shared file, e.g. `src/components/AuraLinkBuilder.tsx`).
- `src/components/AuraLinkBuilder.tsx` *(new)* — extracted builder so both routes use it.
- `src/components/AuraLinkView.tsx` — small featured-Aura glow polish only.

**No data-model changes**: `AuraLinkPage`, `THEME_LIST`, `PRESET_THEMES`, `DEFAULT_CUSTOM_THEME`, `migratePage` all stay as-is. `localStorage` key `auragram_auralinks` unchanged, so existing user data keeps working.

**No backend changes**: pages still persist to `localStorage` via `saveAuraLink` / `updateAuraLink` / `deleteAuraLink`.
