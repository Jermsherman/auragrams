## Goal

Improve Aura Profile creation across 4 dimensions:
1. Richer audio analysis from uploads/Raw Aura
2. Smarter, less repetitive mood detection
3. Stronger color↔emotion mapping with editable palette
4. More poetic, varied vibe language with editable Vibe + media player volume

This is a patch — no app-wide redesign. We extend existing `aura.ts`, `audioFeatures.ts`, `moodDetect.ts`, and add three small editor surfaces (Edit Vibe, Edit Palette, Volume).

---

## 1. Extend audio analysis (`src/lib/audioFeatures.ts`)

Expand `AudioFeatures` from the current 5 fields to a richer normalized object. Computed in the same single FFT pass — no new deps:

```text
loudness          (current rms)
peakLevel         max abs sample
dynamicRange      peak − avgRms
brightness        spectral centroid / nyquist (current)
bassEnergy / midEnergy / trebleEnergy   (current bands, but stored as 0..1)
lowEndDensity / midrangeDensity / highFrequencySparkle   relative band fullness
transientIntensity     short-window envelope deltas, 0..1
rhythmIntensity        autocorr of envelope, 0..1
zeroCrossingRate       0..1
densityScore           weighted blend of band fullness + rms consistency
energyScore            existing 0..100
warmthScore            mid + low-mid bias, 0..1
darknessScore          (1 − brightness) * (1 − rms), 0..1
softnessScore          1 − transientIntensity
aggressionScore        transientIntensity * (1 − warmthScore)
estimatedTempo         null for v1 (autocorr stub, optional)
```

`analyzeFile` and `analyzeBuffer` return this superset. Key/mode/pitchCenter stay where they are (`keyDetect.ts`).

For platform links: skip analysis, leave `audioFeatures` undefined — mood detection falls back to title+artist seed (already does).

## 2. Smarter mood detection (`src/lib/moodDetect.ts`)

Rewrite `suggestMoods` as a weighted, seeded picker over the **full 60+ mood pool** in `MOOD_TRAITS` (already exists in `aura.ts`; currently the function only returns a small repeated subset).

Algorithm:
1. Score every mood in `MOOD_TRAITS` against audio features (energy band match, brightness match, mode match, density match, warmth/darkness match, raw-recording bias).
2. Add a deterministic jitter `seed = hash(title + artist + energy + brightness + key)` so identical inputs are stable but small input changes shift the picks.
3. Enforce slot diversity: pick 1 from each "axis" (energy, brightness, key/mode, density/texture) when scores allow; never return only neighbors of the same archetype.
4. Avoid contradictory pairs (e.g. Serene + Aggressive) unless audio strongly supports both.
5. Return 2–4 moods.

Result: variety across tracks, no more "same 4 every time".

## 3. Aura Density label

Map continuous `densityScore` (0..1) to one of: Sparse, Airy, Light, Open, Balanced, Full, Dense, Heavy, Saturated, Layered, Overgrown. Store both `densityScore` and `densityLabel` on the aura. Show in `AuraProfileCard` as `Full · 72%`. Use score to scale particle count and orb opacity inside `Aurascope` (light touch — only multipliers on existing values).

## 4. Improved color engine (`src/lib/aura.ts` → `buildPalette`)

Extend `buildPalette` to accept `audioFeatures` and apply rules:
- major key → push hue toward warm/clear; minor → push toward cool/shadow
- high brightness → bias accent to cyan/silver/gold/neon
- low brightness → bias accent to violet/navy/burgundy
- high density → deepen shadow + raise saturation
- low density → lighten + raise transparency in glow
- high energy → increase contrast between primary/secondary
- low energy → soften contrast
- mood-to-color seed lists expanded per spec (Melancholy, Romantic, Euphoric, Dark, Coastal, Nostalgic, Electric, Soulful, Raw, Ethereal, Gritty, Nocturnal — most already present, fill any gaps).

Output adds: `shadowColor`, `glowColor`, `particleColor`, `waveformColor`, `backgroundColor` (all derivable from existing primary/accent/shadow). `swatches` continues to exist.

## 5. Richer naming + descriptions

Expand the existing `AURA_NAME_BANK`, `PALETTE_NAME_BANK`, and `SHORT_TEMPLATES_*` / `VIBE_FRAMES` / scene banks with the adjective/noun banks from the brief (emotional, texture, motion, noun lists). Keep the seeded picker — adds variety without breaking determinism. Block over-used tokens ("cool", "nice", "vibe", "Coastal Drift", "Quiet Drift").

Also add `textureKeywords` (2–4 words like velvet, mist, glass) alongside existing `motionKeywords`. Both come from selected moods' trait banks.

For Raw recordings: keep current bank but add the new "raw intimate signal…" templates from the spec.

## 6. Edit Vibe (modal)

New `<EditVibeDialog>` (new component). Trigger lives in:
- `AuraProfileCard` (replace inline VibeEditor block with "Edit Vibe" button that opens the modal)
- `aura.$id.tsx` action menu (already has "Influence Aura" — add "Edit Vibe" link that opens the dialog)
- `aura.$id.influence.tsx` already has these fields — keep that page; the new dialog is the lightweight version

Fields: vibe note (textarea), mood blend (existing `MoodPicker`), density preference (Auto / Airy / Balanced / Dense / Intense), Regenerate button, Save / Cancel.

On save: persist `vibeSettings = { vibeNote, moodTags, densityPreference, updatedAt }`, regenerate `auraDescription`, `vibeDescription`, `motionKeywords`, `textureKeywords` via `generateAura`. Update local + cloud (`updateAuraVibe` already exists; extend with palette/density fields). Toast: "Vibe updated."

## 7. Edit Palette (modal)

New `<EditPaletteDialog>`. Trigger in `AuraProfileCard` ("Edit Palette" button next to Edit Vibe) and on the Influence page.

UI: rename input + 4–8 color swatches each with a color picker (`<input type="color">`), Add/Remove swatch, Reset to generated palette, Save, Cancel.

Data:
```text
generatedColorPalette   snapshot from generateAura
finalColorPalette       what is rendered (defaults to generated)
paletteName             editable
paletteWasEdited        true once user saves an edit
paletteSettings: { paletteName, colors, wasEdited, updatedAt }
```

Aurascope reads `finalColorPalette ?? generatedColorPalette`. Cloud row stores both. Toast: "Palette updated."

## 8. Media player cleanup (`src/components/AudioUploadPlayer.tsx`)

- Add volume control: speaker icon + horizontal slider (0–100), mute toggle. Slider collapses behind the icon on small screens. Persist last volume per-session via `mediaSettings: { volume, muted }` in localStorage.
- Set `audio.volume` on change; `audio.muted` on mute.
- Remove file name from the "Reacting to …" caption in `aura.$id.tsx`. Replace with:
  - upload/raw: "Aurascope reacting to audio"
  - platform: "Aura generated from track identity"
- Keep the existing dark-glass styling.

## 9. Aura Profile UI cleanup (`AuraProfileCard.tsx`)

Add density row, palette name, texture keywords, Edit Vibe + Edit Palette buttons. Wrap long sections in collapsibles (Profile, Vibe, Palette) — already partially using `<Section>`.

## 10. Data model (`src/lib/tracks.ts`)

Extend `Track`:
```text
audioFeatures?: AudioFeatures           // full normalized object
detectedMoods?: string[]
userSelectedMoods?: string[]
densityScore?: number
densityLabel?: string
brightnessScore?: number
warmthScore?: number
darknessScore?: number
aggressionScore?: number
textureKeywords?: string[]
generatedColorPalette?: AuraPalette
finalColorPalette?: AuraPalette
paletteWasEdited?: boolean
vibeSettings?: { vibeNote; moodTags; densityPreference; updatedAt }
paletteSettings?: { paletteName; colors; wasEdited; updatedAt }
mediaSettings?: { volume; muted }
```

`hydrate()` backfills from existing fields so old tracks keep working.

## 11. Cloud sync (`src/lib/cloudAura.ts`)

Extend `updateAuraVibe` (or add `updateAuraProfile`) to also persist palette colors, palette name, density label, vibe settings, and mood tags into the existing `auras.extra` jsonb (no schema migration needed). `getPublicAura` already returns `extra` — read from it on hydrate.

## 12. Files to add / change

New:
- `src/components/EditVibeDialog.tsx`
- `src/components/EditPaletteDialog.tsx`
- `src/components/VolumeControl.tsx` (small subcomponent)

Edit:
- `src/lib/audioFeatures.ts` — extended features
- `src/lib/moodDetect.ts` — weighted picker
- `src/lib/aura.ts` — density label, color engine rules, expanded banks, texture keywords, audioFeatures input on `generateAura`
- `src/lib/tracks.ts` — Track model + hydrate
- `src/lib/cloudAura.ts` — extra fields
- `src/components/AuraProfileCard.tsx` — new fields, Edit buttons
- `src/components/AudioUploadPlayer.tsx` — volume control
- `src/routes/aura.$id.tsx` — caption, dialog wiring
- `src/routes/aura.$id.influence.tsx` — pass audioFeatures into generateAura, expose density preference

## Acceptance map (from brief)

1–16 covered above. Ecosystem (Aura, Aurascope, Farm, AuraLink, Auracle) untouched structurally — only the per-Aura profile gets richer.

## Out of scope

- No new audio libraries (Meyda/Essentia). All analysis stays in raw Web Audio.
- No tempo detection beyond a stub (`estimatedTempo` will be null in v1).
- No backend schema migration — everything new fits in `auras.extra` jsonb.
