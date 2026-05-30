
# Palette + Vibe Consistency Fix

Two surgical, presentation-only fixes. No DB changes, no generation/business logic changes.

---

## 1. Palette doesn't follow the aura everywhere (root cause)

`Aurascope` renders `OrbVisual` like this:

```tsx
<OrbVisual palette={aura.palette} profile={aura.profile} ... />
```

`OrbVisual` only uses the saved per-aura swatches when **`profile.colors`** is present (`src/components/OrbVisual.tsx:79–95`). Otherwise it falls back to the generic personality stops keyed off `palette` (e.g. `"amethyst"`), which is identical for every aura that maps to the same mood.

`profile` is only built inside `aurascopeAuraFromTrack()` and only when `t.colors` exists. Every other call site passes `colors` but no `profile`:

- `AuraFarmCard.tsx:98` — My Auras card
- `StoryCanvas.tsx:42` — Story Preview (doesn't even pass `colors`)
- `AuraLinkAuraCard.tsx:139,214`
- `AuraLinkBuilder.tsx:594,1040,1114`
- `StackedOrbs.tsx:38`
- `auracle.create.tsx:225,256`, `auracle.$id.tsx:215`, `index.tsx:40`, `InfluenceAuraDialog.tsx:230`

Result: the "Your Aura is Ready" screen shows the real generated palette, but the farm card, story preview, auralink cards, and stacked orbs all redraw with the generic mood swatches — so the same aura looks different in different places (your screenshots).

### Fix (one place, fixes all call sites)

In `src/components/Aurascope.tsx`, synthesize a minimal profile inside the component when `aura.colors` is provided but `aura.profile` isn't, and pass that to `OrbVisual`:

```tsx
const effectiveProfile = useMemo(() => {
  if (aura.profile) return aura.profile;
  if (!aura.colors) return undefined;
  return { palette: aura.palette, colors: aura.colors } as AuraProfile;
}, [aura.profile, aura.colors, aura.palette]);
```

Then pass `profile={effectiveProfile}` to `OrbVisual` (line 292).

This is sufficient because `OrbVisual` only reads `profile.colors` when overriding the base personality (`OrbVisual.tsx:86–94`).

### One extra call site

`src/components/StoryCanvas.tsx` only passes `palette` — no `colors`. Extend its props to accept `colors?: AuraPalette` and forward to `Aurascope`. Update the single caller `StoryPreviewDialog.tsx` to pass `track.colors`. With the Aurascope fix above, the story preview orb then matches the saved aura.

No other call sites need changes — they already pass `aura.colors` (or `t.colors`) and will start rendering correctly automatically.

---

## 2. Vibe shows two paragraphs — keep only the quoted, editable one

`src/components/AuraProfileCard.tsx:115–122` renders both:

```tsx
<Section title="Vibe" defaultOpen>
  <p>{description}</p>           // ← prose paragraph (remove)
  <VibeEditor vibeDescription={vibeDescription} ... />  // ← italic “…” line + Edit/Generate
</Section>
```

The user wants only the quoted `vibeDescription` (the one that already has Edit / Generate the vibe controls).

### Fix

Delete the `<p className="text-sm leading-relaxed text-foreground/85">{description}</p>` line. Keep `VibeEditor` exactly as is. No prop changes, no generation changes — `description` is still generated and stored, just not duplicated in the UI.

---

## Files touched

- `src/components/Aurascope.tsx` — synthesize `effectiveProfile` from `aura.colors`, pass to `OrbVisual` (both `mode === "story"` branch and the main return).
- `src/components/StoryCanvas.tsx` — accept and forward `colors`.
- `src/components/StoryPreviewDialog.tsx` — pass `track.colors` to `StoryCanvas`.
- `src/components/AuraProfileCard.tsx` — remove the duplicate `<p>{description}</p>` inside the Vibe section.

## Out of scope

- No changes to aura generation, palette generation, DB schema, cloud hydration, or `OrbVisual`'s drawing code.
- No changes to AuraLink builder logic, save/share flows, or audio playback.
