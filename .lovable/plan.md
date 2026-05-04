## Goal

On the Aura page (`/aura/$id`), let the user either **write their own vibe** or have the system **regenerate the vibe** for that Aura. The vibe is the poetic phrase shown in the "Vibe" section of the Aura Profile (currently `track.vibeDescription`).

## UX

In `AuraProfileCard`'s "Vibe" section, alongside the italic vibe quote, add two small icon buttons (visible only to the Aura's owner):

- **Edit the vibe** (pencil icon): opens an inline textarea pre-filled with the current vibe. Save / Cancel actions. Save persists to local track + cloud row, then closes.
- **Generate the vibe** (sparkles icon): regenerates a fresh poetic vibe from the existing mood/key/seed via `generateAura()` and saves it the same way. Brief loading state, toast on success.

Non-owners (public AuraLink visitors) just see the quote — no buttons.

## Implementation

### 1. `src/components/AuraProfileCard.tsx`
- Add optional props: `editable?: boolean`, `onSaveVibe?: (text: string) => Promise<void> | void`, `onRegenerateVibe?: () => Promise<void> | void`.
- Inside the `<Section title="Vibe">`:
  - When `editable` and not in edit mode, show two ghost icon buttons (Pencil, Sparkles) under the quote.
  - Edit mode: render a `<textarea>` (rows 3, 240 char limit, trim/empty validation via simple length check) with Save / Cancel.
  - Generate mode: disable buttons, show small spinner while `onRegenerateVibe` is pending.
- Local component state for `editing`, `draft`, `busy`. Toasts handled by parent.

### 2. `src/routes/aura.$id.tsx`
- Track ownership: a track is "mine" if `isAuraSaved(track.id)` (local) — pass that as `editable`.
- Add handlers:
  - `handleSaveVibe(text)`: `updateTrack(id, { vibeDescription: text })`, refresh local state, then `updateAuraVibeCloud(id, text)` (best-effort, swallow error with toast).
  - `handleRegenerateVibe()`: call `generateAura({ id, title, artist, moods: track.moods, detectedKey: track.detectedKey })`, take `gen.vibeDescription`, persist via the same path.
- Pass both handlers + `editable` to `<AuraProfileCard />`.

### 3. `src/lib/cloudAura.ts`
- Add `updateAuraVibe(id: string, vibeDescription: string)` that runs `supabase.from("auras").update({ vibe_description: vibeDescription }).eq("id", id)`. RLS already restricts to owner.

### 4. Polish
- Use existing semantic tokens (`text-muted-foreground`, `border-border/60`, `bg-background/30`). No raw colors.
- Buttons sized small (`h-8 px-3 text-[11px]`) to match the card's tone.
- Maintain the existing italic quote styling when not editing.

## Acceptance
- Owner sees Pencil + Sparkles next to the vibe quote.
- "Edit the vibe" lets them write their own text; saved value persists across reloads (local + cloud).
- "Generate the vibe" produces a new poetic phrase from the engine and saves it.
- Public visitors see just the quote, no controls.