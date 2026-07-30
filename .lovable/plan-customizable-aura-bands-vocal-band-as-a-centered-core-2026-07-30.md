# Customizable Aura bands + vocal band as a centered core

## The bands that exist today

The orb draws four reactive layers on its canvas (`OrbVisual`). All four currently take fixed colors from the aura palette with no user control:

| Band | What drives it | Color today |
| --- | --- | --- |
| Waveform ring | Full-mix time-domain waveform, orbits the sphere edge | palette stop 4 |
| Bass halo | Low-frequency energy, a wider second ring outside the first | palette stop 2 |
| Radar rings | Expanding pulse rings (idle/hero animation only) | palette stop 2 |
| Vocal band | 200 Hz–4 kHz energy, currently a horizontal streak across the equator | accent → glow gradient |

Non-band layers (shell gradient, texture, particles, outer glow) stay untouched.

## What changes

### 1. Vocal band gets a second shape, default to the circle

Add a **Vocal band shape** choice on `/create`:

- **Core pulse (new default)** — a circle centered inside the orb that expands, brightens and thickens with vocal energy, with the vocal waveform wobbling its radius. Sits well inside the waveform ring so the two never collide.
- **Equator streak** — the existing horizontal line across the sphere.

Shown only when "Does this track have vocals?" is Yes. Existing saved Auras keep the equator streak so nothing changes for them retroactively.

### 2. Per-band customization

A collapsible **Aura bands** panel on `/create`, under the vocals question. One row per band (Waveform ring, Bass halo, Radar rings, Vocal band) with:

- **Show / hide** toggle
- **Color**: "Match palette" (default) or one of the aura's own swatches
- **Intensity**: a 3-step strength control (Subtle / Normal / Bold) affecting opacity, line weight and glow

A single **Match Aura palette** button resets every band back to palette-derived colors. Live preview: the orb next to the panel reflects changes immediately while a track is loaded.

### 3. Persistence

All band settings save into the existing `visual_style` JSON on the Aura — no database migration. They are read back when an Aura loads, so the Aura page, My Auras cards, AuraLink cards and share cards all render the same configured bands. Auras saved before this change fall back to today's look.

## Technical notes

- New `src/lib/auraBands.ts`: `BandsConfig` type (`waveform | bass | radar | vocal` → `{ enabled, color: "auto" | hex, intensity }`), `vocalShape: "core" | "equator"`, plus `DEFAULT_BANDS` and a legacy-fallback resolver that maps a missing config to current behaviour (`vocalShape: "equator"`).
- `src/components/OrbVisual.tsx`: accept an optional `bands?: BandsConfig` prop; resolve each band's stroke color, alpha and line width through a helper instead of hardcoded `p.stops[...]`; gate each draw block on `enabled`. Add a `drawVocalCore` branch alongside the existing streak branch in both the real-audio effect and the hero effect, sharing the existing 200 Hz–4 kHz envelope.
- `src/components/Aurascope.tsx`: extend `AurascopeAura` with `bands`, forward to `OrbVisual`; `aurascopeAuraFromTrack` maps it through.
- `src/lib/tracks.ts` (`Track`) and `src/lib/farm.ts` (`SavedAura`): add optional `bands`.
- `src/lib/cloudAura.ts`: write `bands` into `visual_style` and read it back in the row → `SavedAura` mapper.
- `src/routes/create.tsx`: `bands` state, the new panel UI, and include it in the saved payload.
- `src/components/AuraFarmCard.tsx` / `AuraLinkAuraCard.tsx`: pass `bands` through the aura object they already build.
- No changes to detection, RLS, storage, or cron.
