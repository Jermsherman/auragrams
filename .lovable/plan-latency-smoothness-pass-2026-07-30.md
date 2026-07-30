# Latency & Smoothness Pass

Goal: make the app feel fast and fluid — fewer dropped frames on the orb, faster first paint, less work happening off-screen. No visual redesign, no new features.

## What's causing the choppiness today

- Every orb runs its own `requestAnimationFrame` loop (audio ring, hero synthetic, idle micro-motion, atmosphere layer). Pages that show several orbs (My Auras, AuraLink view, home showcase) run many independent 60fps loops at once.
- Orbs keep animating even when scrolled out of view or when the browser tab is hidden.
- Canvas drawing uses `shadowBlur` heavily and CSS `blur()` / SVG turbulence filters on top — the most expensive paths in 2D canvas and compositing, re-applied per stroke each frame.
- Device pixel ratio is capped at 2 everywhere, so a phone renders 4x the pixels for decorative layers that don't need it.
- Heavy dialog code (image export) is bundled into pages that rarely use it, slowing initial load.

## Changes

### 1. One shared animation clock
Replace the per-orb `rAF` loops with a single shared ticker that all orbs subscribe to. One loop drives every orb on the page, so the browser schedules one frame of work instead of N.

### 2. Stop work nobody can see
- Pause an orb's animation when it scrolls out of the viewport (IntersectionObserver), resume on re-entry.
- Pause everything when the tab is hidden (`visibilitychange`).
- Idle (not-playing) orbs tick at a reduced rate (~24fps) instead of 60 — the motion is slow enough that it reads identically.

### 3. Cheaper drawing
- Drop `shadowBlur` from per-stroke canvas drawing; get the same bloom from a pre-rendered radial-gradient sprite drawn once per frame.
- Cap decorative-layer DPR at 1.5 on mobile / small orbs; keep 2 for the large hero orb only.
- Reduce atmosphere-layer particle counts on small viewports and skip the atmosphere canvas entirely for mini/card-size orbs.

### 4. Lighter list pages
On My Auras and AuraLink view, only the focused/hovered orb animates; the rest render a static first frame. Same look at a glance, a fraction of the cost.

### 5. Faster loads
- Lazy-load the share/story export dialogs (`html-to-image`) so they're fetched only when opened.
- Cache signed audio URLs in memory for their TTL so repeat plays and navigations skip a round trip.

## Technical notes

- New `src/lib/rafTicker.ts`: subscribe/unsubscribe shared ticker with per-subscriber fps budget, auto-stops when no subscribers or document hidden.
- `src/components/OrbVisual.tsx`: convert the four `useEffect` rAF loops to ticker subscriptions; add visibility gating; sprite-based glow; DPR tiering by orb size.
- `src/components/Aurascope.tsx`: pass an `animate` prop through so callers can render static orbs.
- `src/routes/farm.tsx`, `src/components/AuraLinkView.tsx`, `src/routes/index.tsx`: mark non-focused orbs static.
- `src/components/AuraShareDialog.tsx` / `StoryPreviewDialog.tsx`: `React.lazy` behind the trigger.
- `src/lib/audioStorage.ts`: memoize signed URLs keyed by path with expiry.

## Verification

Playwright run on home, My Auras and an Aura page capturing frame timing before/after, plus a check that orbs freeze off-screen and resume on scroll.
