# Band separation, home page curiosity pass, AuraLink builder audit

## 1. Fix: vocal core is currently driven by the same signal as the beat ring

### What the code does today (verified in `OrbVisual.tsx`)

| Band | Signal driving it | Notes |
| --- | --- | --- |
| Waveform ring | Full-mix time-domain waveform (`getByteTimeDomainData`), radius = base + sample × deform gain. Opacity follows overall RMS volume. | This is the "beat" ring. |
| Bass halo | Frequency bins 0–8% of spectrum (roughly sub–bass, under ~1.7 kHz on a 2048 FFT), averaged. Controls a second outer ring's radius/alpha — but its shape still traces **the same full-mix waveform**. | Reacts to kick/808. |
| Radar rings | Not audio-driven at all. Time-based expanding rings, and only in the hero/idle loop — it never renders during real playback. | |
| Vocal band | Amplitude comes from the 200 Hz–4 kHz frequency average (correct). **But the shape wobble reuses the same full-mix `waveData` array as the waveform ring.** | This is the bug. |

So the centered core visually mirrors the outer beat ring: same peaks, same phase, so it reads as "the same band twice."

### The fix

- Give the vocal core its **own shape source**: build a per-frame vocal spectrum profile from only the 200 Hz–4 kHz frequency bins (resampled around the circle) instead of the full-mix time-domain array. The core then bulges where vocal formants sit, not where the kick hits.
- Use a **slower, vocal-appropriate envelope** (fast attack, slow release, ~250 ms) and subtract a low-band floor so kick/bass bleed does not pump the core. Kick energy below 200 Hz already drives the bass halo; it should not drive the core.
- Rotate/offset the core slowly on its own phase so it never lines up with the waveform ring even when both are loud.
- Stop the bass halo from tracing the raw full-mix waveform. Give it a **low-band-only** contour (bass bins resampled) so it reads as a slow breathing ring, distinct from the crisp waveform ring.
- Make the radar band actually audio-driven during playback: emit a ring on **transient/onset** (already computed as `transient`/`peak`) instead of on a fixed timer, and render it in the real-audio loop, not only in hero mode. Today enabling "Radar rings" on a real Aura does nothing.

Result: four visibly distinct behaviours — sharp full-mix contour (waveform), slow wide low-end swell (bass), discrete onset pings (radar), centered vocal-only pulse (vocal core).

### Where the explanation lives for the user

Update the hint text in `src/lib/auraBands.ts` (`BAND_HINTS`) so each row in the band customizer states its actual source: full mix / low end below 200 Hz / beat onsets / voice range 200 Hz–4 kHz.

## 2. Home page: make it immediately curious and repeat-visit worthy

Current page: rotating showcase orb + specs, hero copy, "What exactly is an Aura?", 3-step how-it-works, AuraLink pitch, feature grid. It explains well but never lets the visitor *do* anything above the fold, and every visit looks the same.

Proposed changes, in priority order:

1. **Make the hero orb the interaction, not decoration.** Drop an audio file directly onto the hero orb (the landing handoff plumbing already exists) — the orb reacts live to the dropped file before any navigation. Curiosity converts into action in one gesture.
2. **Primary CTA above the fold.** Today the "Create Your First Aura" action sits below hero copy; move a single prominent CTA plus the drop target into the first screen, with the "no account needed to preview" line right under it.
3. **Make the showcase rotation feel alive and returnable.** Label it "Aura of the moment", advance on a shorter interval with a crossfade, and add prev/next taps so a visitor can flick through examples. Seed the order by day so a returning visitor sees a different one first.
4. **Add a short "Recently created Auras" strip** of public Auras (name, orb, mood) linking to their public pages — social proof plus a reason to come back. Read-only, public data only.
5. **Tighten the middle.** Merge "What exactly is an Aura?" and the feature grid into one section; the page currently repeats the same value proposition three times before the AuraLink pitch.
6. **Close with the AuraLink example**, showing a real public AuraLink preview card rather than a bullet list.

I will implement 1–3 and 5–6 as the pass; item 4 depends on whether you want public Auras surfaced on the landing page (see question below).

## 3. AuraLink builder evaluation + "Match Aura palette"

Current state (`AuraLinkBuilder.tsx`, `auralink.ts`): 10 preset themes plus a fully custom theme with background, primary accent, fonts, and decoration. Themes are entirely independent of the Auras the artist attaches, so a page with a warm-orange featured Aura can render on a cold blue theme.

Changes:

- **New "Match Aura palette" theme mode.** Pick one of your saved Auras as the palette source; the page background, accent, button tint, and glow derive from that Aura's stored `colors` (primary / secondary / accent / glow / shadow). Stored as a new theme mode alongside `preset` and `custom`, so existing pages are unaffected.
- **A one-tap "Match featured Aura" button** in the theme section that fills the custom theme fields from the currently featured Aura, so the artist can then tweak from there instead of starting blank.
- **Live theme preview** — the preview column re-renders on every theme change (already partly true; make the theme controls sit next to the preview rather than far below it).
- **Builder structure cleanup**: the builder is a single ~1,600-line component with profile, links, Auras, and theme stacked in one column. Split into clearly labelled steps (Profile → Links → Auras → Look → Publish) with the live preview pinned beside them. No behaviour change, just navigation.
- **Publish clarity**: surface the public URL and a copy button at the top of the builder, not only after saving.

## Technical notes

- `src/components/OrbVisual.tsx` — vocal core shape source, bass contour, radar onset trigger in the real-audio loop; no prop or data-model changes.
- `src/lib/auraBands.ts` — updated `BAND_HINTS` copy only.
- `src/routes/index.tsx` — hero drop target, CTA placement, showcase controls, section merge.
- `src/lib/auralink.ts` — extend `AuraLinkTheme` with an `auraMatch` mode + resolver branch in `resolveTheme`; existing preset/custom values keep working.
- `src/components/AuraLinkBuilder.tsx` / `AuraLinkView.tsx` — theme picker entry, match-from-Aura action, step layout.
- No database migration: AuraLink theme already stores a JSON object.
