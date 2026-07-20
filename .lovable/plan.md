# Auragram Product Audit — Findings & High-Impact Plan

## What's working
- Deterministic pipeline: audio → features (key, tempo, energy, density, palette, motion, texture) → `computeAuraTraits` → one canonical sheet per track. This already matches the "no gambling, no rerolls" philosophy.
- Palette + motion + texture derive from real DSP + palette personality — good foundation.
- `TraitSheet` layout is clean; serial + tier ribbon feel collectible.
- Guest → sign-up → claim flow is coherent.

## What's undermining the vision

### 1. Trait logic has hidden randomness / weak signals
- `serial` is a hash of `aura.id` (a UUID / nanoid), not of the music. Two identical uploads by two users produce different serials → "unique artifact" feeling is fake. Serial must be derived from an audio fingerprint (energy + key + tempo + palette + duration hash) so the same song → same serial for everyone. This is the single biggest authenticity bug.
- `energyTier` marks both `≤20` (Still) and `>80` (Volatile) as ~0.8 rare, but the middle 30-80 as 0.15-0.3. That's a U-curve masquerading as rarity — a very quiet ambient track and a very loud track both look "rare" for the same reason. Rarity should reflect distributional uncommonness, not just extremeness. Fix by using symmetric distance from the population mean of ~55 with a smoother curve, and rename tiers to be descriptive not rare-coded ("Still", "Hearth", "Charged", "Volatile" stand on their own — don't hand out rarity for being at either end).
- `tempoBand` / `density` fall back to "Balanced" / "Drive" when strings don't match — those defaults show up on many tracks and dilute meaning. Compute directly from numeric BPM / spectral-centroid bands already available in `audioFeatures`, not from stringified labels.
- `HUE_FAMILY_RARITY` values are hand-picked (blue 0.2, chartreuse 0.8). This is designer taste, not measured rarity. Either (a) drop the "rarity" label from Palette and just call it a signature, or (b) compute rarity from the observed distribution over saved auras (future). For MVP, do (a) — don't claim rarity we didn't measure.
- Weighting: `Math.pow(rarity, 0.9)` barely changes anything; a single "Mythic" trait can't lift the sheet. Use max-of-top-2 blended with mean so one genuine outlier can push the tier up — that's what makes reveals feel earned.

### 2. Trait names and copy are generic
- "Palette / Motion / Texture / Energy / Density / Tempo / Key" reads like an audio-plugin readout. The vision asks for memorable, handcrafted names.
- `detail` strings are near-identical across auras ("How the orb moves. 'Tide' is how this track breathes."). They don't teach anything specific.
- Fix: rename to evocative labels and generate a 1-sentence detail templated with the actual measured value:
  - Palette → **Hue** (e.g. "Ember & Jade — pulled between warm and cool, split 62/38")
  - Motion → **Cadence** ("Tide — swells every 3.4s, tracking your track's phrasing")
  - Texture → **Grain** ("Silk — smooth spectral roll-off, minimal high-end grit")
  - Energy → **Charge** ("Charged 74 — top 18% of tracks by transient intensity" — only claim percentile if we actually have it; otherwise drop the % and describe the feel)
  - Density → **Weight** ("Sparse — wide gaps between elements, room to breathe")
  - Tempo → **Pulse** ("Groove 108 BPM — mid-body, head-nod range")
  - Key → **Root** ("F# minor — sharp key, minor mode, tends melancholic")

### 3. Reveal experience is flat
- `/generating` runs a fixed 1.5s ring then jumps to the aura page with everything visible at once. That's a loading spinner, not a reveal.
- `TraitSheet` renders all 7 tiles simultaneously — no anticipation, no discovery.
- Fix on the aura page (post-generate only, gated by a `?reveal=1` search param so return visits don't re-trigger):
  1. Orb blooms in first, silent, ~800ms.
  2. Signature name + tier ribbon fade in (~400ms).
  3. Trait tiles stagger in one-by-one (~150ms each), rare traits (rarity ≥ 0.55) getting a brief glow pulse in the tier color.
  4. If the sheet contains a Radiant/Mythic combination, a subtle "Radiant combination" line appears below the sheet.
  5. Serial counts up (tabular-nums) from 000000 to final in ~600ms.
- Keep it under 4s total. No confetti, no sparkles-spam. Premium = restrained.

### 4. Copy still leaks visualizer language
- Landing: "Give Your Music A Living Identity" is good. Keep.
- "How it works" step labels (Upload / Generate / Share) are fine but generic — tighten to "Upload a song → Reveal its Aura → Share the artifact".
- `/generating` steps say "Mapping mood & motion… Translating feeling into color" — this is the visualizer voice. Replace with things a listener would say: "Reading your track's shape", "Finding the color it lives in", "Locking the signature". Same tone throughout.
- Rename "My Auras" empty state and CTAs to use "reveal" not "generate" where it fits the collectible framing ("Reveal your first Aura").

### 5. Determinism holes to close
- Serial → audio-derived hash (see #1).
- `computeAuraTraits` currently uses `getPersonality(palette).motion/texture`, which is a static map by palette key. Fine, but document it — the trait sheet must be pure function of `(palette, colors, energy, tempo, key, density, tonic, mode)`. Add a runtime assertion in dev that recomputing on the same input gives byte-identical output. This closes the "why did my sheet change?" trust gap forever.

## Deliverables (highest-impact only)

**A. Trait engine rewrite (`src/lib/auraTraits.ts`)**
- New label set (Hue/Cadence/Grain/Charge/Weight/Pulse/Root).
- Serial derived from `hash32(palette + tonic + mode + tempoBand + energyBucket + colorHexes)` — deterministic per-song, not per-row.
- Numeric tempo / density inputs where available; keep string fallbacks.
- Palette trait: drop rarity, keep as "signature" only (label + families still shown).
- Tier from `0.6*mean + 0.4*maxTop2` so a genuine outlier can lift the sheet.
- Detail strings templated with the actual measured value.

**B. Reveal sequence (`src/routes/aura.$id.tsx` + `TraitSheet`)**
- Add `?reveal=1` handoff from `/generating` → `/aura/$id?reveal=1`.
- `TraitSheet` accepts `reveal?: boolean`; when true, staggers tiles, glows rare ones, animates serial.
- One-shot: after reveal, strip the param via `router.navigate({ replace: true })` so refresh doesn't re-trigger.

**C. Copy pass**
- `/generating` step strings.
- `TraitSheet` footer + per-trait detail templates.
- Landing "How it works" 3 steps.
- Empty states / primary CTAs to "Reveal" where it lands naturally.

**D. Trust footer under the trait sheet**
- Replace current "Traits are derived from your track. One song, one sheet — forever." with a short 2-line block: "Every Aura is deterministic — the same song always reveals the same Aura, for anyone. No rerolls. No packs. No paid rarity."

## Explicitly NOT doing this pass
- No new audio DSP (spectral centroid % / percentile stats need a corpus we don't have yet — call it out in copy, don't fake it).
- No changes to `computeAura` pipeline, storage, RLS, or auth.
- No AuraLink builder changes.
- No monetization surfaces yet — just make sure nothing in the UI hints at packs/rerolls.

## Technical notes
- `TraitSheet` currently reads `traits.traits` with fixed order — switch to a stable sort by category so reveal order is: Hue → Cadence → Grain → Charge → Weight → Pulse → Root.
- `energyBucket` for serial = `Math.round(energy/10)` so tiny loudness jitter doesn't shift the serial.
- Rare-glow threshold stays at `rarity ≥ 0.55`.
- Keep existing `PALETTES` / `getPersonality` untouched — trait engine consumes them, doesn't redefine them.

```text
generate ──▶ /generating (unchanged UI, new copy) ──▶ /aura/$id?reveal=1
                                                        │
                                                        ├─ orb bloom
                                                        ├─ signature + tier
                                                        ├─ trait tiles (stagger)
                                                        ├─ serial count-up
                                                        └─ replace URL → /aura/$id
```
