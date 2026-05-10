## Add "Shuffle Palette" to every Aura

Give artists a one-tap way to reroll an Aura's color palette while keeping the song's identity (title, moods, key, energy, influence) intact.

### Behavior

- New **Shuffle** action sits next to **Edit Palette** on the Aura page (`/aura/$id`) and inside the **Edit Palette** dialog.
- One click → a fresh color palette + new palette name. Aurascope updates live; the moods, vibe text, key, and density stay unchanged.
- Each click produces a different result (uses a new random seed each time).
- Persisted via `updateTrack` so it survives reload and syncs into the Farm.
- Toast: "Palette shuffled."

### Where it appears

1. **Aura page (`src/routes/aura.$id.tsx`)** — small `Shuffle` button beside `Edit Palette` in the secondary action row. Visible whenever the Aura has colors (saved or fresh).
2. **EditPaletteDialog (`src/components/EditPaletteDialog.tsx`)** — a `Shuffle` button in the dialog footer, next to `Reset`. Lets users reroll inside the editor and then keep tweaking before saving.
3. **Influence page** preview — already regenerates on every change, so nothing new there; the shuffle action is reserved for the Aura page where users normally view their finished Aura.

### Technical notes

- Reuses existing `generateAura()` with the track's current moods, detectedKey, pitchCenter, energy, sourceType, and userColorInfluence, but with a fresh `id` seed (`track.id + "-shuffle-" + Date.now()`) so palette + paletteName change while everything else stays consistent.
- Updates `track.colors` and `track.paletteName` only — does not touch `vibeDescription`, `auraName`, `moods`, or `density`.
- In `EditPaletteDialog`, shuffle replaces the in-dialog draft state (so the user sees it before saving). Existing `Reset` still restores the originally generated palette.

### Files touched

- `src/routes/aura.$id.tsx` — add Shuffle button + handler.
- `src/components/EditPaletteDialog.tsx` — accept optional `onShuffle` prop, render Shuffle button in footer.

No new dependencies, no DB migration, no schema changes.
