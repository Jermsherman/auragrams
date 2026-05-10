## Auragram Continuation Patch — Plan

Continuation of in-progress work. No rebuild. Builds on existing `audioFeatures.ts`, `moodDetect.ts`, `aura.ts`, `AudioUploadPlayer.tsx`, `auralink.ts`, `AuraLinkView.tsx`.

---

### Part A — Finish Aura generation wiring

**`src/lib/aura.ts` — `generateAura()` + `buildPalette()`**
- Accept optional `audioFeatures: AudioFeatures` argument.
- Feed into mood detection seed + weights (already partly wired).
- `buildPalette()` rules:
  - `warmthScore` → hue bias warm (20–60) vs cool (200–260)
  - `darknessScore` → lower lightness floor
  - `softnessScore` → lower chroma; `aggressionScore` → higher chroma
  - `densityScore` → number of swatches (4 sparse → 8 dense) and shadow depth
  - `mode === "major"` → warmer hue lean; `minor` → cooler/darker
  - `brightness` / `highFrequencySparkle` → highlight swatch lightness
- Compute and return: `densityLabel` (via DENSITY_LABELS), `textureKeywords` (via `textureKeywordsFor`), `motionKeywords` (new helper based on `rhythmIntensity` + `transientIntensity` + `estimatedTempo`), richer `auraName`, `auraDescription`, `vibeDescription` drawing from expanded banks + features.
- Output also: `generatedColorPalette` (snapshot before user edits), `paletteName`.
- All fields safe-fallback when `audioFeatures` is missing.

**Callers updated:** `src/routes/create.tsx`, `src/lib/cloudAura.ts`, anywhere generation runs — pass `audioFeatures` when available.

---

### Part B — Data model fields

**`src/lib/tracks.ts` (Track), `src/lib/farm.ts` (SavedAura), `src/lib/cloudAura.ts` (DB serialization via `auras.extra` JSONB)** — add:

```
audioFeatures, detectedMoods, userSelectedMoods, moodTags,
detectedKey, mode, pitchCenter, energyLevel,
densityScore, densityLabel, brightnessScore, warmthScore,
darknessScore, aggressionScore,
auraName, auraDescription, vibeDescription,
motionKeywords, textureKeywords,
generatedColorPalette, finalColorPalette,
paletteName, paletteWasEdited,
vibeSettings: { vibeNote, densityPreference, updatedAt },
paletteSettings: { paletteName, colors, wasEdited, updatedAt },
mediaSettings: { volume, muted }
```
Persist via existing `extra` JSONB — no migration needed. Read/write helpers in `cloudAura.ts` updated to round-trip these.

---

### Part C — Edit dialogs

**`src/components/EditVibeDialog.tsx`** (new)
- Fields: vibe note (textarea), mood blend (multi-select up to 4 from full pool), density preference (radio: auto / airy / balanced / dense / intense).
- On save: update `vibeSettings`, `userSelectedMoods`, `moodTags`; re-run partial generators (`auraDescription`, `vibeDescription`, `motionKeywords`, `textureKeywords`, `densityLabel` per preference). Preserve audio/source/track title. No duplication. Toast: "Vibe updated."

**`src/components/EditPaletteDialog.tsx`** (new)
- Fields: palette name input, 4–8 color swatches with native `<input type="color">`, add/remove swatch buttons, "Reset to generated palette" (restores from `generatedColorPalette`).
- On save: update `finalColorPalette`, `paletteName`, `paletteWasEdited=true`, `paletteSettings`. Live-updates `Aurascope` via parent state. Toast: "Palette updated."

Both wired into `src/routes/aura.$id.tsx` near profile actions.

---

### Part D — AudioUploadPlayer cleanup

**`src/components/AudioUploadPlayer.tsx`**
- Add volume row: volume icon (mute toggle) + `<Slider>` (0–100), persist last volume in `localStorage` key `auragram_player_volume`.
- Apply `audioRef.current.volume` and `.muted` reactively.
- Replace caption "Reacting to {filename}" with "Aurascope reacting to audio".
- For platform-link tracks (no upload): "Aura generated from track identity".
- Mobile-friendly compact layout.

---

### Part E — AuraLink revamp

**Data model — `src/lib/auralink.ts`** extended:
- Split `links` into `streamingLinks`, `socialLinks`, `customLinks`.
- Add `featuredAuraId`.
- Add `theme` object: `{ name, mode: "preset"|"custom", backgroundColor, primaryAccent, secondaryAccent, buttonColor, glowColor }`. Presets keep current 5 + new "custom".
- Migration helper for existing localStorage entries (map old `links[]` → split arrays).
- New `SOCIAL_PLATFORMS` catalog: instagram, tiktok, youtube, x, facebook, threads, twitch, discord, snapchat, website, email, other.

**Builder — `src/routes/auralink.create.tsx`**
- Sections: Basic Info · Page Type (Streaming / Auras / Mixed [default]) · Streaming Links · Social Links · Auras from Farm (multi-select, reorder, feature one) · Custom Links · Theme ("Choose a vibe" / "Guide the page glow") with preset chips + custom color pickers.
- Tabs on mobile: Edit | Preview. Side-by-side on desktop using existing `AuraLinkView` as live preview.

**Public view — `src/components/AuraLinkView.tsx` + `src/routes/l.$slug.tsx`**
- Featured Aurascope/avatar at top with theme glow halo.
- Social icons row (lucide icons).
- Streaming link buttons (existing pattern, themed).
- Aura cards with mini player + Open Aura button.
- Custom links section.
- Footer: "Created with Auragram".

**Mini player on Aura cards — `src/components/AuraLinkAuraCard.tsx`** (new)
- Reuses one shared `<audio>` element via a small `MiniPlayerContext` so playing one pauses others.
- If `audio_public_url` available → in-page play/pause + thin progress bar.
- Else if `platform_url` → "Open on {platform}" link.
- Card click / "Open Aura" → navigate `/aura/$id`.

---

### Part F — Farm + Aura page integrations

- **`src/components/AuraFarmCard.tsx`**: actions menu — Add to AuraLink · Open Aura · Share AuraLink · Influence · Delete.
- **`src/routes/aura.$id.tsx` share modal** (`ShareDialog.tsx`): Copy AuraLink · Add to existing AuraLink · Build new AuraLink · Story Preview.
- AuraLink builder "Import from Farm" populates Aura selector.

---

### Part G — Auth tweak

**`src/routes/auth.tsx`**: remove Google sign-in button; add "Remember me" checkbox controlling Supabase session persistence (`persistSession`/local vs session storage approach).

---

### Files

**New:**
- `src/components/EditVibeDialog.tsx`
- `src/components/EditPaletteDialog.tsx`
- `src/components/AuraLinkAuraCard.tsx`
- `src/components/auralink/ThemePicker.tsx`
- `src/components/auralink/SocialLinksEditor.tsx`
- `src/components/auralink/StreamingLinksEditor.tsx`
- `src/components/auralink/AuraSelector.tsx`
- `src/lib/miniPlayer.ts` (shared mini-player context)

**Edited:**
- `src/lib/aura.ts`, `src/lib/audioFeatures.ts` (export motion helper), `src/lib/moodDetect.ts` (already done — verify), `src/lib/tracks.ts`, `src/lib/farm.ts`, `src/lib/cloudAura.ts`, `src/lib/auralink.ts`
- `src/components/AudioUploadPlayer.tsx`, `src/components/AuraLinkView.tsx`, `src/components/AuraFarmCard.tsx`, `src/components/AuraProfileCard.tsx`, `src/components/ShareDialog.tsx`
- `src/routes/auralink.create.tsx`, `src/routes/aura.$id.tsx`, `src/routes/farm.tsx`, `src/routes/create.tsx`, `src/routes/auth.tsx`, `src/routes/l.$slug.tsx`

No DB migration needed (everything persists via `auras.extra` and localStorage for AuraLinks).

---

### Acceptance verification
After build: open an existing aura → Edit Vibe + Edit Palette work and persist; uploaded audio plays with volume slider and shows "Aurascope reacting to audio"; `/auralink/create` builds a mixed page with social + streaming + featured Aura with custom theme; public `/l/:slug` plays Aura audio inline with cross-pause behavior; Google button gone, Remember-me present.
