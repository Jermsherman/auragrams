## Landing page redesign + animated hero orb

Restructure `src/routes/index.tsx` hero to match the reference: a single-column, centered mobile-first layout with a large animated orb on top, a "See your sound" pill underneath, then the headline, description, and a single "Gain Aura" CTA. Keep nav, "How it works", "Features", and footer unchanged below.

### Hero layout (top → bottom, all centered)

1. Large animated orb (no left/right text column on mobile; centered on desktop too, max ~480px).
2. Pill button under the orb: small waveform icon + "SEE YOUR SOUND" (uppercase, tracked). Acts as a soft anchor link to the "How it works" section.
3. Headline: "Your song deserves" on line 1, "more than a link." in `text-aura-gradient` on line 2 — bold, centered.
4. Subcopy (existing description), centered, max-width readable.
5. Primary CTA: full-width-ish gradient pill "Gain Aura →" linking to `/create`.
6. Remove the "Gain Aura → Save to Farm → Build Auracle → Share AuraLink" caption from the hero (keeps it cleaner like the reference).

### New hero orb animation

Add a dedicated animated hero variant of the orb so the landing page feels alive without affecting the analytical orb used on `/aura/$id` and `/create`.

- Add an optional `hero?: boolean` (or `animated?: boolean`) prop to `OrbVisual` in `src/components/OrbVisual.tsx`. When true and there is no analyser/metrics, drive synthetic motion:
  - Synthesize a slow sine + small noise into the same `--orb-scale`, `--orb-glow`, `--orb-bass`, `--orb-shimmer`, `--orb-burst` CSS vars used by real audio, so the existing shell, halo, and particles already react.
  - Render the oscilloscope canvas with synthetic waveform data (sum of 2–3 sines at different frequencies, slow phase drift) so the orb shows the same horizontal "sound wave cutting across the orb" silhouette as the reference image.
  - Add a horizontal waveform overlay band: a second canvas (or the same one, two-pass) drawing a bright bloom waveform line across the orb's equator with strong glow on the center — this is the bright pink streak in the reference.
  - Add concentric ring highlights: 2–3 faint elliptical rings drawn on the canvas, slowly expanding outward and fading (radar-style), tinted with the palette's accent and glow stops.
- Keep current behavior intact when `hero` is false: existing analyser/metrics path remains the source of truth, no synthetic motion.

### Tailwind / CSS

- Reuse existing keyframes (`aura-pulse`, `aura-spin`, `aura-float-y`, etc.) from `src/styles.css`. No new keyframes required — synthetic vars are updated each frame in JS, which the existing shell already responds to.
- Use existing tokens: `bg-aura-gradient`, `text-aura-gradient`, `glass`, `font-display`.

### Files touched

- `src/routes/index.tsx` — restructure hero section only; keep "How it works", "Features", final CTA, footer untouched.
- `src/components/OrbVisual.tsx` — add `hero` prop + synthetic driver loop and waveform/rings overlay; default behavior unchanged.

### Out of scope

- No changes to `/create`, `/farm`, `/aura/$id`, mood/key/aura engine, or any other routes.
- No new dependencies.

### Acceptance

- Landing hero matches the reference: centered orb, "SEE YOUR SOUND" pill, bold gradient headline, subcopy, single "Gain Aura" CTA.
- Orb visibly animates on the landing page even without uploaded audio: pulsing glow, drifting shell, horizontal waveform streak, expanding rings.
- Other pages and the existing audio-reactive orb behavior are unchanged.