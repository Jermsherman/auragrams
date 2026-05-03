# Auragram — Phase 2 Plan

Make every track feel like a living identity: a personalized aura profile, mood-driven palettes, an artist profile, an Instagram-ready story preview, and a richer share flow.

## 1. Mood + palette system (`src/lib/aura.ts`)

Single source of truth for moods, palettes, and aura-name generation.

- **Moods**: `Warm, Dark, Nostalgic, Euphoric, Chill, Cinematic, Romantic, Energetic, Melancholy, Dreamy, Coastal, Night Drive` — each tagged with a primary palette key.
- **Palettes** (5 presets, each = 4 oklch stops + a `--gradient-aura` and a `--shadow-glow`):
  - `warm-nostalgic` (purple / pink / orange / peach) — default
  - `dark-cinematic` (black / violet / deep blue / crimson)
  - `bright-euphoric` (blue / cyan / pink / white)
  - `coastal-dreamy` (teal / blue / lavender / soft pink)
  - `melancholy-romantic` (deep purple / rose / muted red / soft amber)
- **Palette resolver**: from selected moods, pick the palette of the dominant mood (first selected wins ties).
- **Aura name generator**: `[adjective from moods] + [noun from moods]` from a small curated list (e.g., "Coastal Nostalgia", "Velvet Midnight", "Glass Horizon"). Deterministic from `seed + moods` so the same upload always reads the same.
- **Energy**: deterministic 35–95% from seed, biased by mood (Energetic/Euphoric → high; Chill/Melancholy → low).
- **Description**: small templated sentence built from 2–3 selected moods.

## 2. Track model update (`src/lib/tracks.ts`)

Extend `Track` with:
```ts
moods: string[];
palette: PaletteKey;
auraName: string;
energy: number;
description: string;
streaming?: { spotify?: string; apple?: string; soundcloud?: string };
artistHandle?: string;        // slug from artist name
```
Backwards-compatible: existing Phase 1 tracks read with sensible defaults via a `hydrateTrack()` helper. Add helpers `listTracks()` and `listTracksByHandle(handle)`.

## 3. Orb upgrade (`src/components/OrbVisual.tsx`)

- Accept a `palette` prop (PaletteKey) — orb pulls gradient stops + glow from that palette via inline CSS variables, replacing the current global-only gradient.
- Add a soft particle layer (8–14 small dots floating with `animate-float-y`, opacity tied to `intensity`).
- Stronger reaction when audio plays (already wired via analyser); add a second layer that scales + glows from bass-band only.

## 4. Create page upgrades (`src/routes/create.tsx`)

After title/artist/source, add an optional **mood selector** (1–3 selectable):
- Pill buttons with subtle border; selected → palette gradient fill + glow + scale.
- Counter: "Pick up to 3".
- A live mini-orb preview reflects the chosen palette in real time.
- A small "What's your aura?" preview line shows the generated aura name.

On submit, persist `moods, palette, auraName, energy, description, artistHandle`.

## 5. Aura experience page upgrade (`src/routes/aura.$id.tsx`)

- Orb uses the track's palette.
- Below the player, an **Aura Profile card** (glass):
  - Eyebrow: `AURA PROFILE`
  - Aura name (display font)
  - Mood tags (pill chips)
  - Energy bar (palette-gradient fill, % label)
  - Short description
  - Color palette dots (4 swatches)
- Streaming buttons row (only renders when at least one URL is set): Spotify · Apple Music · SoundCloud — small glass pills with brand-tinted dot.
- Background hue subtly shifts to match palette (radial gradient overlay).

## 6. Share modal upgrade (`src/components/ShareDialog.tsx`)

Three actions stacked:
1. **Copy Auragram link** (primary)
2. **Share via device** (when `navigator.share` available)
3. **View Story Preview** → opens story modal

Plus a collapsible **"Add streaming links"** section with three inputs (Spotify / Apple / SoundCloud). Persisting updates the track in localStorage and re-renders the aura page chips. All optional.

## 7. Story Preview (`src/components/StoryPreview.tsx`)

A 9:16 vertical canvas (rendered as a styled `<div>` framed inside a Dialog at `aspect-[9/16]`, `max-h-[80vh]`):

- Full-bleed dark background tinted by palette
- Large animated orb centered (~70% width)
- Track title + artist below orb
- One mood tag chip
- Auragram logo watermark bottom
- Tagline: `Listen now · Open Auragram`

**Download**: render the DOM node to PNG using `html-to-image` (small, edge-safe, no native deps). Falls back to a toast "Saved to downloads" message. If rendering fails, show "Long-press to save" hint on mobile.

Add `bun add html-to-image`.

## 8. Artist profile page (`src/routes/artist.$handle.tsx`)

Public-feeling profile:
- Top: Auragram logo (left), share link (right)
- Hero: artist name (display), small bio (editable inline → saved to `localStorage` `auragram:artists:{handle}`)
- Featured aura: most recent track shown as a larger card with full orb + play
- Grid (1 col mobile, 2-3 desktop) of remaining tracks. Each card:
  - Mini orb (size 96–120) using the track's palette
  - Track title + mood tag
  - Play button (inline mini player using existing `AudioPlayer` for file tracks, or "Open" link for streaming-only)
  - "Open aura" → navigates to `/aura/:id`

If a handle has no tracks, show a graceful empty state with seeded demo tracks (Jerm Sherman: "South Shore Lady", "Midnight Thoughts", "Higher Ground") generated on the fly so the page always feels populated for demo links.

Auto-link from the aura page artist name → `/artist/:handle`.

## 9. Subtle polish

- Mood pill component reused in: create page, aura profile card, story preview.
- Page transitions: keep existing `animate-fade-up` consistently on hero blocks.
- Background tint per page driven by `--page-tint` set from palette.

## Files

**New**
- `src/lib/aura.ts` — moods, palettes, generators
- `src/components/MoodPicker.tsx`
- `src/components/AuraProfileCard.tsx`
- `src/components/StreamingLinks.tsx`
- `src/components/StoryPreview.tsx`
- `src/components/MiniOrb.tsx` (thin wrapper for sizes/perf)
- `src/routes/artist.$handle.tsx`

**Modified**
- `src/lib/tracks.ts` (Track shape, hydrate, list helpers, streaming, artistHandle)
- `src/components/OrbVisual.tsx` (palette prop, particles)
- `src/components/ShareDialog.tsx` (story preview, streaming inputs)
- `src/routes/create.tsx` (mood picker, live preview)
- `src/routes/aura.$id.tsx` (palette orb, profile card, streaming row, link to artist page)
- `src/styles.css` (palette variables + utility classes)

## Out of scope

Backend/auth, analytics, real audio analysis for naming, Reels/TikTok auto-post, video export, multi-aura editing tools, NFT/crypto language.
