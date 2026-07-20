# Aura Reveal & Share Polish

Lightweight presentation pass on `src/routes/aura.$id.tsx` and two new components. No changes to audio pipeline, DB schema, insight prompt, or trait logic — everything reuses data that's already generated and cached.

## 1. Cinematic Aura Reveal (aura.$id.tsx)

Reorder the reveal so the **Aura Name is the hero**, not a subtitle inside a card.

New layout when `revealActive` is true (fresh generation) or on first view of an insight-bearing Aura:

```text
┌─ backdrop: soft radial glow using aura palette + faint noise ─┐
│ [uppercase "AURA UNCOVERED" eyebrow]        fade @ 0ms         │
│                                                                │
│       ✦  {insight.auraName}  ✦   ← HERO, font-display 4xl-6xl  │
│                                    text-aura-gradient          │
│                                    letter-by-letter fade @120ms│
│                                                                │
│       {trackTitle} · {artistName}   fade @ 700ms               │
│                                                                │
│              ●  Aurascope orb  ●    scale-in @ 900ms           │
│              (reacts to audio when player plays)               │
│                                                                │
│       [ AudioUploadPlayer ]         fade @ 1200ms              │
│                                                                │
│       "Aura Story" italic pull-quote (first sentence of        │
│       insight.story, large)         fade @ 1500ms              │
│                                                                │
│       [Share Aura] [Save to My Auras]                          │
└────────────────────────────────────────────────────────────────┘

  Below the fold (unchanged):
  · Full SongPersonalityProfile (remaining sections)
  · TraitSheet
  · TraitProvenance / AuraLink actions / etc.
```

Implementation details:
- Add an `AuraRevealHero` component (new file) that renders eyebrow + name + subtitle + orb + pull-quote with staged timers. Uses `insight` when ready, gracefully falls back to `track.auraName` / `getPersonality(...).vibe` when still loading so the layout doesn't jump.
- Keep the existing `<SongPersonalityProfile>` but pass a new `hideHeader` prop so it no longer re-renders the Aura Name (moved to hero).
- Backdrop: absolute-positioned radial gradient using `aura.colors` (2 stops), pointer-events-none, blur, subtle grain via existing `bg-aura-gradient`.
- Animation: pure CSS transitions + `setTimeout` stages (matches current `SongPersonalityProfile` pattern). Name letters use a simple per-char span with staggered `--i` delays; no new libs.
- One-shot only: reuse the existing `revealActive` gate; refreshing doesn't re-trigger, matching current behavior.

## 2. Shareable Aura Card

New component `src/components/AuraShareCard.tsx` — an offline-renderable artifact designed for screenshotting.

Two variants selected via prop:
- `story` (9:16, 1080×1920 reference frame) — Instagram Stories / TikTok
- `square` (1:1, 1080×1080) — X / feed

Content (all from existing data, no new fetches):
- Auragram wordmark + tiny mark (top)
- Static orb rendering from `Aurascope` (`mode="minimal"`, `showLabel={false}`)
- Hero **Aura Name** (`insight.auraName`)
- Song title + artist
- 3 trait chips (`insight.personalityTraits.slice(0,3).map(t => t.trait)`) — falls back to `computeAuraTraits(track)` top 3 if insight not ready
- Short Aura Story: `insight.story` truncated to ~140 chars (already length-clamped upstream, but we cap for card)
- Footer: `auragram.link/l/{slug}` when public AuraLink slug exists, else `Auragram · Discover your song's Aura`

Rendering & export:
- New dialog `AuraShareDialog.tsx` opens from a **Share Aura** button on `aura.$id.tsx` (replaces / lives alongside current `ShareDialog` — keep old one intact for link sharing; new one is specifically the visual card).
- Tabs: `Story` / `Square`. Preview at 60% scale.
- Actions: **Download PNG** (via `html-to-image` — already used by `StoryPreviewDialog`), **Copy image** (best-effort `navigator.clipboard.write` w/ ClipboardItem; fallback to download), **Share** (Web Share API when available, sends the PNG blob + text `"My song's Aura: {auraName}"`).
- No server call; card is a pure DOM render of already-loaded state.

## 3. Wiring & touch-ups

- `aura.$id.tsx`
  - Replace the current inline "Aurascope + name subtitle" block with `<AuraRevealHero ... />`.
  - Add `hideHeader` prop to `<SongPersonalityProfile>` and pass it when the hero is showing the name.
  - Add new "Share Aura" button next to existing actions; opens `AuraShareDialog`.
- `SongPersonalityProfile.tsx`
  - Add `hideHeader?: boolean`. When true, skip the Aura Name block and start staged reveal from the Story section.
- No changes to `auraInsight.ts`, `auraInsight.functions.ts`, `auraTraits.ts`, DB, storage, or player.

## Files

Add:
- `src/components/AuraRevealHero.tsx`
- `src/components/AuraShareCard.tsx`
- `src/components/AuraShareDialog.tsx`

Edit:
- `src/routes/aura.$id.tsx` — reveal layout + share button wiring
- `src/components/SongPersonalityProfile.tsx` — `hideHeader` prop

## Out of scope

Audio analysis, insight prompt/model, trait engine, DB schema, storage, auth, AuraLink builder, public AuraLink pages. Untouched.
