# Aura polish pass — hero, upload, orb effects, unified profile

## 1. Hero cleanup (home)

- Remove the "See your sound" pill link above the headline in `src/routes/index.tsx`.
- The `#what-is-an-aura` section stays; it is still reachable by scrolling and from the how-it-works steps.
- Update the page `og:title` so it no longer reads "See your sound".

## 2. Refined upload experience (`src/routes/create.tsx`)

- Single, calmer upload surface: larger drop target, clear filename + duration + size line once a file lands, and a compact "replace file" affordance instead of the current stacked states.
- Merge the separate upload/analysis indicators into one continuous progress rail with named phases: Uploading -> Reading audio -> Detecting key & mood -> Building your Aura. Each phase ticks to a check when done.
- Keep helper text ("Upload an audio file to generate your Aura...") and the 72-hour guest preview note, but move them under the rail so the drop zone stays clean.
- No change to the analysis pipeline or storage logic.

## 3. Orb micro-motion and atmosphere (`src/components/OrbVisual.tsx`)

- Add always-on idle life even when nothing is playing: slow breathing scale, gentle drift of the highlight, and a soft outer glow that pulses on a long period.
- Add one auto-picked atmospheric effect per Aura, derived from mood + energy (no user choice):
  - Smoke — low energy, ambient/melancholy moods: slow drifting volumetric wisps.
  - Water — mid energy, dreamy/soft moods: refracting ripples that travel across the sphere.
  - Ember/Fire — high energy, warm palettes: rising sparks and heat shimmer at the base.
  - Lightning — high energy, dark/aggressive moods: rare arc flashes tied to strong onsets.
- Effect selection is deterministic from the Aura seed + traits so the same Aura always renders the same style, and it is surfaced as a small label in the profile.
- All effects are canvas-drawn in the existing render loop, respect `prefers-reduced-motion`, and throttle when the orb is off-screen.

## 4. Band accuracy audit (`src/components/OrbVisual.tsx`)

Verify and correct each band against the actual FFT data so the visual matches what is heard:

- Waveform ring — full-mix time-domain, correctly normalised so quiet tracks still move.
- Bass halo — sum only bins below 200 Hz, converted from bin index using the real sample rate (not a hardcoded assumption).
- Radar pings — spectral-flux onset detection with an adaptive threshold, so pings fire on beats rather than on loudness alone.
- Vocal core — 200 Hz to 4 kHz band with the low end ducked, independent of the bass and radar envelopes so it never mirrors the beat band.

Each band gets its own smoothing envelope; no shared state between them.

## 5. Aura result experience — one unified profile

**Story becomes user-written.**
- The AI no longer writes the Aura Story. Until the artist writes one, the section shows a short auto-summary built from the deterministic traits (mood, energy, key, tempo) — the existing vibe line.
- Owners get an inline "Write your Aura Story" editor (edit / save, ~420 char cap), saved to the Aura row.

**Remove Listener Moment** from generation, storage shape, and rendering.

**Merge Aura Profile + Signature/Trait sheet into one card.**

New single `AuraProfile` card, top to bottom:

```text
Aura Name              (hero, gradient)
Tier ribbon · Serial   (from trait sheet)
Signature line
Aura Story             (user-written or auto-summary)
Mood chips
Key · Energy · Tempo · Density  (compact trait grid)
Emotional DNA + Personality traits (merged trait tiles, tap to expand)
Palette swatches + atmosphere style
```

- `AuraProfileCard`, `SongPersonalityProfile`, and `TraitSheet` collapse into this one component; the trait chip strip used on Farm/AuraLink cards is preserved.
- Reveal animation is kept but simplified to one staged sequence over the single card instead of three competing sequences.
- `AuraRevealHero` continues to own the cinematic name reveal above the orb; the profile no longer repeats it.

## Technical notes

- `src/lib/auraInsight.ts`: drop `listenerMoment` and `story` from the generated shape (keep `auraName`, `emotionalDNA`, `personalityTraits`, `visualMeaning`); `isAuraInsight` and `normalizeInsight` updated accordingly, tolerating old rows that still contain the removed fields.
- `src/lib/auraInsight.functions.ts`: prompt updated to match the reduced shape.
- New `userStory` field stored alongside the existing vibe field on the Aura row (reuses the existing vibe update path — no schema change needed if `vibe_description` is reused; otherwise a single additive column).
- New `src/lib/auraEffects.ts` maps mood/energy/palette + seed to one of `smoke | water | ember | lightning`.
- No database restructuring, no changes to auth, storage, or AuraLink.
