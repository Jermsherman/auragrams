# Vocal band: ask on upload, render only when the track has vocals

Today the bright horizontal "band" across the sphere (the equator waveform streak in `OrbVisual`) is drawn for every Aura that has audio or is in hero mode. It reads the full-mix waveform, so it appears even on instrumentals.

## What changes

1. **New question during Aura creation**
   - On `/create`, next to the mood/identity controls, add a small two-option question: "Does this track have vocals?" — Yes / No (default Yes).
   - Short helper line: "Vocals add a live band across the sphere that moves with the voice."

2. **The band becomes vocal-driven**
   - When the answer is Yes, the band renders and is driven by the vocal frequency range (roughly 200 Hz - 4 kHz from the analyser's frequency data) rather than the raw full-mix waveform, so it swells with the voice and goes flat/quiet during instrumental passages.
   - When the answer is No, the band is not drawn at all. Everything else about the orb (orbit oscilloscope, radar rings, glow, particles) is unchanged.

3. **Persistence and playback**
   - The answer is saved with the Aura in the existing `visual_style` JSON column (`hasVocals`), so no database migration is needed.
   - It is read back when an Aura loads from the cloud and passed down to the orb, so a saved Aura keeps the correct behaviour on the Aura page, My Auras cards, AuraLink, and share cards.
   - Auras created before this change default to showing the band (current behaviour preserved).

4. **Home page**
   - The landing hero keeps its band, since the showcase Auras are vocal examples. Any showcase entry can be flagged as instrumental later via the same field.

## Technical notes

- `src/components/OrbVisual.tsx`: add an optional `hasVocals` prop (default `true`); gate the equator streak block on it and compute its amplitude envelope from the vocal-range frequency bins (with the existing waveform used only for the line's shape).
- `src/components/Aurascope.tsx`: extend `AurascopeAura` with `hasVocals?: boolean` and forward it to `OrbVisual`; `aurascopeAuraFromTrack` maps it through.
- `src/lib/farm.ts` (`SavedAura`) and `src/lib/tracks.ts` (`Track`): add optional `hasVocals?: boolean`.
- `src/lib/cloudAura.ts`: write `hasVocals` into `visual_style`, read it back in the row → `SavedAura` mapper.
- `src/routes/create.tsx`: local `hasVocals` state, the new question UI, and include it in the saved Aura payload.
- No changes to the detection engine, RLS, storage, or cron.
