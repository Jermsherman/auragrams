# Color Influence — Create Aura patch

Add an optional, collapsed-by-default "Color Influence" section to `/create`, with four modes (Surprise Me, Pick One Color, Build Palette, Describe a Color Vibe). User hints are blended into the Aura Engine palette — never replace it. Final palette + the user's choice persist with the Aura, and Aurascope renders the blended palette.

---

## 1. Data model

### `src/lib/aura.ts`
- New types:
  ```ts
  export type ColorInfluenceMode = "surprise" | "single" | "palette" | "description";
  export type UserColorInfluence = {
    mode: ColorInfluenceMode;
    colors: string[];      // hex strings, [] for surprise/description
    description: string;   // free text for "description" mode, "" otherwise
  };
  ```
- `generateAura(input)` gains an optional `userColorInfluence?: UserColorInfluence`.
- New helper `colorWordsToHex(text: string): string[]` — maps the canonical keywords from the spec (sunset, ocean, winter, neon, gold, dark, rose/pink, green, red, purple, plus extras: teal, blue, black, white) to 2–3 seed hexes. Implemented as a small lowercased keyword scan, deduped, capped at 5.
- Update `buildPalette(moods, kp, seed, influence?)`:
  - Compute the engine palette (current logic) → call it `enginePalette`.
  - Resolve `userSeeds: string[]`:
    - `surprise` / no influence → `[]`.
    - `single` → `colors.slice(0,1)`.
    - `palette` → `colors.slice(0,5)`.
    - `description` → `colorWordsToHex(description)`.
  - If `userSeeds.length === 0` → return engine palette unchanged.
  - Else blend per spec: roughly **50% engine / 35% user / 15% energy variation**.
    - `primary = mix(enginePalette.primary, userSeeds[0], 0.42)`
    - `secondary = userSeeds.length >= 2 ? mix(enginePalette.secondary, userSeeds[1], 0.45) : shiftHue(enginePalette.secondary, +/-10 from seed)`
    - `accent = userSeeds[userSeeds.length-1]` (preserved verbatim — guarantees ≥1 user color survives; for palette mode also force-include `userSeeds[0]` into swatches so ≥2 are preserved).
    - `glow = lighten(shiftHue(accent, ±15 by seed), 0.18)` — keeps the 15% energy/brightness variation.
    - `shadow = darken(primary, 0.55)`; `particle = lighten(shiftHue(accent, 30), 0.25)`.
    - `swatches`: dedup `[primary, secondary, accent, ...userSeeds, lighten(primary,0.18), glow]` capped at 6.
- `AuraProfile` adds:
  - `userColorInfluence?: UserColorInfluence`
  - `colorGuided: boolean` (true when influence mode !== "surprise" AND seeds resolved to ≥1 color).
- `paletteName(...)` stays the same; engine still picks a name (e.g. "Sunset Voltage"). When `colorGuided`, the name is unchanged but the profile carries the flag for the UI badge.

### `src/lib/tracks.ts`
- `Track` adds: `userColorInfluence?: UserColorInfluence; colorGuided?: boolean;`
- `hydrate()` carries them through.

### `src/lib/farm.ts`
- `SavedAura` adds the same two fields. `saveAuraFromTrack` copies them through.

### `src/lib/cloudAura.ts`
- Persist into the existing `extra: jsonb` column on `auras`:
  ```ts
  extra: { ...existing, userColorInfluence, colorGuided }
  ```
  No schema migration — `extra` is already `jsonb`.
- `color_palette` column already stores the final palette (`saved.colors`), and `palette_name` already stores the name. Nothing else to change.

---

## 2. UI: Create page

### `src/routes/create.tsx`
- New state: `colorInfluence: UserColorInfluence` (default `{ mode: "surprise", colors: [], description: "" }`) and `colorOpen: boolean` (default `false`).
- Insert a new section **after MoodPicker, before the Aurascope preview** inside the existing `glass-strong` block (or as its own glass card directly above it).
- Pass `userColorInfluence: colorInfluence` into `generateAura(...)` for the live preview and into the final submit `generateAura` call.
- Pass `colorInfluence` to `saveTrack` (via the `base` object) and into `saveAuraFromTrack` so it flows to Farm + cloud.

### New component `src/components/ColorInfluence.tsx`
- Collapsible card (chevron). Header reads **"Color Influence · optional"** with subtitle **"Suggest a color direction, or let Auragram find one from the sound."**
- Mode tabs (pill row): Surprise Me · Pick One · Build Palette · Describe.
- Body per mode:
  - **Surprise Me**: short copy "Auragram will blend a palette from your sound."
  - **Pick One Color**: a single `<input type="color">` + hex text input + label "Main glow color" + 24px swatch preview.
  - **Build Palette**: list of 2–5 color slots, each with a color picker, hex display, and remove button. "Add color" button (disabled at 5). Label "Blend these into the Aura". Reorder via simple up/down arrows (keep mobile-simple — no drag).
  - **Describe**: `<input>` with rotating placeholder cycling through the spec examples. Stores into `description`.
- Emits `onChange(UserColorInfluence)` whenever any sub-field updates; never blocks generation.
- Compact mobile sizing; uses semantic tokens only (`bg-background/40`, `border-border/60`, `text-muted-foreground`, `bg-aura-gradient` for active tabs). No raw colors except the user's chosen swatch backgrounds.

### Microcopy
- Section title: "Color Influence" (use "Guide the glow" as small helper line under it).
- CTA pills exactly as spec: Surprise Me · Pick One Color · Build Palette · Describe a Color Vibe.

---

## 3. Aura Profile updates

### `src/components/AuraProfileCard.tsx`
- Already shows `paletteName` and swatches. Add a small badge under the palette title when `colorGuided` is true:
  - Pill: **"Color-guided"** with sub-line **"Guided by your color suggestion"**, styled like the existing source-type badge but with `bg-aura-gradient/40`.
- New prop `colorGuided?: boolean`. Wire it from `aura.$id.tsx` and the live preview in `create.tsx`.

---

## 4. Aurascope visual

### `src/components/Aurascope.tsx`
- Already accepts `aura.colors` and uses them. Confirm and (if missing) ensure these are all derived from `colors`:
  - orb gradient (`primary → accent → glow`)
  - waveform ring stroke (use `accent`)
  - glass rim (use `glow` at low alpha)
  - halo (use `glow`)
  - particles (use `particle`)
  - progress accent in `AudioPlayer` (uses `colors.accent`)
- No engine changes needed beyond passing the blended palette — already in place. Audit pass only.

---

## 5. Aura page

### `src/routes/aura.$id.tsx`
- When regenerating vibe or recomputing, include the stored `userColorInfluence` so the regenerated aura preserves the user's color hint.
- Pass `colorGuided` to `<AuraProfileCard />`.

---

## 6. Acceptance mapping

1. Four modes exposed with default Surprise Me. ✓
2. `buildPalette` blend keeps engine weight ≥50%. ✓
3. mood/key/mode/energy still feed `enginePalette` and `paletteName`. ✓
4. `AuraProfileCard` already renders palette + swatches; adds Color-guided badge. ✓
5. `Track`, `SavedAura`, and `auras.extra` all persist `userColorInfluence` + `colorGuided`. ✓
6. Aurascope reads `colors` (final blended palette) — already wired. ✓
7. Section is collapsed by default, optional, mobile-compact. ✓

---

## Technical notes

- No DB migration: reuse `auras.extra jsonb` for `userColorInfluence` and `colorGuided`. `color_palette` already stores final palette.
- Color word map lives in `src/lib/aura.ts` next to `buildPalette`. Keywords match the spec table; add a small fallback that scans for raw hex (`#aabbcc`) inside the description and treats those as direct seeds too.
- All blending uses existing `mixHex / lighten / darken / shiftHue` helpers.
- Live preview already reruns `generateAura` on every state change in `create.tsx`; adding `colorInfluence` to its dep array is sufficient for a real-time Aurascope update.