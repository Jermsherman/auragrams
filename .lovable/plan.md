# Song Personality Profile — AI Insight Layer

Keep the current audio pipeline, palette, orb, and TraitSheet exactly as they are. Add a new AI-written *interpretation* layer on top: a cinematic profile that reads the song like it has a personality. Cache it per Aura so one song = one profile forever (no rerolls, no gambling).

## 1. New insight shape

Server-side generated once per Aura, stored on the row:

- **auraName** — 2-4 word cinematic title (e.g. "Midnight Confession"). Distinct from user-entered track title.
- **story** — 2-4 sentence emotional description of the song's personality and atmosphere.
- **emotionalDNA** — 2-3 primary emotions, each with a 1-sentence human explanation (not "sad" — "a quiet ache that isn't asking to be fixed").
- **personalityTraits** — 3-5 archetype nouns as if the song were a person (Dreamer, Rebel, Storyteller, Fighter, Romantic…) each with a one-line reason grounded in the audio.
- **listenerMoment** — one vivid moment/setting this song belongs to (late-night drive, first snowfall, walking out of a room for the last time…).
- **visualMeaning** — 2-3 sentences tying the orb's actual palette + motion + texture back to the emotional read ("the amber pulls forward because the low-mids carry the weight; the drift motion echoes how the melody hangs back").

All fields are pure text — no scores, no rarity, no numeric claims the model can't back up.

## 2. Determinism strategy

Truly-per-song feel *without* re-rolling on refresh:

- Generated **once** in a server function right after `computeAura` finishes, using the full audio-feature payload as the prompt (palette, tonic+mode, BPM, energy, density, texture, motion, top swatches, duration bucket). Low temperature.
- Persisted to a new `insight` JSONB column on the `auras` table.
- All subsequent reads (Aura page, My Auras hover, Story canvas, public AuraLink) read from that column. No client-side LLM calls, no re-generation button in MVP.
- If generation fails, the row still saves; UI falls back to the current template-driven `vibeDescription`. A single "Retry insight" action is available to the owner only.

## 3. New surfaces

**Aura page (`src/routes/aura.$id.tsx`)** — insight sits between the orb and the TraitSheet:

```text
[Orb]
 ↓ auraName (large, cinematic)
 ↓ story (italic, 2-4 sentences)
 ↓ Emotional DNA (chips + one-line each)
 ↓ Personality Traits (chip row, tap to expand)
 ↓ Listener Moment (single line, quoted)
 ↓ Visual Meaning (small, tied to the orb above)
[TraitSheet] ← unchanged, deterministic, measured
```

Reveal sequence extends the existing `?reveal=1` flow: after the orb bloom + signature, the profile fades in section-by-section (story → DNA → traits → moment → visual meaning) before TraitSheet tiles stagger. Keeps total < 6s.

**AuraProfileCard** — replace the current "Vibe" section with `story` + collapsible "Emotional DNA / Traits / Moment". Keep palette + motion keywords sections.

**My Auras cards** — subtitle switches from mood tags to `auraName`. Mood chips move to hover/detail.

**Public AuraLink** — each aura tile shows `auraName` and the first line of `story`. Big shareability win.

## 4. Trait provenance ("how this was made")

Address the "AI can hallucinate" trust gap explicitly. Under the TraitSheet, add a collapsible **"How your Aura was made"** block that shows a static, non-AI mapping:

- Hue ← palette family from spectral centroid + dominant chroma
- Cadence ← motion archetype from BPM + energy variance
- Grain ← texture from high-frequency roll-off
- Charge ← RMS energy percentile within the track
- Weight ← onset density
- Pulse ← detected BPM (raw)
- Root ← key + mode from chroma detection
- **Insight text ← AI interpretation of the measurements above; the measurements are the source of truth.**

Trust footer under it: "Measurements come from your audio. The story is written from those measurements. Same song, same Aura, forever."

## 5. Artists surface

Add a small `/for-artists` route reachable from the footer explaining benefits:

- Every drop gets a shareable visual identity — no designer needed.
- One canonical Aura per track means fans can't fake/roll a different one.
- AuraLink turns a release into a landing page with the playable Aura embedded.
- Trait sheet is a receipt fans can screenshot — free organic marketing.
- Public AuraLink URLs are SEO-friendly and social-preview-ready.

Also add a two-line "For artists" band on the landing page linking to it. No pricing, no gated tier — this is positioning.

## Files touched

**New**
- `src/lib/auraInsight.ts` — types + prompt builder + Zod schema.
- `src/lib/auraInsight.functions.ts` — `generateAuraInsight` server fn (calls Lovable AI gateway, `google/gemini-3-flash-preview`, `Output.object` with a small unbounded schema, temperature ~0.4).
- `src/components/SongPersonalityProfile.tsx` — renders the six sections with reveal staging.
- `src/components/TraitProvenance.tsx` — the static "how this was made" mapping.
- `src/routes/for-artists.tsx` — benefits page + head meta.
- Migration: `ALTER TABLE public.auras ADD COLUMN insight JSONB;`

**Edited**
- `src/lib/cloudAura.ts` — after `computeAura` + row insert, fire `generateAuraInsight`; write the result back. Non-blocking for save success.
- `src/routes/aura.$id.tsx` — render `SongPersonalityProfile` above `TraitSheet`; extend reveal timing; add owner-only "Retry insight" if `insight` is null.
- `src/components/AuraProfileCard.tsx` — swap Vibe section to insight-driven when `insight` present, fall back to `vibeDescription` otherwise.
- `src/components/AuraFarmCard.tsx` + `src/components/AuraLinkAuraCard.tsx` — show `auraName` where mood was.
- `src/components/StoryCanvas.tsx` — headline uses `auraName` when present.
- `src/components/Footer.tsx` — link to `/for-artists`.
- `src/routes/index.tsx` — small "Built for artists" band linking to `/for-artists`.

## Explicitly not doing

- No re-roll / regenerate button visible to non-owners. Owner-only "Retry insight" only when generation failed (null column).
- No paid tiers, no gated cosmetics, no "premium insight" — the promise is *one song, one Aura, one story*.
- No changes to `computeAura`, TraitSheet math, palette engine, RLS, storage, or auth.
- No client-side AI calls — key stays server-side.
- No renaming of existing trait labels; provenance describes what's already there.

## Technical notes

- Server fn `generateAuraInsight` takes an `auraId`, loads the row via `requireSupabaseAuth`, calls the gateway, writes `insight` back. Idempotent: if `insight` is already set, returns it.
- Schema kept small and constraint-free (no `.min/.max/enum`) per AI-SDK guidance; length is a prompt instruction, then clamped in code before persisting.
- On 402/429 from the gateway, save the row without insight and toast a soft "Story will finish shortly — retry if it doesn't."
- Prompt explicitly forbids: generic words like "energetic/sad/catchy" without expansion, star-sign language, hype ("banger", "fire"), and any claim about the artist as a person.