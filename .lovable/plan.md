# Smarter Aura, Vibe, and Palette Naming

## Problem

In `src/lib/aura.ts`:
- `paletteName()` picks two random words from `COLOR_WORDS` × `TEX_WORDS` regardless of the actual palette swatches — so a green palette can be tagged "Violet Drift".
- `auraNameFor()` is similarly random across small banks (~40 names) and ignores the palette's true hue family.
- `vibeDescription` is one long sentence template, and the user has no real way to fine-tune it — "Edit the vibe" just replaces it, "Generate the vibe" rerolls it.

## Goal

1. Palette name reflects the real dominant hue(s) in `colors.swatches` (green → "Verdant …", not "Violet …").
2. Aura name draws from a much larger, mood + hue-aware space so names feel intentional and varied.
3. Vibe is 2–3 tight sentences; users can write/paste their own seed phrase that the generator *fine-tunes* rather than overwrites.

## Plan

### 1. Hue-aware palette naming (`src/lib/aura.ts`)

- Add `hexToHsl()` helper.
- Add a `HUE_FAMILIES` table keyed by hue range + lightness/saturation buckets, each with:
  - `colorWords` (e.g. red → `["Crimson","Ember","Rose","Garnet","Scarlet"]`, green → `["Verdant","Jade","Moss","Emerald","Chartreuse"]`, etc. — covering red, orange, amber/gold, yellow, chartreuse, green, teal, cyan, blue, indigo, violet, magenta, pink, neutral/grey, near-black, near-white).
  - Saturation/lightness modifiers (`Pale`, `Dusty`, `Neon`, `Deep`, `Smoked`, `Glass`, `Velvet`).
- New `paletteName(colors, seed, moods, kp)`:
  1. Compute dominant hue family from `colors.primary` + `colors.accent` weighted average (skip near-grey swatches by saturation threshold).
  2. If two distinct families dominate, build a two-tone name (e.g. "Ember & Jade Drift").
  3. Otherwise build `${modifier?} ${colorWord} ${textureWord}` where `textureWord` is still from `TEX_WORDS` but seeded so the same palette is stable.
  4. Keep the curated `PALETTE_NAME_BANK` only as a fallback when hue is ambiguous (very low saturation across the board → use "Ash/Pearl/Onyx + texture" forms).

### 2. Bigger, more intentional aura names

- Expand `AURA_NAME_BANK` and the pattern banks by ~3×, grouped by mood family (warm, blue, green, dark, dreamy, electric, etc.).
- Pull the hue family from step 1 into `auraNameFor()` so the `PATTERN_A_COLOR` slot is chosen from the family's color words instead of the global list. Result: a green-palette Playful track yields "Jade Bounce", "Verdant Halo", "Chartreuse Mirage" — not "Violet Tide".
- Keep musical-key & mood-mode biasing (minor → moodier nouns, major → brighter nouns) by splitting `PATTERN_A_NOUN` / `PATTERN_B_TEX` into minor/major-leaning sub-banks.
- Keep the `RECENT_BLOCK` dedupe; widen it slightly so repeats are rarer.

### 3. Condensed, editable vibe

- Change `generateDescriptions()` to return a `vibe` of **2–3 sentences** built from three pieces:
  1. Scene sentence (existing `VIBE_FRAMES` + `SCENE_BANK_*`, kept short).
  2. Color/motion sentence drawn from `personality.phrases` + the new hue family words.
  3. Optional closing line keyed by tempo + density (already available on `AuraProfile`).
- Add a new exported `refineVibe(userSeed: string, opts)` that:
  - If `userSeed` is empty → returns the fully generated 2–3 sentence vibe (current "Generate the vibe" behavior, just longer-form).
  - If `userSeed` is non-empty → keeps the user's wording as sentence 1 (lightly cleaned: trim, ensure trailing punctuation, cap length ~140 chars) and *appends* one generator sentence that matches mood + hue + tempo. This is the "fine tune" behavior.
- Wire `InfluenceAuraDialog.tsx` so the "Vibe note" textarea passes its value into `refineVibe` via the preview's `generateAura` call (extend `generateAura` input with `vibeSeed?: string`, plumbed into `generateDescriptions`). The "Generate the vibe" / "Edit the vibe" buttons on the Aura page continue to work; "Edit" now means "seed the generator", not "fully replace".
- Keep `track.influenceSettings.vibeNote` as the persisted user seed so re-opening the dialog shows what they typed.

### 4. Backward compatibility

- All existing `AuraProfile` fields remain. `vibeDescription` stays a string (just longer). No data migration needed.
- Existing saved Auras keep their stored `paletteName` / `auraName` / `vibeDescription` — the new logic only runs on regenerate/influence.

## Technical Notes

- All work stays in `src/lib/aura.ts` plus a small prop addition in `src/components/InfluenceAuraDialog.tsx` (pass `vibeSeed` into the preview `generateAura`).
- No backend, schema, or route changes.
- Pure functions remain pure and deterministic per seed + inputs.

## Files

- Edit `src/lib/aura.ts` (hue helpers, new `paletteName`, expanded `auraNameFor`, refactored `generateDescriptions`, `vibeSeed` on `generateAura`).
- Edit `src/components/InfluenceAuraDialog.tsx` (thread the vibe note into the preview generator).