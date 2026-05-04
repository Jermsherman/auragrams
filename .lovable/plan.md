# Auragram — Priority Upgrades

Six focused upgrades, in priority order. Each is small and isolated.

## 1. Visible action row on Aura page

The Aura page currently surfaces Save/Share through small icon buttons in the header. Add a clearly visible, primary action row directly under the orb (and song title block).

In `src/routes/aura.$id.tsx`, insert a new section after the title/description block (~line 192):

- Three side-by-side pill buttons:
  - **Save to Farm** (primary, `bg-aura-gradient`) — toggles to "Saved · Remove" when already in farm.
  - **Share AuraLink** — opens existing `ShareDialog` (lift its `open` state up so a custom trigger can open it).
  - **Story Preview** — opens existing `StoryPreviewDialog`.
- On mobile (current 393px viewport): stack as a 2-row grid (Save full-width on top, Share + Story side-by-side) so taps are large.
- Keep the small header icons as secondary affordances, but the new row becomes the primary CTA.

`ShareDialog.tsx` already wraps its own trigger; expose an optional `open`/`onOpenChange` controlled mode (and same for `StoryPreviewDialog` if not already controlled — it already is).

## 2. Stronger orb reactivity (waveform ring + edge deformation)

`OrbVisual.tsx` already draws a closed-path oscilloscope ring and applies `--orb-deform`. Push it further:

- **Edge deformation on the shell itself**: apply a CSS `clip-path: polygon(...)` derived from a coarsely sampled waveform (24 points) recomputed each frame, so the orb's silhouette literally breathes with the audio. Update `clipPath` via `style.setProperty` on the outer shell + texture layers (no React re-render).
- **Dual waveform rings**: render the existing oscilloscope plus a second, slightly larger ring drawn with `bass`-amplified radius and lower opacity for depth.
- **Stronger gain**: bump `deformGain` (`baseR * 0.32 + deform * 1.1`) and `tDeform` ceiling (peak * 22, clamp 22). Increase line width to `2.2 * dpr` and add a soft glow via `ctx.shadowBlur = 12; ctx.shadowColor = p.glow`.
- **Treble-driven inner sparkle**: tint the sheen layer's opacity from `--orb-shimmer`.
- Only enabled when a `metricsRef`/`analyser` is provided (i.e. uploaded audio); platform links keep current ambient motion.

## 3. Mobile landing orb placement

On 393px the hero grid drops to one column and the orb currently lands far below the CTA, leaving it visually disconnected.

In `src/routes/index.tsx` hero section:

- Use `grid md:grid-cols-2` order classes: text gets `order-2 md:order-1`, orb gets `order-1 md:order-2`.
- On mobile, render the orb at `min(64vw, 320px)` (smaller than current `78vw, 460px`) and reduce vertical padding (`pt-10 pb-14` mobile, keep desktop).
- Center the orb container with `justify-self-center` and a `mb-2` so it sits just above the headline.

## 4. Sticky Generate Aura CTA on Create page

The Generate button currently scrolls off-screen on mobile while users edit fields and pick moods.

In `src/routes/create.tsx`:

- Move the submit button out of the form flow into a `fixed bottom-0 inset-x-0` bar (mobile only, `sm:static` for desktop) with safe-area padding (`pb-[calc(env(safe-area-inset-bottom)+12px)]`) and a top-blur backdrop (`backdrop-blur-xl bg-background/70 border-t border-border/40`).
- Add `pb-28 sm:pb-0` to the main container so content isn't hidden under the sticky bar.
- Show a compact disabled state with helper text ("Add a track and at least one detail") when `!ready`.

## 5. Key + richer Aura Profile logic

Extend `generateAura` and `AuraProfileCard` to display more meaningful traits:

- In `src/lib/aura.ts`:
  - Add a deterministic **musical key** picker (e.g. `["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]` × `["maj", "min"]`, biased toward minor for melancholy/dark/mysterious and major for warm/euphoric/coastal/energetic).
  - Add **tempo band** ("slow", "mid", "fast") derived from energy.
  - Add **density** ("sparse", "lush", "dense") derived from mood + a hash bit.
  - Return these from `generateAura` as `key`, `tempoBand`, `density`.
- Extend `Track` type in `src/lib/tracks.ts` and `SavedAura` in `src/lib/farm.ts` with the optional fields. Backfill defaults via `getPersonality` when missing.
- In `AuraProfileCard.tsx`, render a small grid below the Energy bar:
  - **Key · A min**, **Tempo · Mid**, **Density · Lush**, **Motion · drift** (already there)
- Keep the existing description sentence; append one more clause referencing the key feel ("…in a minor key.").

## 6. Refined Farm cards

`AuraFarmCard.tsx` works but feels list-y. Make the saved Aura feel like a collectible:

- Move orb to a centered hero position (88 → 120px) on a soft gradient background derived from `personality.atmosphere`.
- Title block underneath, centered.
- Mood chips row below.
- Bottom action row: full-width "Open AuraLink" pill + small trash icon trailing.
- Use `aspect-[4/5]` card so all cards align in the grid.
- Add a subtle hover lift (`hover:-translate-y-0.5 transition-transform`) and a thin gradient ring (`ring-1 ring-foreground/10`).

## Technical notes

- No new dependencies.
- All changes are local to existing files except the typing additions in `tracks.ts` / `farm.ts`.
- `clip-path` is used inside the existing `requestAnimationFrame` loop; values are written via inline `style` strings to avoid re-renders.
- All audio-reactive enhancements are gated behind `metricsRef`/`analyser` so platform-link auras are unaffected.
- All pages remain SSR-safe; new logic stays inside `useEffect` or event handlers.
