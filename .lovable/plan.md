# Band info, interactive home demo, discovery carousel, palette match toggle

## 1. Band drive info

Each reactive band already has a one-line hint, but nothing states the actual audio source in a consistent way.

- Extend `src/lib/auraBands.ts` with a `BAND_DRIVE` record: for each band a `source` ("Full mix", "Low end", "Onsets", "Voice range"), a `range` ("all frequencies", "below 200 Hz", "transient detection", "200 Hz – 4 kHz"), and a one-line `behaviour`.
- In `BandCustomizer`, show source + range as a small tag row under each band label, with the behaviour line as the existing hint.
- Add a compact "How your song drives the orb" panel (collapsible) on the Aura page beneath the orb, listing the four bands with their source/range and whether they are enabled for that Aura.
- Reuse the same data on the home demo as a legend, so the wording never drifts between screens.

## 2. Interactive home demo

Turn the hero from a static rotating showcase into something the visitor can drive.

- Hero orb becomes a live demo surface. Two input paths:
  - Drop or pick an audio file on the orb: it plays locally in the browser and the orb reacts in real time, with a "Continue and save this Aura" action that hands the file off to `/create` through the existing landing handoff.
  - No file: a "Play demo" button starts a short synthesized loop (WebAudio oscillators + noise for kick/voice-range content) so the bands visibly separate without shipping any audio asset or touching copyright.
- Under the orb, four band chips (waveform, bass, radar, vocal) toggle live so the visitor sees exactly what each band contributes.
- Playback stops on unmount and when the visitor navigates away; nothing is uploaded and no account is required.

## 3. Curated discovery carousel

- Replace the single "Show another" button with an "Aura of the moment" carousel over `SHOWCASE_AURAS`: prev/next controls, swipe on touch, dot indicators, and a slow auto-advance with crossfade that pauses on interaction and while the demo is playing.
- Order is seeded by the day so a returning visitor starts on a different Aura, while a single session stays stable across re-renders and SSR hydration.
- Each slide keeps the existing spec line (track, mood, energy, key) and gains the vibe line, so the carousel doubles as the "what is an Aura" teaching moment.

## 4. Aura palette match toggle

Today "Match Aura palette" is a one-shot copy into the custom theme; if the Aura's colors change the page does not follow.

- Add a real theme mode: `theme.mode = "auraMatch"` with a `sourceAuraId`, alongside the existing `preset` and `custom`. Existing pages are untouched.
- `resolveTheme` gains an `auraMatch` branch that derives background, primary/secondary accent, button tint and glow from the source Aura's stored `colors`.
- The builder gets a toggle at the top of the theme section: on, pick which attached Aura drives the palette (live preview updates immediately); off, fall back to the last preset/custom theme. The existing one-shot "copy into custom" action stays for people who want to hand-tune from there.
- `AuraLinkView` renders from the resolved theme, so the public page follows the Aura automatically.

## Technical notes

- `src/lib/auraBands.ts` — new `BAND_DRIVE` metadata; no config-shape change, so nothing stored needs migrating.
- `src/components/BandCustomizer.tsx`, `src/routes/aura.$id.tsx` — surface band drive info.
- `src/routes/index.tsx` — hero demo, band chips, carousel; new small components (`HeroDemo`, `ShowcaseCarousel`) so the route file stays readable.
- New `src/lib/demoTone.ts` — synthesized demo loop, created only on user gesture.
- `src/lib/auralink.ts` — `auraMatch` theme mode + resolver branch; `AuraLinkBuilder.tsx` / `AuraLinkView.tsx` — toggle and rendering.
- No database migration: the AuraLink theme column already stores JSON.
