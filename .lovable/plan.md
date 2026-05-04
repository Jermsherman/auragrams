
## Influence Aura

A new route at `/aura/$id/influence` lets users guide an existing Aura's mood, color direction, vibe note, and public identity. Auragram's engine still drives the final visuals — the user only "influences" them. No editor language anywhere in the UI.

### 1. New route: `src/routes/aura.$id.influence.tsx`

- Title: "Influence Aura"
- Subtitle: "Guide the mood, color, and public identity of this Aura."
- Loads the `Track` (and matching `SavedAura` if saved) by id; throws `notFound()` if missing.
- Local draft state seeded from current Aura:
  - `moods: string[]` (existing track moods, max 4)
  - `userColorInfluence: UserColorInfluence` (existing or `{ mode: "surprise", colors: [], description: "" }`)
  - `vibeNote: string` (existing `vibeDescription`)
  - `visibilityMode: "artist" | "username" | "anonymous"` (from saved Aura visibility, fallback "artist")
- Sections, in order:
  1. **Mood Blend** — reuse `<MoodPicker>` (max 4).
  2. **Color Influence** — reuse `<ColorInfluence>`.
  3. **Vibe Note** — `<Textarea>` labeled "Vibe Note", placeholder "Describe what this track feels like…", 240 chars.
  4. **Public Identity** — reuse `<IdentitySelector>` (artist / username / anonymous).
- **Updated Aura Preview** panel (sticky on desktop, below sections on mobile):
  - `<Aurascope>` rendered from a derived preview track
  - aura name, mood chips, palette swatches, short description, vibe description
  - Recomputed live via `generateAura({...track, moods, userColorInfluence})` whenever draft changes (memoized).
- Footer actions: "Save Influence" (primary, aura-gradient) and "Cancel" (ghost, navigates back to `/aura/$id`).
- Copy uses "Guide the mood", "Guide the glow", "Shape the vibe". No "edit/customize/settings/advanced".

### 2. Entry points (button label "Influence Aura" / "Influence")

- **`src/routes/aura.$id.tsx`**: add a glass button `<Sparkles/> Influence Aura` in the action grid (between Share and Story Preview on the secondary row) that navigates to the influence route.
- **`src/components/AuraFarmCard.tsx`**: add a small "Influence" pill button next to "Open AuraLink" linking to `/aura/$id/influence`. If `aura.colorGuided`, show a "Color-guided" chip near the source badge. The existing anonymous flag (when `visibility_mode === "anonymous"`) shows an "Anonymous" badge alongside the source badge.
- **`src/components/ShareDialog.tsx`**: add a subtle "Influence Aura" link at the bottom of the dialog content.

### 3. Save behavior

On "Save Influence":

1. Run `generateAura({ id: track.id + "-inf-" + Date.now(), title, artist, moods: draftMoods, detectedKey, pitchCenter, energyOverride: track.energy, sourceType, userColorInfluence: draftInfluence })` to produce new: `auraName`, `paletteName`, `colors`, `palette`, `description`, `vibeDescription`, `motionKeywords`, `density`, `tempoBand`, `colorGuided`.
2. If user typed a `vibeNote`, override `vibeDescription` with it (trimmed). Otherwise use generated.
3. `updateTrack(id, { moods, userColorInfluence, colorGuided, auraName, paletteName, colors, palette, description, vibeDescription, motionKeywords, density, tempoBand })` — preserves source/audio/title/artist/createdAt/streamUrl/embedUrl.
4. If the Aura is saved to the Farm or exists in cloud:
   - Re-run `saveAuraFromTrack(updatedTrack)` to refresh local Farm row.
   - Call `saveAuraToCloud(...)` with the new `visibilityMode`, artist profile id derived from current identity selection, and updated `SavedAura`. Reuse the existing aura `id` so the public AuraLink URL is unchanged.
5. Toast: `"Aura influence saved."`. Navigate back to `/aura/$id`.

If save fails on cloud, swallow with `"Influence saved locally"` toast (mirrors existing vibe-save fallback).

### 4. Data model updates

**`src/lib/aura.ts`** — extend the engine input to accept `vibeNoteOverride?: string` (no behavior change here; override is applied at the call site).

**`src/lib/tracks.ts`** — add to `Track`:
```ts
influenceSettings?: {
  moodTags: string[];
  userColorInfluence: UserColorInfluence;
  vibeNote: string;
  visibilityMode: "artist" | "username" | "anonymous";
  updatedAt: string;
};
```
Hydrate passes it through unchanged.

**`src/lib/farm.ts`** — add same `influenceSettings?` and `visibilityMode?` to `SavedAura`. Persist in `saveAuraFromTrack`.

**`src/lib/cloudAura.ts`** — extend `saveAuraToCloud` to write `visibility_mode` from the new value (already in row) and add `influenceSettings` into the existing `extra` jsonb. No DB migration needed — `extra` is already a free-form `jsonb` column and `visibility_mode` already exists on `auras`.

### 5. Public AuraLink

Because the same aura `id` is reused, `/aura/$id` and `getPublicAura(id)` automatically reflect the new palette, name, vibe, and visibility on next render. No new URL is created.

### 6. Acceptance checklist mapping

1. UI uses "Influence Aura" everywhere — verified via the new route, the Aura page button, the Farm card pill, and the Share dialog link.
2. Mood/color/visibility/vibe-note all editable in draft.
3. Preview re-renders on every draft change via memoized `generateAura`.
4. Source data (audio session, embed, title, artist, createdAt) untouched in `updateTrack`.
5. Farm cards expose Influence and the "Color-guided" / "Anonymous" badges.
6. Cloud row updated in place — public AuraLink reflects changes immediately.
7. No "edit / customize / settings / advanced" copy anywhere in the new surfaces.

### Files touched

- new: `src/routes/aura.$id.influence.tsx`
- edit: `src/routes/aura.$id.tsx` (Influence button)
- edit: `src/components/AuraFarmCard.tsx` (Influence pill, Color-guided / Anonymous chips)
- edit: `src/components/ShareDialog.tsx` (Influence link)
- edit: `src/lib/tracks.ts` (Track.influenceSettings)
- edit: `src/lib/farm.ts` (SavedAura.influenceSettings, visibilityMode)
- edit: `src/lib/cloudAura.ts` (persist influenceSettings into extra)
