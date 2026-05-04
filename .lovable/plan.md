# Expressive Aura System v2

Goal: every aura should feel like its own emotional organism — distinct shape, motion, texture, particle behavior, and atmosphere — not a re-tinted version of the same orb.

## 1. Expand the mood → personality mapping (`src/lib/aura.ts`)

Replace the current 5-palette system with a richer **AuraPersonality** record keyed by mood. Each personality bundles everything the visual layer needs:

```ts
type AuraPersonality = {
  key: MoodKey;                  // warm, nostalgic, dreamy, euphoric,
                                 // romantic, melancholy, dark, cinematic,
                                 // coastal, intimate, mysterious, energetic
  label: string;
  stops: [string, string, string, string, string]; // 5 oklch stops
  swatches: string[];
  glow: string;                  // halo tint
  atmosphere: string;            // background gradient color
  shape: "round" | "oval" | "soft-blob" | "tall" | "wide";
  motion: "breathe" | "pulse" | "tide" | "shimmer" | "drift" | "smoke";
  texture: "smooth" | "grain" | "silk" | "mist" | "smoke" | "ripple";
  particle: "dust" | "smoke" | "shimmer" | "mist" | "embers" | "tide";
  particleCount: number;         // 6 – 28
  speed: number;                 // 0.4 – 1.6 motion multiplier
  hueShift: number;
};
```

Add 12 personalities matching the requested moods (Warm, Nostalgic, Dreamy, Euphoric, Romantic, Melancholy, Dark, Cinematic, Coastal, Intimate, Mysterious, Energetic). Update `paletteFromMoods` → `personalityFromMoods` (first matching mood wins, deterministic fallback by hash).

Keep `PaletteKey` as a re-export alias of `MoodKey` so existing track data still loads; map the 5 old keys to the closest new personality.

## 2. Rewrite `OrbVisual.tsx` as layered render

Replace the current 4-layer orb with 6 stacked layers, all driven by the personality:

```text
┌─ ambient atmosphere (full-bleed radial, very soft)
│  ┌─ outer halo (blurred glow, breathes with bass)
│  │  ┌─ outer shell (conic, slow rotation, hue from palette)
│  │  │  ┌─ inner core (radial, audio-reactive scale)
│  │  │  │  ┌─ texture overlay (grain / silk / mist / smoke / ripple SVG)
│  │  │  │  │  └─ sheen highlight
│  │  │  │  └─ particle field (style + count from personality)
```

Key changes:
- Accept `personality` prop instead of `palette`; keep `palette` as deprecated alias.
- Shape: apply non-uniform `border-radius` / `scaleX/Y` per `shape` (oval, blob, tall, wide).
- Motion: swap the single `animate-spin-slow` for motion variants — `breathe`, `pulse` (sharper bass response), `tide` (slow XY sway), `shimmer` (rotating sheen), `drift` (slow translate), `smoke` (turbulence-style filter).
- Texture: SVG `<filter>` overlays for grain (feTurbulence + composite), silk (feDisplacementMap), mist/smoke (large blurred turbulence), ripple (animated displacement). Defined once in component, referenced by id.
- Particles: per-style sprite — round dust, blurred smoke puffs, sharp shimmer sparks, soft mist blobs, ember dots with warm glow, horizontal tide streaks. Count + speed from personality.
- Drop the global `--hue` rotation hack; colors come straight from palette stops so each mood looks distinct rather than hue-shifted from the same base.

## 3. Background atmosphere on the experience page (`src/routes/aura.$id.tsx`)

Add a fixed, behind-everything `<AuraAtmosphere personality={...} />` component:
- Two oversized blurred radial gradients using the personality's `atmosphere` + `glow` colors, slowly drifting.
- Subtle vignette so the orb sits in a "scene", not on flat black.
- Respects `prefers-reduced-motion`.

This is what sells the cinematic / coastal / intimate feeling beyond the orb itself.

## 4. Poetic descriptions (`descriptionFor` in `src/lib/aura.ts`)

Replace the current single-template description with a small grammar:

```text
"A {tone} {mood} aura with {colorPhrase}, {edgePhrase}, and {motionPhrase}."
```

Each personality contributes its own phrase pools, e.g.:
- Warm: tone=`warm coastal`, color=`sunset tones`, edge=`glowing edges`, motion=`slow tidal motion`
- Cinematic: tone=`deep cinematic`, color=`indigo and crimson shadow`, edge=`a smoldering halo`, motion=`a heavy pulse`
- Dreamy: tone=`weightless`, color=`lavender and cyan light`, edge=`a shimmering veil`, motion=`airy floating drift`

Pick deterministically from the seed so the same track keeps the same description.

## 5. Update consumers

- `MoodPicker.tsx`: drive previews from new personalities; show a small motion hint badge.
- `AuraProfileCard.tsx`: use `personality.swatches`; add a one-line "motion · texture · particle" descriptor under the energy bar.
- `StoryCanvas.tsx`: pass `personality` so exported story matches; ensure html-to-image still captures filters (use `cacheBust: true`, embed SVG filters inline — already inline so fine).
- `create.tsx` / `generating.tsx` / `artist.$handle.tsx`: switch `palette` prop → `personality`.

## 6. Performance + a11y

- Single `requestAnimationFrame` loop per orb (already the case); cap particle count at 28.
- Pause motion when `document.hidden` or `prefers-reduced-motion: reduce` (fall back to static gradient + halo).
- Texture SVG filters defined once per orb, not per particle.

## Files

Edited: `src/lib/aura.ts`, `src/components/OrbVisual.tsx`, `src/components/AuraProfileCard.tsx`, `src/components/MoodPicker.tsx`, `src/components/StoryCanvas.tsx`, `src/components/StoryPreviewDialog.tsx`, `src/routes/aura.$id.tsx`, `src/routes/create.tsx`, `src/routes/generating.tsx`, `src/routes/artist.$handle.tsx`.

Created: `src/components/AuraAtmosphere.tsx`.

No new dependencies.
