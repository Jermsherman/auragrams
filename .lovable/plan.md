## Goal

Make the Aura orb genuinely react to uploaded audio using the Web Audio API, with oscilloscope-inspired motion, multi-band reactivity, and a visible waveform strip. Platform links keep the existing simulated mood-based animation.

## Scope

Uploads only. SoundCloud / Spotify / Apple Music / YouTube / external embeds stay simulated.

## Changes

### 1. New hook: `src/hooks/useAudioAnalyser.ts`

Replaces the older `useAudioReactive` style for the upload path (we keep `useAudioReactive` for backward compat but route the upload player through the new hook).

Returns refs (no per-frame React re-renders):

```ts
{
  analyserRef,       // AnalyserNode | null
  ensureGraph,       // () => void  (call on first Play)
  resume,            // () => Promise<void> (mobile unlock)
  metricsRef,        // { current: { waveform, frequency, volume, bass, mid, treble, transient, ready } }
  isReadyRef,
}
```

Internals:
- `AudioContext` + `MediaElementAudioSourceNode` + `AnalyserNode`.
- `fftSize = 2048`, `smoothingTimeConstant = 0.82`.
- Single shared `requestAnimationFrame` loop computes:
  - `waveform` peak-to-peak from `getByteTimeDomainData` (0..1)
  - `volume` RMS from waveform
  - `bass` (0–8% bins), `mid` (8–35%), `treble` (35–100%) from `getByteFrequencyData`
  - `transient` = positive delta on bass with exponential decay (kick/snare bursts)
- Smoothing per band with separate attack/release lerps (fast attack, slow release) and clamps to [0,1].
- On `ensureGraph` resume context if `state === "suspended"` (mobile fix).

### 2. `src/components/AudioPlayer.tsx`

- Switch to `useAudioAnalyser`.
- Call `ensureGraph()` + `resume()` inside the play button click.
- Pass `analyser` and `metricsRef` up via existing `onAnalyserReady` plus a new `onMetricsReady` callback.
- Add a thin canvas waveform strip below the existing scrubber:
  - Reads `metricsRef.current.waveform` array (uint8 time-domain) every frame.
  - Renders an oscilloscope line, stroked with a horizontal `linear-gradient` of the orb palette (purple → pink → orange) by sampling palette stops.
  - Progress overlay clipped at `currentTime / duration`.
  - Height ~28px, full width of the player. Hidden on the platform-link path because there is no analyser.

### 3. `src/components/OrbVisual.tsx`

Accept an optional `metricsRef` prop alongside the existing `analyser` prop. If `metricsRef` is provided, prefer it (already-computed bands, cheaper). Existing analyser path remains as fallback.

Tighten the rAF mapping:

| Source | CSS var | Mapped to |
|---|---|---|
| `volume` (RMS) | `--orb-scale` | overall scale 1.0–1.18 |
| `volume` + `mid` | `--orb-glow` | halo opacity 0.55–1.6 |
| `bass` | `--orb-bass` | outer halo scale 1.0–1.3 |
| `treble` | `--orb-shimmer` | particle opacity 0.4–2.0 |
| `waveform` peak | `--orb-deform` | edge wobble strength 0–14 |
| `transient` | `--orb-burst` | quick ripple flash 0→1, 250ms decay |

Add a new oscilloscope **waveform ring** layer inside the orb:
- An absolutely positioned `<canvas>` that renders a closed circular path whose radius is modulated by the time-domain samples (`r = baseR + sample * deformGain`).
- Stroked with a conic gradient sampled from `p.stops`, alpha tied to `volume`.
- Only mounted when `metricsRef` is present (i.e., uploads).
- Throttled to the orb's existing rAF; reuses `metricsRef.waveform` (no extra reads).

Bass halo scaling, mid surface motion (animation-duration multiplier), and high shimmer particle opacity already wired via CSS vars — just rebalanced.

Smoothing rule for non-jitter feel: each var updates with `lerp(prev, target, 0.18)` for slow envelopes (bass, mid, vol) and `0.35` for transients.

### 4. `src/routes/aura.$id.tsx`

- Pass `metricsRef` into `<OrbVisual />` for the upload path.
- Keep simulated path untouched for embeds / platform cards.
- Caption strings are already correct ("Aura reacting to Uploaded Audio" / "Aura generated from your selected mood and track identity") — no change.
- Existing "session expired" banner stays.

### 5. Fallbacks & errors

- If `AudioContext` construction or `createMediaElementSource` throws, log `console.warn`, leave `analyserRef` null, orb falls back to its current breathing animation. No user-facing error.

### 6. No changes

- `src/lib/session.ts`, `src/lib/farm.ts`, `src/lib/tracks.ts` — untouched.
- Platform / embed flow — untouched.
- No new npm dependencies. No `wavesurfer.js`, no `tone`. Pure Web Audio + canvas.

## File summary

- new: `src/hooks/useAudioAnalyser.ts`
- edit: `src/components/AudioPlayer.tsx` (use new hook, add canvas waveform strip)
- edit: `src/components/OrbVisual.tsx` (accept `metricsRef`, add waveform ring canvas, rebalance reactivity)
- edit: `src/routes/aura.$id.tsx` (wire metricsRef through)

## Acceptance

1. Upload an MP3, press play → orb visibly deforms with the waveform; bass kicks expand the halo; highs sparkle particles.
2. Waveform strip below the player draws a live oscilloscope line with a purple/pink/orange gradient and progress fill.
3. Mobile: first tap on Play unlocks the AudioContext (resume on suspended).
4. Spotify/SoundCloud/YouTube/Apple links still render embed or PlatformCard with simulated mood-based motion — no analyser attempted.
5. No localStorage writes of audio data; uploads remain object-URL-only (existing behavior preserved).
6. If analyser fails, orb falls back to the current breathing animation with no visible error.
