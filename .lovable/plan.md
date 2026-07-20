## Move the audio player directly below the Aurascope

**Problem:** On the Aura reveal page (`/aura/$id`), the audio player already exists but is rendered far down the page (after the personality profile, traits, provenance, and action buttons). Users have to scroll past everything to play the song, which defeats the point of the reactive orb.

**Change (one file only, `src/routes/aura.$id.tsx`):**

Relocate the existing `<AudioUploadPlayer>` block (currently ~lines 660–690, inside `<div className="mt-8 w-full animate-fade-up">`) to sit immediately after the Aurascope container (after line 503), before the track title block.

- Keep all props and handlers intact (`onPlayingChange`, `onAnalyserReady`, `onMetricsReady`, palette, fileMeta, src).
- Wrap it in a `max-w-md mx-auto` container with `mt-6` so it sits snug under the orb.
- Remove the original block at the bottom to avoid rendering the player twice.
- No changes to the player component, analyser wiring, or any other logic.

**Why this is safe:**
- `analyserRef`/`metricsRef` are already wired via `force((n)=>n+1)`, so moving the mount point doesn't change reactivity — the Aurascope re-reads them on the next render regardless of DOM order.
- Nothing else in the page depends on the player's position in the tree.

**Not changing:** the player component itself, audio loading/session logic, insight/trait sections, guest claim flow, or styling of any other section.