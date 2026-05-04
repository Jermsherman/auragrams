## Aura Engine v3 — patch plan

Scoped to the Aura generation pipeline + mood UI + orb wiring. No global redesign.

### 1. Rebuild `src/lib/aura.ts` as the engine

Replace the fixed 12 `PERSONALITIES` with a layered system:

- **`MOOD_TRAITS`** (54 moods): each has `colors: string[]` (hex), `motion: MotionKind`, `texture: TextureKind`, `particle: ParticleKind`, `speed`, `energyBias`, `phrases`. Source = the full mood list in the brief (Warm…Nocturnal).
- **`KEY_PROFILES`** for all 12 tonics × major/minor: `{ tonic, mode, emotionalBias: string[], colors: string[] }` from the music-theory map in the brief. Enharmonic equivalents share one entry (`F#/Gb`, `Db/C#`, etc.).
- **`PALETTE_NAMES`**: poetic 2-word bank ("Blue Hour Velvet", "Neon Mourning", "Dusk Tide"…) plus a generator that combines a color-word + texture/time-word seeded by track id, so names rarely repeat.
- **`AURA_NAMES`**: expanded bank from the brief ("Velvet Current", "Afterglow Theory", …) + procedural patterns: `{Color}+{Image}`, `{Emotion}+{Texture}`, `{Time}+{Motion}`, `{Element}+{Feeling}`. Heavily de-bias prior favorites ("Coastal Drift", "Quiet Drift", "Dark Glow") via a blocklist.

New core functions:

```ts
generateAura({ id, title, artist, moods, detectedKey? }) → AuraProfile
```

Returns:
```ts
{
  auraName, paletteName,
  palette: { primary, secondary, accent, shadow, glow, particle }, // all hex
  swatches: string[],          // 4–6 hex stops for UI
  stops: [s0..s4],             // OKLCH for orb conic (derived from hex)
  motion, texture, particle, particleCount, speed, hueShift,
  shape,
  energy, tempoBand, density,
  musicalKey, tonic, mode,     // mode: "major" | "minor" | undefined
  shortDescription,            // poetic 1–2 lines
  vibeDescription,             // human "feels like..." sentence
  motionKeywords: string[],    // e.g. ["drift","mist","pulse","shimmer"]
}
```

Color blending:
- Take 1–4 mood color sets + key colors → blend via weighted hex mixing (mood weight 0.6, key 0.4 with a small seeded jitter).
- Derive `shadow` (darken primary), `glow` (lighten/saturate), `particle` (accent shifted).

Description generation:
- Templates seeded by `hash(id|moods|key)`. Multiple sentence skeletons per mode (major/minor) avoid repetition. Vibe sentence pulls from a pool of "this song feels like…" frames keyed off motion + time-of-day + mood.

Backward compatibility: keep `PaletteKey`/`PALETTES`/`personalityFromMoods`/`getPersonality` exported. Old saved tracks (palette = "warm" etc.) still resolve to a personality object derived from the new engine using their stored mood key.

### 2. Mood picker — 4-slot + expanded set

`src/components/MoodPicker.tsx`:
- `MAX = 4`, counter shows `n/4`.
- Render full 54-mood list. Mobile: `max-h-[40vh] overflow-y-auto` scroll inside the card; pills wrap; subtle gradient fade at top/bottom.
- Selected pills: stronger gradient ring + glow using the *current preview palette's* glow color (so picker glows match the live aura).
- Disable unselected when `n === 4`.

`src/lib/aura.ts` `MOODS` const expanded to 54 labels (in brief order).

### 3. Audio key detection

New `src/lib/keyDetect.ts` — Web Audio + Krumhansl-Schmuckler chroma profile (no extra dependency, works in a Worker-friendly way; avoids Essentia.js bundle bloat).

```ts
detectKey(file: File): Promise<{ key: string; tonic: string; mode: "major"|"minor"; confidence: number } | null>
```

Steps: `decodeAudioData` → downsample to mono 11.025 kHz → take ~30 s window from middle of track → FFT in chunks → accumulate chroma vector (12 bins) → correlate against major + minor Krumhansl profiles for all 12 rotations → pick max correlation. Confidence = winner / runner-up ratio.

Fallback: if decode fails or confidence < 0.85, return `null` → UI shows `Key: Unknown` with optional manual selector.

Wired in `create.tsx` after file pick (background promise, doesn't block submit). Result stored on the Track as `detectedKey`. For platform links: skip detection, allow optional manual `musicalKey`.

### 4. Track + Aura data updates

`src/lib/tracks.ts` Track adds: `paletteName`, `swatches`, `palette` (the hex object), `tonic`, `mode`, `shortDescription`, `vibeDescription`, `motionKeywords`. Existing fields kept; hydrate() backfills via `generateAura`. SavedAura mirrors these.

### 5. Orb visual variation

`src/components/OrbVisual.tsx`:
- Accept an optional `profile?: AuraProfile`. When present, derive `stops/glow/atmosphere/motion/texture/particle/speed/particleCount/shape` from it instead of the static personality.
- `stops` come from the blended hex palette converted to OKLCH-ish CSS via `color-mix(in oklab, …)` fallbacks (or just use hex directly inside the existing `conic-gradient` — works in CSS).
- Particle color uses `palette.particle`. Halo uses `palette.glow`. Atmosphere uses `palette.shadow`.
- Motion/animation already switches on `motion` kind; keep that wiring. Energy multiplies `speed` and particle count: `count = base * (0.6 + energy/100)`.

`AuraAtmosphere.tsx` uses `palette.shadow` for the bg radial.

### 6. Aura Profile UI

`src/components/AuraProfileCard.tsx` extended:
- Aura name (gradient).
- Mood pills (up to 4).
- Key (or "Unknown" with optional inline `<select>` if `mode === "link"` and key not set).
- Energy bar (current).
- Palette name + swatch row (4–6 hex circles).
- Short description.
- Vibe description.
- Motion keywords as tiny chips.
- Mobile: wrap content in 3 `Collapsible` sections — Profile / Vibe / Palette — collapsed by default below `sm` breakpoint.

Used on both `/create` preview block and `/aura/$id`.

### 7. Files touched

- edit `src/lib/aura.ts` (engine rewrite, exports preserved)
- new  `src/lib/keyDetect.ts`
- edit `src/lib/tracks.ts` (Track fields, hydrate)
- edit `src/lib/farm.ts` (SavedAura fields)
- edit `src/components/MoodPicker.tsx` (4-cap, scroll, glow)
- edit `src/components/OrbVisual.tsx` (profile-driven palette)
- edit `src/components/AuraAtmosphere.tsx`
- edit `src/components/AuraProfileCard.tsx` (palette name, vibe, motion, collapsibles)
- edit `src/routes/create.tsx` (run keyDetect, pass detected key into generateAura)
- edit `src/routes/aura.$id.tsx` (use new profile fields)
- edit `src/routes/generating.tsx` if it pre-generates (pass detectedKey through)

### 8. Acceptance check

After implementation: pick 5 random combos (e.g. `[Melancholy, Intimate, Oceanic, Wistful] + E min`, `[Euphoric, Electric] + D maj`, `[Dark, Brooding] + C min`, `[Coastal, Hopeful] + G maj`, `[Romantic, Velvet] + Db maj`) and verify each produces distinct palette name, distinct swatches, distinct orb feel, distinct vibe sentence.
