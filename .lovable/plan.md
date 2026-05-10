## Make AuraLink playable + add a Links library

Three connected fixes:

### 1. Inline mini-player on AuraLink (the "wow moment")

`src/components/AuraLinkView.tsx` — replace the static Aura cards with playable cards.

- New `AuraLinkAuraCard` component (in same file or `src/components/AuraLinkAuraCard.tsx`):
  - Renders the Aurascope at top, animated/reactive.
  - Below it: a single row with **Play / Pause** button, **progress bar** (clickable to scrub), elapsed / duration.
  - Below that: **"Open Aura"** button (routes to `/aura/$id`).
  - Card body itself stays clickable → navigates to the Aura page (but Play and Open Aura buttons stop propagation so they don't navigate when clicked).
- Audio source: `aura.audioPublicUrl` (when present). If the Aura has no playable audio, hide the player row and show only the "Open Aura" button.
- Single shared `<audio>` element per AuraLink page (lifted into `AuraLinkView`) so playing one card pauses the others. Implemented with a small local context or a simple `useState({ playingId, audioRef })` pattern.
- Wire a Web Audio `AnalyserNode` from the shared `<audio>` to feed `Aurascope`'s `audioAnalysisData` so the visualizer truly reacts to the playing track.
- When the AuraLink has only **one** Aura, render the card in a larger "hero" variant: Aurascope is bigger, the player sits prominently right under it. When there are multiple, render compact cards in a list.

### 2. "Your Links" library

`src/routes/auralink.tsx` — new route at `/auralink` that lists every AuraLink the user has built (read via `getAuraLinks()`).

- Each row: thumbnail (profile image or featured Aura), title, slug, link count, theme swatch, last updated.
- Actions per row: **Open** (public `/l/$slug`), **Edit** (currently edit isn't implemented; for now this opens public view in a new tab — note for future), **Copy link**, **Delete**.
- Header: "Your AuraLinks" + a primary **+ New AuraLink** button → `/auralink/create`.
- Empty state: encourages first AuraLink with a CTA to `/auralink/create`.
- `src/components/Nav.tsx`: change the `AuraLink` nav item to route to `/auralink` (the library) instead of `/auralink/create` directly. The library is the new home; "create" remains accessible via the CTA.

### 3. Remove "Influence Aura" from Share dialog

`src/components/ShareDialog.tsx` — delete the dashed "Influence Aura" link block (lines ~254–261) and its unused `Wand2` import. "Influence Aura" already lives on the Aura page itself, where it makes sense; removing it from the Share dialog keeps that dialog focused on sharing.

### Files

**New:**
- `src/routes/auralink.tsx` (library list page)
- `src/components/AuraLinkAuraCard.tsx` (shared playable card + mini-player)

**Edited:**
- `src/components/AuraLinkView.tsx` (use new card; lift shared audio + analyser; hero layout when single Aura)
- `src/components/Nav.tsx` (AuraLink link → `/auralink`)
- `src/components/ShareDialog.tsx` (remove Influence Aura block)

No data-model changes, no migrations.
