## Aurascope Visual System

Build a single reusable `Aurascope` component that wraps the existing `OrbVisual` in a glassmorphic oscilloscope lens, then route every Aura surface through it. The `OrbVisual` we already have (orb + clip-path waveform shell + canvas oscilloscope rings + horizontal trace) becomes the inner lens. Aurascope adds the framed shell, grid, particles, and labels around it, plus a normalized props API.

### What gets built

```
src/components/aurascope/
  Aurascope.tsx          — main component, props API, size + mode variants
  AurascopeShell.tsx     — glass outer frame (rounded square / circular)
  AurascopeGrid.tsx      — SVG oscilloscope grid (center lines, ticks, ring marks)
  AurascopeWaveRing.tsx  — SVG circular waveform path (audio or simulated)
  AurascopeParticles.tsx — small CSS/SVG particle layer reacting to treble/mood
  AurascopeLabel.tsx     — title + identity + tiny "Aurascope" caption
src/lib/
  auraColors.ts          — normalize aura → {primary,secondary,accent,shadow,glow,particle} + CSS vars
  auraMotion.ts          — mood/key/energy → simulated motion params (amplitude, speed, jitter)
  waveformToCircularPath.ts — smooth circular SVG path from Uint8Array
src/hooks/
  useAurascopeMotion.ts  — single rAF loop driving simulated metrics when no analyser
```

### Props API

```ts
type AurascopeProps = {
  aura: Track;               // existing Track type already has palette/colors/mood/key/sourceType
  size?: "large" | "medium" | "small" | "mini";
  mode?: "full" | "minimal" | "card" | "story";
  isPlaying?: boolean;
  audioAnalysisData?: {       // optional; when missing → simulated motion
    analyser?: AnalyserNode;
    metricsRef?: React.RefObject<AudioMetrics>;
  };
  showLabel?: boolean;
  showControls?: boolean;
  interactive?: boolean;
  className?: string;
};
```

Internally Aurascope passes `analyser` / `metricsRef` straight into the existing `OrbVisual` (which already drives clip-path and canvas rings from those). When neither is present and `mode !== "minimal"`, `useAurascopeMotion` synthesizes a soft waveform from mood/key/energy and feeds the SVG ring + particles.

### Layered structure (z-order, per spec)

```
[AurascopeShell]  rounded-2xl glass, gradient rim tinted by aura.glow
  └─ [AurascopeGrid]      SVG, low opacity, scales with size
  └─ [AurascopeWaveRing]  circular SVG path (smooth, rounded caps, faint trail copy)
  └─ [OrbVisual]          existing orb + horizontal trace canvas (passed profile/palette)
  └─ [AurascopeParticles] absolute, count scales with size + treble
  └─ [AurascopeLabel]     full/story modes only
```

Glass shell uses `backdrop-filter: blur(24px)`, deep `oklch(0.12 0.04 280 / 0.55)` background, inner highlight border, and an outer halo gradient driven by `--aura-glow`. CSS variables `--aura-primary/secondary/accent/glow/shadow/particle` are set on the Aurascope root from `auraColors.ts`.

### Size & mode matrix

| size   | container        | grid | particles | label   | typical use            |
|--------|------------------|------|-----------|---------|------------------------|
| large  | min(88vw,460px)  | yes  | full      | yes     | /aura/$id              |
| medium | 220px            | yes  | reduced   | optional| Auracle track / preview|
| small  | 140px            | faint| 4–6       | no      | Farm cards             |
| mini   | 56–72px          | none | none      | no      | stacked badges         |

| mode    | layers                                          |
|---------|-------------------------------------------------|
| full    | shell + grid + ring + orb + trace + particles + label |
| minimal | shell + ring + orb                              |
| card    | shell + ring + orb + tiny title                 |
| story   | 9:16 framing, full layers, watermark            |

`small` and `mini` opt out of the canvas oscilloscope rings (pass a flag to `OrbVisual` to skip the heavy canvas loop). Only one Aurascope per page runs the full canvas; cards use SVG-only ring for performance.

### Audio reactivity

- Reuses the existing `useAudioAnalyser` hook + `AudioMetrics` ref.
- `OrbVisual` already maps volume→scale, bass→halo, treble→shimmer, peak→clip-path deform — keep as-is.
- The new `AurascopeWaveRing` SVG samples `metricsRef.current.waveform` (or `analyser.getByteTimeDomainData`) each frame via the shared rAF loop, produces a smoothed circular path with `waveformToCircularPath`, and draws a 30%-opacity duplicate trail underneath.
- When neither analyser nor metrics is available, `useAurascopeMotion` generates a sine+noise waveform parameterized by mood/key/energy — slow & low for melancholy/minor, fast & jittery for electric/euphoric, etc.

### Color integration

`auraColors.ts` normalizes a `Track` to the 6-slot palette:
```
primary    = colors?.primary    ?? stops[0]
secondary  = colors?.secondary  ?? stops[1]
accent     = colors?.accent     ?? stops[2]
shadow     = colors?.shadow     ?? atmosphere
glow       = colors?.glow       ?? glow
particle   = colors?.particle   ?? accent
```
These are written as CSS vars on the Aurascope root and consumed by every layer.

### Surfaces to migrate

Replace direct `OrbVisual` usage with `Aurascope`:

- `src/routes/aura.$id.tsx` — line 179: `<Aurascope aura={track} size="large" mode="full" isPlaying={...} audioAnalysisData={{analyser, metricsRef}} showLabel />`
- `src/routes/farm.tsx` (via `AuraFarmCard.tsx` line 64) — `size="small" mode="card"`
- `src/routes/auracle.$id.tsx` line 214 — track items use `size="medium" mode="minimal"`; the hero (line 80) uses a new "blended" Aurascope built from the Auracle's tracks (averaged palette + dominant mood + mean energy via a small `blendAuras()` helper)
- `src/routes/auracle.create.tsx` lines 224, 255 — `size="mini" mode="minimal"`
- `src/components/StoryCanvas.tsx` & `AuracleStoryDialog.tsx` — `mode="story"`
- `src/routes/index.tsx` line 36 (hero) — `size="large" mode="full"` with `hero` synthetic motion (forwarded into OrbVisual's existing `hero` prop)
- `src/routes/create.tsx` line 684 preview — `size="medium" mode="card"`
- `src/components/StackedOrbs.tsx`, `AuracleOrb.tsx`, `artist.$handle.tsx` — `mini`/`small` as appropriate

`OrbVisual` itself stays; Aurascope composes it. We pass through `profile`, `palette`, `analyser`, `metricsRef`, `isPlaying`, `hero`, and a new `compact` flag to skip the canvas in small sizes.

### Performance rules

- One shared `requestAnimationFrame` loop per Aurascope; small/mini sizes use a 20fps throttle.
- Farm grids: SVG ring only, no canvas, no particles.
- `IntersectionObserver` on the Aurascope root pauses the rAF loop when offscreen.
- `prefers-reduced-motion` clamps amplitude and disables particles.

### Acceptance verified by

1. `Aurascope` exported from `@/components/aurascope`.
2. Every former `OrbVisual` call site renders an Aurascope (except inside Aurascope itself).
3. /aura/:id, /farm, /auracle/:id, story dialogs, and landing hero all show the glass lens.
4. Uploaded audio drives smooth circular waveform + orb motion; platform-only auras use simulated motion.
5. The ring is smooth (rounded caps, sampled & mildly low-passed) — no sawblade.
6. Mobile: large lens caps at 88vw; cards stay lightweight.
7. Visual identity reads as "Apple-glass oscilloscope" — translucent shell, faint grid, luminous orb, neon ring tinted by aura palette.

No backend changes. No new dependencies.