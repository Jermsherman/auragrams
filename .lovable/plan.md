## Goal

Introduce **Auracle** — a curated collection of multiple saved Auras (album / EP / playlist / demo pack / rollout) — alongside the existing Aura + Farm + AuraLink system. Farm remains the master library; Auracles are projects built from it.

Final ecosystem sentence everywhere user-facing:
> "Turn songs into Auras, save them to your Farm, group them into Auracles, and share them anywhere with AuraLinks."

---

## 1. Data layer — `src/lib/auracle.ts` (new)

localStorage key: `auragram_farm_auracles`.

```ts
export type AuracleProjectType = "album" | "ep" | "playlist" | "demo_pack" | "rollout";

export type Auracle = {
  id: string;
  createdAt: number;
  title: string;
  artistName: string;
  projectType: AuracleProjectType;
  description?: string;
  auraIds: string[];           // ordered
  // derived/cached
  moodTagsSummary: string[];   // top 4 moods across selection
  dominantPalette: PaletteKey; // most common palette
  auracleName?: string;        // optional alternate display name
  auracleDescription?: string; // generated from member auras
  shareUrl?: string;           // computed at runtime if absent
};
```

API:
- `getSavedAuracles(): Auracle[]` — sorted newest first
- `getAuracle(id): Auracle | null`
- `saveAuracle(input): Auracle` — generates id, derives summary fields
- `updateAuracle(a): void`
- `deleteAuracle(id): void`
- `isAuracleSaved(id): boolean`
- `addAuraToAuracle(auracleId, auraId)` / `removeAuraFromAuracle(...)`
- helpers: `summarizeMoods(auras)`, `pickDominantPalette(auras)`, `composeAuracleDescription(auras, type)`

Derivation reads from `getSavedAuras()` in `lib/farm.ts`. Project-type label map: Album, EP, Playlist, Demo Pack, Rollout.

---

## 2. Farm page — tabs

`src/routes/farm.tsx`: add a Tabs UI (existing `@/components/ui/tabs`) with two tabs:

1. **Auras** — current grid of `AuraFarmCard`.
2. **Auracles** — grid of new `AuracleCard`. Top-right: `Create Auracle` button → `/auracle/create`.

Empty Auracles state:
- Title: "No Auracles yet."
- Subtitle: "Group Auras from your Farm into a living project."
- CTA: "Create Auracle"
- Disabled with helper text "Save at least 2 Auras first" if `getSavedAuras().length < 2`.

---

## 3. New components

### `src/components/AuracleCard.tsx`
Premium card (4:5, glass, gradient ring), shows:
- Project-type badge (Album / EP / Playlist / Demo Pack / Rollout).
- Stacked mini-orbs: up to 3 overlapping `OrbVisual size={56}` using palettes/seeds of first 3 member Auras.
- Auracle title + artist name.
- "N Auras" + first 3 mood chips.
- Actions row: `Open Auracle` (Link to `/auracle/$id`), `Share Auracle` (opens `AuracleShareDialog`), trash (AlertDialog confirm).

### `src/components/StackedOrbs.tsx`
Tiny helper rendering N overlapping orbs given a list of `{palette, seed}`. Used by `AuracleCard` and detail header.

### `src/components/AuracleOrb.tsx`
"Blended project orb" — wraps `OrbVisual` with a CSS layer that overlays the palettes of member Auras at low opacity to imply a blended identity. Uses average energy to set scale/breath, dominant palette as base.

### `src/components/AuracleShareDialog.tsx`
Mirrors `ShareDialog` but for Auracles:
- Title: "Share Auracle".
- Copy Auracle Link (window URL or `/auracle/:id`).
- Native share.
- Story Preview button → `AuracleStoryDialog`.
- Open Public Auracle Page (Link).
- Copy success toast: "Auracle link copied."

### `src/components/AuracleStoryDialog.tsx` + `AuracleStoryCanvas.tsx`
9:16 export (reuse `html-to-image` like existing `StoryPreviewDialog`):
- Auragram logo watermark.
- Auracle title, artist, project type.
- Blended `AuracleOrb` centered.
- 3–5 mini Aura orbs in a row beneath.
- CTA text: "Listen to the Auracle".

---

## 4. Create flow — `src/routes/auracle.create.tsx` (new)

Page:
- Title: "Create Auracle".
- Subtitle: "Group Auras from your Farm into a living album, EP, playlist, or rollout."

Form:
- **Auracle title** (required)
- **Artist name** (required, prefilled from most recent saved Aura)
- **Project type** chip selector: Album · EP · Playlist · Demo Pack · Rollout (required)
- **Description** (optional textarea)
- **Select Auras from Farm**: grid of saved Auras (compact `AuraFarmCard` selectable variant). Selected cards get a glowing ring + check icon. Tap to toggle.
- **Order** the selected list below the grid as draggable rows. Use simple ↑ / ↓ buttons + drag handle (HTML5 drag) for ordering — no new dependency.

Sticky bottom bar (mobile-first, like Create page):
- `Create Auracle` button (disabled until title + artist + ≥2 Auras + projectType).
- Helper text: "Add a title, artist, and at least 2 Auras."

On submit → `saveAuracle(...)` → `nav({ to: "/auracle/$id", params: { id } })` + toast "Auracle created.".

Empty Farm state: redirect-style card with link to `/create` — "Save at least 2 Auras to your Farm first."

---

## 5. Detail page — `src/routes/auracle.$id.tsx` (new)

Public/shareable project experience. Structure:

- `AuraAtmosphere` using dominant palette of selection.
- Header: `Logo`, right side: `Save/Copy AuraLink-style` actions row → `Share Auracle`, `Story Preview`, edit (only if local), delete.
- Hero block (centered):
  - Project-type badge.
  - `AuracleOrb` (large, blended).
  - Auracle title (display font).
  - Artist name.
  - Description (or generated `auracleDescription`).
- Action row: `Share Auracle` (primary), `Story Preview`, `Copy Link`.
- **Tracklist**: ordered list of member Auras. Each row:
  - Track number.
  - Mini `OrbVisual size={48}` with member's palette + seed.
  - Track title + Aura name.
  - 1–2 mood chips.
  - Source badge (Uploaded Audio / platform name).
  - `Open Aura` link (→ `/aura/$id`).
- Footer: "A living project on Auragram".

Head meta uses Auracle title + artist + project type.

---

## 6. Aura page — Add to Auracle

`src/routes/aura.$id.tsx`:
- Add a secondary action under the primary row: small pill `Add to Auracle` (icon `Layers` or `FolderPlus`).
- Opens `AddToAuracleDialog` (new component) listing existing Auracles with checkboxes; saving updates `auraIds` of selected Auracles via `updateAuracle`.
- Bottom of dialog: `Create New Auracle` → `nav({ to: "/auracle/create" })` (the new page can preselect the current Aura via search param `?seed=<auraId>` — handled in step 4 by reading `Route.useSearch()`).
- Toast "Added to Auracle.".

---

## 7. Navigation + copy

- `Nav.tsx`: keep current items (Farm, Create) — no clutter. Inside Farm, the new Auracles tab + Create Auracle CTA.
- Landing page (`src/routes/index.tsx`):
  - Hero subheadline → "Turn songs into living Auras, save them to your Farm, group them into Auracles, and share them anywhere with AuraLinks."
  - "How it works": expand to 4 steps — Create Aura, Grow Your Farm, Build Auracles, Share AuraLinks. Use a 2×2 grid on `sm`+ to avoid crowding.
  - Footer chip line: "Create Aura → Save to Farm → Build Auracle → Share AuraLink".
- Farm page subtitle stays focused on Auras; Auracles tab introduces the concept inline.

---

## 8. Routing

New TanStack route files (auto-registered):
- `src/routes/auracle.create.tsx`
- `src/routes/auracle.$id.tsx`

Use flat dot-naming. Include `head()` + `notFoundComponent` on the detail route. `Route.useSearch()` on create route accepts optional `?seed=<auraId>`.

Do not edit `src/routeTree.gen.ts`.

---

## 9. Visual design rules

Auracle UI must feel premium / cinematic / curated, never like a folder, playlist row, or NFT collection page. Use:
- Dark background, glass cards, gradient rings, soft shadows.
- Stacked mini orbs as the visual signature for grouping.
- Generous spacing, minimal type, `font-display` for titles.
- No emojis. No "collection / album / playlist" as a primary product term.

---

## 10. Acceptance check (build-time)

1. localStorage key `auragram_farm_auracles` reads/writes via `lib/auracle.ts`.
2. `/farm` shows two tabs: Auras, Auracles.
3. `/auracle/create` builds an Auracle from ≥2 saved Auras with project type and order.
4. `/auracle/:id` renders blended orb, tracklist, share + story actions.
5. Aura page exposes optional `Add to Auracle`.
6. Sharing copies `Auracle link copied.`; native share + story export work.
7. Landing copy mentions Auracles in the ecosystem sentence and "How it works".
8. No new npm dependencies.
