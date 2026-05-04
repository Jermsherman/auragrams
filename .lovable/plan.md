
# Patch: Raw Aura · Detect Mood · Better Key/Pitch

Three focused MVP additions. No DAW, no studio. Each feature is a thin, magical layer over what already exists.

---

## 1. Raw Aura recording (`/create` third tab)

**New file `src/components/RawAuraRecorder.tsx`** — self-contained MediaRecorder UI:
- Requests mic via `navigator.mediaDevices.getUserMedia({ audio: true })`.
- States: `idle → recording → recorded`. Big circular button: "Start Recording" → "Stop Recording" (pulsing while live).
- Live timer (mm:ss) using `requestAnimationFrame`.
- On stop: assembles `Blob` (`audio/webm` preferred, fallback to `audio/mp4`), creates an object URL, exposes a small `<audio controls>` preview, "Re-record" link, and the parent CTA enables.
- Picks a supported mime via `MediaRecorder.isTypeSupported`.
- Emits `onReady({ file: File, durationSec })` to the parent (we wrap the blob in a `File` named `raw-aura-<timestamp>.webm`).
- Cleans up tracks + revokes URLs on unmount/re-record.

**`src/routes/create.tsx`** — extend `Mode` to `"file" | "link" | "auracle" | "raw"`, change the toggle to a 4-up grid (still pill-glass, icons: `UploadCloud`, `LinkIcon`, `Mic`, `Layers`), and render `<RawAuraRecorder />` in the `raw` branch.
- Reuse the existing `audio` File state for the recording so all downstream code (energy/key/mood detection, session audio, generate flow) "just works".
- Set a new local flag `sourceType: "raw_recording"` when in raw mode.
- Default Title placeholder → `"Untitled Raw Aura"`; if user leaves blank, save as that.

**Persistence rules (per spec):**
- Raw audio Blob is only kept via `setSessionAudio(id, file, objectURL)` (in-memory map already in `src/lib/session.ts`). Never written to localStorage.
- Track metadata gets a new `sourceType` field (see schema below) so Farm + AuraLink know it's a Raw Aura even after refresh.
- AuraLink page: if `sourceType === "raw_recording"` and `getSessionAudio(id)` is null, show a small notice: *"This Raw Aura recording session expired. Record again to replay."* The orb + metadata still render normally.

---

## 2. Detect Mood

**New file `src/lib/audioFeatures.ts`** — small Web Audio analysis module (no new deps):
- `analyzeFile(file: File)` → decodes audio, computes:
  - `rms` (loudness 0..1)
  - `spectralCentroid` (brightness, Hz) via FFT on a few 2 s windows
  - `bandEnergy.bass / mid / treble` (0..1 normalized)
  - `tempoEstimate` (rough — onset-energy autocorrelation; optional, may return null)
  - returns `{ rms, brightness, bands, tempo }`
- Internally uses the same `OfflineAudioContext` pattern as `keyDetect.ts`. Skip very quiet windows.

**New file `src/lib/moodDetect.ts`**:
```ts
export function suggestMoods(input: {
  features?: AudioFeatures | null;     // from analyzeFile
  keyDetection?: KeyDetection | null;  // from keyDetect
  // For platform links (no audio):
  title?: string; artist?: string;
}): string[]   // up to 4 mood names from MOODS in aura.ts
```
Rules implement the spec's mappings (low energy + minor → Melancholy/Intimate/Nocturnal/Reflective, high energy + major + bright → Euphoric/Uplifting/Radiant/Electric, etc.). For platform-link fallback, hash `title+artist` into a deterministic mood quartet biased by detected key if present. Always returns at most 4 names that exist in `MOODS`.

**`src/components/MoodPicker.tsx`** — add a "Detect Mood" pill button next to the counter. Accepts `onDetect?: () => Promise<void> | void` and shows a spinner while running. Disabled if no audio source available *and* no title/artist for fallback.

**`src/routes/create.tsx`** — wire `Detect Mood`:
- In `file` and `raw` modes: call `analyzeFile(audio)` + reuse current `detectKey(audio)` result, pass both to `suggestMoods`.
- In `link` mode: call `suggestMoods({ title, artist })`.
- On success: `setMoods(suggested)` + `toast.success("Moods detected. You can still adjust them.")`.
- On empty/error: `toast("Couldn't detect moods yet. Pick up to 4 manually.")`.
- Cache the latest `AudioFeatures` in state so we can also pass `energy` straight into `generateAura` later.

---

## 3. Improved key + pitch detection

`src/lib/keyDetect.ts` is solid (Krumhansl-Schmuckler chroma) — keep it but extend output:
- Already returns `{ key, tonic, mode, confidence }`.
- **Add** `detectPitchCenter(file)`: uses YIN-lite autocorrelation on a few 1 s windows, returns `{ noteName: "A3", hz: 220 }` or `null`. ~80 lines, no deps.
- **Add a unified wrapper** `detectTonal(file): Promise<{ key: KeyDetection|null; pitch: PitchCenter|null }>` so callers run one decode (we'll thread the same decoded buffer through both internally — refactor `keyDetect` slightly to expose a `decode(file)` helper and a pure `analyzeBuffer(buf)` so we don't decode twice).

**No npm additions.** Essentia.js / Meyda / Pitchy are nice but heavy; for an MVP that "feels lightweight and magical" we stay on Web Audio + ~150 lines of algorithm. We can swap in Essentia later if accuracy demands it.

**Schema additions** (`src/lib/aura.ts` `AuraProfile`, `src/lib/tracks.ts` `Track`, `src/lib/farm.ts` `SavedAura`):
- `sourceType?: "upload" | "platform_link" | "raw_recording"` on Track + farm (extend `SourceType` enum).
- `pitchCenter?: { note: string; hz: number }` on Track + SavedAura + AuraProfile.
- `keyConfidence?: number`.
- `detectedEnergy?: number` (so the displayed Energy uses analysis when available).

**`generateAura` signature** grows by optional fields:
```ts
generateAura({
  id, title, artist, moods,
  detectedKey, pitchCenter, energyOverride, sourceType,
})
```
- If `energyOverride` present, replace `energyFor(...)` result.
- If `sourceType === "raw_recording"`, draw `auraName` from a new **RAW_NAME_BANK** (`Raw Velvet`, `Voice Ember`, `Midnight Sketch`, `Hook Ghost`, `Soft Signal`, `First Take Bloom`, `Dry Echo`, `Bedroom Static`) with 70% probability, otherwise existing logic.
- If `sourceType === "raw_recording"`, swap `description` template bank to two new "raw" templates ("A raw vocal idea with intimate shadow…", "An unfinished but emotional signal…") parameterized by mood/key.
- If `keyConfidence < 0.15` *or* no detection succeeded but pitch did, set `musicalKey = "Unknown"` and surface `pitchCenter` instead.

---

## 4. UI surfaces

**Aura Profile preview (`src/components/AuraProfileCard.tsx`)**
- Add a small **Source badge** chip at the top: `Uploaded Audio` / `Platform Link` / `Raw Aura`. Raw Aura uses the gradient pill.
- Stat row: show `Pitch Center: B3` only when `pitchCenter` exists *and* (key is "Unknown" OR sourceType === "raw_recording"). Otherwise show Key as today.

**`src/components/AuraFarmCard.tsx`**
- New badge variant when `aura.sourceType === "raw_recording"` → label `Raw Aura` with the gradient style instead of muted text.

**Farm filter chips (`src/routes/farm.tsx`)**
- Add a sticky filter row above the grid: `All · Uploaded Audio · Platform Links · Raw Aura · Auracles`.
- Implemented as local state, filters the rendered list (Auracles tab swaps to the existing Auracle grid). No persistence needed.

---

## 5. Data flow summary

```text
File (upload OR raw recording)
  └─► analyzeFile  ─┐
  └─► detectTonal ─┤── suggestMoods ──► MoodPicker (auto-fill)
                   └──► generateAura(moods, key, pitch, energy, sourceType)
                          └──► saveTrack + saveAuraFromTrack
Platform link
  └─► detectProvider → suggestMoods({title,artist}) ──► generateAura
```

---

## 6. Acceptance check

- [ ] /create has Upload File · Paste Music Link · Record Raw Aura · Auracle.
- [ ] MediaRecorder records, previews, re-records, generates an Aura.
- [ ] Raw Aura saved to Farm with `sourceType: "raw_recording"` and a Raw Aura badge.
- [ ] Recorded blob never written to localStorage; expired session shows the notice.
- [ ] "Detect Mood" button auto-fills up to 4 moods, user can still edit.
- [ ] Aura Profile shows Key, optional Pitch Center, Energy, source badge.
- [ ] Raw Auras pull from RAW_NAME_BANK and raw description templates.
- [ ] Farm has filter chips for source type incl. Auracles.

---

## Files touched

Create: `src/components/RawAuraRecorder.tsx`, `src/lib/audioFeatures.ts`, `src/lib/moodDetect.ts`.

Edit: `src/lib/keyDetect.ts` (expose decode + add pitch), `src/lib/aura.ts` (sourceType branching, raw name bank, raw templates, energy override, AuraProfile shape), `src/lib/tracks.ts` + `src/lib/farm.ts` (schema fields + hydrate), `src/routes/create.tsx` (raw mode + Detect Mood wiring), `src/components/MoodPicker.tsx` (Detect button), `src/components/AuraProfileCard.tsx` (source badge + pitch row), `src/components/AuraFarmCard.tsx` (raw badge), `src/routes/farm.tsx` (filter chips), `src/routes/aura.$id.tsx` (raw-expired notice).

No new npm dependencies.
