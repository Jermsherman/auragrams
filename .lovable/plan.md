
## Phase 3 prep — three parallel workstreams

---

### 1. Remove upload size limits (+ fix related bugs)

Current state (verified):
- `src/lib/audioStorage.ts:9-10` hard-caps at `MAX_AUDIO_BYTES = 25 MB` with a soft warn at 20 MB. `validateAudioFile` blocks anything larger.
- `src/routes/create.tsx:46,131` reads `audioSoftWarning` and shows the warn banner.
- `src/lib/faq.ts:155` still tells users "try a smaller file."
- The `auragram-audio` bucket itself may also have a Supabase-side `file_size_limit` (needs verification via storage read; if set, updated via `supabase--storage_update_bucket`).

Changes:
- `audioStorage.ts`: delete `MAX_AUDIO_BYTES` / `AUDIO_SOFT_WARN_BYTES`, drop the size branch in `validateAudioFile`, delete `audioSoftWarning`. Keep the MIME/extension check.
- `create.tsx`: remove the `audioSoftWarning` import + banner; keep progress UI (already wired via `onProgress` + XHR path in `uploadAuraAudio`).
- `faq.ts`: rewrite the "upload failed" answer to only mention format + network, not size.
- Verify bucket has no `file_size_limit`; if it does, clear it in the same turn.
- Bug audit tied to size removal:
  - `probeDuration` timeout is 8s — long files still resolve as `null` duration silently (harmless). No change needed.
  - Signed-URL XHR path already streams via `PUT`, so removing the JS-side cap is safe for large files.
  - Progress UI: confirm `uploadProgress` still renders past 90% for slow networks; nothing else to change.

---

### 2. Landing page: upload-first, "gain your Aura"

Current landing (`src/routes/index.tsx`) leads with a hero showcase orb + "See Your Sound" CTA that navigates to `/create`. It's pretty, but the primary action (upload) is one click away and the page reads as a gallery.

Reframe: **the hero is the uploader.** Uploading is the wow-moment gate, so put it in the fold.

Hero rebuild (mobile-first, since preview is 393×690):
- Keep the animated Aurascope, but shrink it and pair it side-by-side (or stacked on mobile) with an inline drop-zone that accepts an audio file directly on the homepage.
- Drop-zone label: **"Drop a track. Get your Aura."** Sub: "Free. No account needed to preview."
- On drop / select: navigate to `/create` with the file handed off via a module-level ref (same pattern as `pendingAura`), so the existing create flow analyzes it. Guest path already exists.
- Replace subtitle triplet with a single line: *"Every song has an aura. Upload one and claim yours."*
- Keep the "Show another" showcase cycler but demote it below the fold as social proof ("Here's what other tracks look like").

Trim / merge:
- Collapse "What is an Aura?" and the feature cards into one tighter "Anatomy of an Aura" section that names the trait axes (see §3), so the landing page teaches the collectible framing.
- Remove the "How it works" 3-step block — the hero uploader makes step 01 self-evident, and step 03 is covered by the AuraLink spotlight below.
- Keep AuraLink spotlight, FAQ preview, final CTA.

Copy shift throughout: from "See your sound" → **"Claim your Aura."** ("Gain" reads like a stat; "Claim" reads like ownership, which sets up the trait/collectible system in §3.)

---

### 3. Trait system — "each Aura is a unique collectible"

**Verdict up front: this is a good idea, not a bad one, but only if it stays visual and NON-financial.** NFT language ("mint", "floor", "own", wallet) will attract the wrong crowd and get the platform lumped in with rugpulls. But the *aesthetic* of a rip-pack reveal / trading-card trait sheet is a perfect fit — it takes the analysis you already run and reframes it as a collectible reveal moment. It also gives artists something concrete to screenshot and share ("look at the traits my track pulled"), which is the viral loop you want.

Recommendation: keep the *collectible ritual*, drop the *NFT vocabulary*. Call them **Traits** on the Aura, and call a full Aura reveal a **Pull** (as in "pulling a card"). No mint, no chain, no ownership fiction — an Aura is already tied to a user's account.

#### What the trait sheet contains

Every trait is deterministic from the audio + seed (so re-analysis of the same track always yields the same traits — this is critical for the "authentic to the song" story). Nothing here needs new audio DSP; it all derives from `AudioFeatures` (already computed in `src/lib/audioFeatures.ts`) + `KeyProfile` + palette output.

| Trait axis          | Source                                          | Example values                                              | Rarity driver                            |
| ------------------- | ----------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| Palette Family      | `dominantHueFamilies(colors)` (already exists)  | Ember, Jade, Cobalt, Onyx, Rose+Jade split                  | Two-family splits are rarer              |
| Motion Archetype    | `personality.motion`                            | Breathe, Pulse, Tide, Shimmer, Drift, Smoke                 | Smoke + Shimmer rarer than Breathe       |
| Texture             | `personality.texture`                           | Silk, Grain, Mist, Ripple, Glass                            | Glass rarest                             |
| Density             | `features.densityScore` bucketed                | Sparse / Balanced / Dense / Overgrown                       | Overgrown + Sparse tail-rare             |
| Energy Tier         | `features.energy`                               | Still (0–20), Warm (21–50), Charged (51–80), Volatile (81+) | Extremes rarer                           |
| Key Signature       | `keyProfile.tonic + mode`                       | "C# minor", "F major"                                       | Unusual modes weight up                  |
| Tempo Band          | `features.estimatedTempo` bucketed              | Ballad / Groove / Drive / Frenzy                            | Frenzy rare                              |
| Spectral Signature  | Bass/mid/treble balance                         | Sub-heavy, Warm-bodied, Airy, Balanced                      | Sub-heavy + Airy rarer                   |
| Transient Character | `features.transientIntensity`                   | Legato / Percussive / Explosive                             | Explosive rarest                         |
| Aura Serial         | `hash(auraId)` mod 999999, padded              | `#042317`                                                   | (Identifier, not rarity — like edition #) |

Composite:
- **Rarity Score** = weighted sum of individual trait rarities → **Tier** (Common / Uncommon / Rare / Radiant / Mythic). Distribution roughly 55/25/13/6/1.
- **Signature phrase** — reuse existing `paletteName` + `auraName` output as the "card title."

#### The reveal ("Pull") moment

- Replace the current `/generating` loading route with a two-stage reveal:
  1. Analysis progress (existing).
  2. **Trait sheet card flip**: traits appear one at a time (staggered 120–180ms), rarest last, with the tier badge landing at the end. Uses the palette that was just generated.
- The generated Aura page (`/aura/$id`) gains a **Traits** panel below the orb — a grid of pill-badges, tier ribbon, serial number. Screenshotable. Every trait is tap-to-explain ("Motion: Tide — the orb rolls the way the track breathes").
- On AuraLink cards, show a compact trait chip strip (tier + 2 dominant traits) so the collectible framing carries into the public page.

#### Data model additions

- New pure module `src/lib/auraTraits.ts` exporting `computeTraits(features, keyProfile, palette, seed)` → `AuraTraits`. No DB dependency; traits are derived, so we can compute them at render time from existing `features_summary` / `key_profile` / `colors` on the aura row. Optional: cache the computed traits JSON on the `auras` row (`traits jsonb`) in a follow-up migration so the trait sheet renders instantly without recomputing.
- No new bucket, no new server function, no new secret.

#### Why this works, honestly

- It costs almost nothing to ship because we're re-labeling existing analysis.
- It gives artists shareable proof-of-uniqueness without the crypto tax.
- It turns "your aura" from a vibe into an *artifact with a stat sheet*, which is the difference between "cute" and "collectible."

#### Risks to avoid (worth stating)

- **Do not** call it "mint" or add a serial edition mechanic — invites NFT association.
- **Do not** gate rare tiers behind payment; rarity must come from the audio itself or it destroys the whole meaning.
- **Do not** allow re-rolls. One track = one canonical trait sheet. Re-rolling breaks the artifact.

---

### Build order once approved

1. Kill upload caps (small, isolated).
2. Ship `auraTraits.ts` + Traits panel on `/aura/$id` (biggest user-visible change, no landing rework needed).
3. Upgrade `/generating` into the Pull reveal.
4. Rebuild landing hero with the drop-zone and reframed copy.
5. Add trait chips to AuraLink cards.

Each step lands independently; nothing else in the app breaks if we stop after any one of them.
