# Premium visual upgrade pass

Purely visual and motion work. Same palette, same tokens, same features, same data. Motion turned up to a cinematic level, with `prefers-reduced-motion` still fully respected and the existing performance guards (shared RAF ticker, off-screen pausing, quality tiers) left intact.

## 1. Foundation — depth, light, materials

Extend `src/styles.css` with a proper material layer instead of the current two flat glass classes:

- Three glass tiers: `glass` (subtle), `glass-strong` (panels), and a new `glass-card` with a bright top edge, inner rim light, and a soft ambient drop shadow so cards read as physical objects.
- A gradient hairline border utility (conic aura gradient at low opacity) for hero panels and the profile card.
- Elevation shadow scale (`--shadow-1/2/3`) plus a colored glow that samples the current aura hue rather than a fixed purple.
- Specular sheen utility: a slow-travelling diagonal highlight for premium surfaces and buttons.
- Fine film grain / noise overlay at very low opacity over the page background to kill gradient banding.
- Motion primitives: staggered `reveal-up`, `mask-wipe` text reveal, magnetic hover lift, and a shared cubic-bezier easing token so every transition feels like one system.

## 2. Home / landing (`src/routes/index.tsx`)

- Hero panel gets the gradient hairline, layered parallax: the atmosphere drifts, the orb floats on a slower curve, and the copy translates slightly against scroll.
- Headline animates in as a mask-wipe per line, with the aura-gradient text getting a slow moving gradient rather than a static one.
- Showcase Aura crossfade becomes a real transition: outgoing orb dims and scales down while the incoming one blooms in, with the surrounding glow colour easing between palettes instead of snapping.
- How-it-works cards: sequential reveal on scroll, hover lift with light that follows the cursor.
- "What is an Aura" section gets a spotlight backdrop and an inner glow ring around the example orb.
- Footer CTA band: animated aura gradient sweep behind the buttons.

## 3. Aura reveal page (`src/routes/aura.$id.tsx`, `AuraRevealHero`, `AuraProfileCard`)

- Reveal becomes one continuous cinematic sequence: backdrop bloom → orb ignition (scale + glow overshoot, settling) → name letters wipe in → subtitle → profile card rising into place. One timeline, no competing sequences.
- Aura name gets a subtle chromatic shimmer that travels across the letters once on reveal, then rests.
- Profile card upgraded to a collectible object: gradient hairline, rim light, tier ribbon with metallic sheen, and a light 3D tilt that tracks pointer movement (disabled on touch and reduced-motion).
- Trait tiles and mood chips reveal with stagger and get a soft press/hover state.
- Palette swatches animate in as a spreading row with the atmosphere-style label fading in last.

## 4. Orb rendering (`src/components/OrbVisual.tsx`)

Same bands and same audio logic — only richer rendering at `quality: "high"`:

- Depth: add an inner-shadow terminator and a rim-light arc so the sphere reads as lit from one side rather than as a flat disc.
- Specular highlight gains a soft secondary bounce and drifts more expressively during idle.
- Bass halo becomes a multi-layer bloom instead of a single ring, so hits swell outward.
- Radar pings get a brief chromatic ripple on strong onsets.
- Idle life turned up: deeper breathing, slow surface caustics, and a very slow drift of the atmospheric effect layer.
- `quality: "low"` path unchanged so grids stay fast.

## 5. AuraLink public page (`src/components/AuraLinkView.tsx`, `src/routes/l.$slug.tsx`)

- Page entrance: background gradient blooms, avatar and name reveal, then link cards cascade in with stagger.
- Link/aura cards get the new card material, cursor-follow light, and a press-down interaction with a spring settle.
- Playing card gets a subtle audio-tied glow at its edge so the page feels alive while a track runs.
- Theme decorations layered with parallax against scroll.

## 6. My Auras + Create (`src/routes/farm.tsx`, `src/routes/create.tsx`)

- Farm grid: staggered card entrance, hover lift with the orb waking up smoothly (current instant-on becomes an eased ramp), refined empty state.
- Create: drop zone gets an animated gradient perimeter that reacts to drag-over, and the upload rail phases animate as a flowing light that travels the bar with each phase check springing in.
- Band customizer options get live micro-preview hover states.

## Technical notes

- All new colours derive from existing CSS variables and the per-Aura palette; no new hex values, no palette change.
- New keyframes and utilities go in `src/styles.css`; components consume classes rather than inline style blobs where practical.
- Every new animation is added to the existing `prefers-reduced-motion` block and defaults to a static end-state.
- Canvas additions run inside the existing shared ticker and visibility gating; no new RAF loops, no per-frame allocations.
- Pointer-tilt and cursor-light effects use CSS custom properties updated on pointermove, throttled to the frame clock.
- No changes to audio analysis, data model, routes, auth, or AI generation.
