# Auragram — Phase 1 MVP Plan

A premium, dark, cinematic web app where artists upload a song, get a unique animated "aura" orb, and share a beautiful track page.

## Brand foundation

- **Logo**: Save the uploaded logo to `src/assets/auragram-logo.png` and use it in nav, loading state, and footer.
- **Palette** (driven by the logo gradient): near-black background `#0A0710`, deep purple base, gradient accents purple → pink → peach → blue-violet.
- **Typography**: Clean modern sans (Inter for body, a wide-tracked geometric sans like Space Grotesk or wide-tracked Inter for the wordmark feel).
- **Style tokens**: Update `src/styles.css` with new dark palette, gradient utilities, glow shadows, glass panel variables.

## Routes

```text
/             Landing
/create       Upload flow
/generating   Ceremonial loading state (transient)
/aura/:id     Single track experience page
```

All as TanStack Start file-based routes under `src/routes/`. Each route gets its own `head()` metadata (title, description, og:title, og:description).

## 1. Landing page (`/`)

- Top nav: Auragram logo (left) · "Create Your Auragram" gradient CTA (right). Sticky, glass blur.
- Hero:
  - Large glowing animated orb (centered or right side on desktop, top on mobile)
  - Headline: **Your song deserves more than a link.**
  - Subhead: *Auragram turns every track into a living visual aura you can share instantly.*
  - Primary CTA → `/create`
  - Caption under CTA: *Upload → Generate → Share*
- "How it works" — 3 numbered steps with subtle icons/orbs.
- Feature cards (3): Living Visuals · Instant Sharing · Story-Ready Direction (coming soon).
- Final CTA band with secondary orb glow.
- Footer with small logo + minimal links.

## 2. Upload page (`/create`)

- Heading: **Offer your sound.** Subtext: *Upload your track and begin the transformation.*
- Fields: track title, artist name, audio file (drag-and-drop, .mp3/.wav), optional cover image.
- Drop zone with animated gradient border + soft glow; shows filename + size when chosen.
- Primary CTA: **Generate Aura** (disabled until file + title + artist provided).
- On submit: store track to `localStorage` keyed by generated id (title, artist, audio as object URL / data URL, cover, deterministic aura seed) → navigate to `/generating?id=...`.

## 3. Aura generation state (`/generating`)

- Full-screen dark, centered forming orb that gradually intensifies.
- Subtle particle / pulse animation; logo softly glows behind orb.
- Rotating copy: "Analyzing your sound…" → "Mapping motion, color, and energy…" → "Creating your aura…"
- 2.5–3.5s simulated, then `router.navigate` to `/aura/:id`.

## 4. Track experience page (`/aura/:id`)

- Top: small logo (left) · Share button (right).
- Center: large animated orb. Below: track title (large), artist name (muted).
- Custom audio player: play/pause, progress scrubber, time, volume (desktop only).
- Hidden `<audio>` element wired to a `useAudioReactiveOrb` hook:
  - Web Audio API: `AudioContext` + `AnalyserNode` → frequency data each frame.
  - When paused → slow breathing scale + hue drift (CSS-driven idle loop).
  - When playing → drive orb scale, glow intensity, and gradient rotation from bass/mid amplitudes.
- Microcopy under player: *Made to be shared.*
- Subtle small logo watermark bottom corner.

## 5. Share

- Share button opens a Dialog: Copy link · Native share (if `navigator.share` available).
- Copy → toast "Link copied" using existing sonner.
- Shared URL = current `/aura/:id`.

## Orb component (`OrbVisual`)

A reusable component used on landing hero, generating screen, and track page. Single SVG/CSS implementation:
- Layered radial gradients (purple → pink → peach → violet-blue) inside a circular mask.
- Conic gradient layer slowly rotating.
- Outer soft glow via large blurred box-shadow / filter.
- Props: `size`, `intensity` (0–1, drives glow + scale), `isPlaying`, optional `analyser` ref for live audio data.
- Idle: CSS keyframes for gentle breathing. Active: requestAnimationFrame updates CSS variables from analyser.

## Mobile

- Tailwind responsive: stack hero, larger orb on mobile (~70vw), thumb-friendly 48px controls, sticky nav stays minimal, generous vertical spacing.

## Persistence

- `localStorage` key `auragram:tracks` → `Record<id, Track>`.
- `Track` = `{ id, title, artist, audioDataUrl, coverDataUrl?, seed, createdAt }`.
- Seed (hash of id) deterministically picks gradient hue offsets so each aura looks unique.

## Files to add/change (technical)

- `src/assets/auragram-logo.png` (copied from upload)
- `src/styles.css` — new palette + gradient/glow tokens
- `src/components/Logo.tsx`, `Nav.tsx`, `Footer.tsx`
- `src/components/OrbVisual.tsx`
- `src/components/AudioPlayer.tsx`
- `src/components/ShareDialog.tsx`
- `src/hooks/useAudioReactive.ts`
- `src/lib/tracks.ts` (localStorage helpers, id + seed generation)
- `src/routes/index.tsx` (replace placeholder)
- `src/routes/create.tsx`
- `src/routes/generating.tsx`
- `src/routes/aura.$id.tsx`

## Out of scope (Phase 1)

Dashboards, analytics, profiles/multi-track lists, auth, real AI generation, server-side storage, NFTs, social feed, advanced editing.
