# Auragram Hero Experience Rework — Beta Launch

Goal: a first-time visitor understands within 5 seconds that Auragram turns music into unique, playable, shareable visual identities. The hero **shows** the product instead of describing it.

All changes are presentation-layer only. No DB, no generation pipeline, no auth changes.

---

## 1. Showcase Aura system (hero centerpiece)

Create `src/lib/showcaseAuras.ts` — a curated set of 10 hardcoded `AurascopeAura`-shaped objects representing diverse, dramatic example Auras. Each entry includes everything `Aurascope` + the metadata strip need:

```ts
type ShowcaseAura = {
  id: string;
  trackTitle: string;        // e.g. "Midnight Drive"
  artistName?: string;       // optional, hidden on hero
  palette: PaletteKey;       // mood base for OrbVisual
  paletteName: string;       // e.g. "Dreamy"
  mood: string;              // user-facing mood tag, e.g. "Nostalgic"
  energy: number;            // 0–100
  musicalKey: string;        // e.g. "A Minor"
  vibeDescription: string;   // 1 short line for the explainer section
  colors: AuraPalette;       // primary/secondary/accent/shadow/glow/particle/swatches
  seed: number;              // hue/orb variation
};
```

Curated set (10 entries spanning mood, palette, energy, genre):

1. Dreamy pink R&B — "Midnight Drive" · Nostalgic · 42% · A Minor
2. Dark red aggressive trap — "Bloodline" · Brooding · 88% · F# Minor
3. Neon blue electronic — "Cyan Hour" · Euphoric · 91% · C Major
4. Earthy acoustic — "Cedar Smoke" · Intimate · 28% · G Major
5. Warm country — "Goldroad" · Warm · 55% · D Major
6. Bright indie pop — "Sunbleach" · Playful · 72% · E Major
7. Cinematic orchestral — "Last Light" · Cinematic · 64% · B Minor
8. Coastal lo-fi — "Tide Letters" · Coastal · 38% · F Major
9. Mysterious dark pop — "Veil" · Mysterious · 60% · C# Minor
10. Ethereal ambient — "Heavenbody" · Dreamy · 22% · A Major

Each `colors` object is hand-tuned per entry (not just the base mood) so every showcase Aura looks visually distinct, leveraging the existing `Aurascope` fallback path (`aura.colors → effectiveProfile`).

Export helper `pickRandomShowcase(prev?: string): ShowcaseAura` that picks a different entry from the previous one (used on each page load).

---

## 2. Hero Aura behavior in `src/routes/index.tsx`

Replace the static `<Aurascope aura={{ palette: "euphoric", auraName: "Auragram" }} ...>` with a `HeroShowcase` client component:

- On mount, pick a random `ShowcaseAura` via `pickRandomShowcase()`.
- Render `<Aurascope hero size="large" mode="minimal" showLabel={false} aura={showcase} />` — `hero` already drives continuous breathing/pulse via `OrbVisual`; existing `animate-float-y` adds the gentle hover.
- Make the orb interactive: wrap in a button that navigates to `/create` (`useNavigate`). Add `cursor-pointer` and a subtle scale on hover.
- Below the orb, render a centered metadata strip:

```text
GENERATED FROM
"Midnight Drive"
Mood: Nostalgic · Energy: 42% · Key: A Minor
```

Styling: small uppercase tracked label, display-font track title in `text-aura-gradient`, muted-foreground meta row. This single block teaches the value prop instantly.

No auto-rotation while on the page (one Aura per visit keeps it focused). A small "Show another" ghost link beneath the metadata cycles to a new showcase Aura without navigation, for the curious.

---

## 3. Hero copy

In `src/routes/index.tsx`:

- Replace eyebrow CTA chip "See your sound" → keep (it already matches the new primary CTA).
- Headline: `Give Your Music A Living Identity.` (second line `Living Identity` in `text-aura-gradient`).
- Subheadline (3 short lines, not a paragraph):
  - Upload a song.
  - Generate a living Aura.
  - Share it anywhere with AuraLink.
- Primary CTA → `See Your Sound` (→ `/create`).
- Secondary CTA → `View Example Aura` — scrolls to the new "What is an Aura?" section (anchor `#what-is-an-aura`). Shown for logged-out **and** logged-in users (replaces the current logged-in "Build AuraLink" secondary, which moves down-page).
- Remove the small "Create Aura → Sign Up → Build AuraLink → Share Anywhere" caption (now redundant with simplified How it works).

---

## 4. "What exactly is an Aura?" section (new, directly under hero)

New section `#what-is-an-aura` between the hero and How It Works:

- Heading: "What exactly is an Aura?"
- One-line definition: "An Aura is a living visual identity generated from your music's mood, energy, key, rhythm, and atmosphere."
- Two-column layout (stacks on mobile):
  - Left: a second `Aurascope` rendered from a **different** showcase entry (deterministic pick so it contrasts the hero), `size="medium"`, `mode="minimal"`, `hero` for continuous motion.
  - Right: a small "spec sheet" listing:
    - Mood tags (3 pill badges derived from the chosen showcase, e.g. Nostalgic · Hazy · Romantic)
    - Energy meter (horizontal bar bound to `energy` using existing `Progress` component, with the percentage label)
    - Key (Detected Key: A Minor)
    - Vibe description (one quoted italic line)

This is purely presentational — values come from the same `ShowcaseAura` data.

---

## 5. Simplified "How it works"

Replace the 4-card grid with 3 outcome-led cards. Keep the existing `glass` card styling and numbered eyebrows.

1. **Upload Audio** — Drop in a song.
2. **Generate Aura** — Watch your music become visual.
3. **Share Anywhere** — Turn it into an AuraLink.

Beneath the grid, add muted supporting copy: "Create a free account to save your Aura."

Remove the current "02. Sign Up to Save" card — sign-up is not a step users are excited about.

---

## 6. Replace feature cards (3-up grid further down)

Remove the existing `Living Auras / My Auras / AuraLinks` trio. Replace with outcome-focused copy and matching `lucide-react` icons:

1. **Turn Music Into Visual Identity** (icon: `Sparkles`) — Every track becomes a living Aura.
2. **Share Your Sound** (icon: `Share2`) — Create a playable AuraLink for releases, bios, stories, and DMs.
3. **Stand Out** (icon: `Wand2`) — Give every song its own visual identity instead of another generic link.

---

## 7. AuraLink positioning update

In the AuraLink spotlight section:

- Replace "AuraLink is your music-first link page." with "AuraLink is **a music-first link page with playable Auras**." (gradient on "playable Auras").
- Update the bullet list to lead with playability: "Add Auras that play right inside your link."
- Sprinkle the word "playable" consistently:
  - Final CTA subhead retains "living identity" but mention "playable" once more in the AuraLink bullet block.
  - Update `<meta name="description">` for `/` to mention "playable Auras."

---

## 8. Out of scope

- No changes to generation, audio analysis, DB schema, RLS, or auth.
- No changes to `OrbVisual` internals — relies on the existing `hero`/`profile.colors` paths already wired by the recent palette fix.
- No new routes; the secondary CTA scrolls to an in-page anchor.
- No changes to `Nav`, farm, auralink builder, or aura detail pages.

## Files touched

- `src/lib/showcaseAuras.ts` (new) — curated data + `pickRandomShowcase`.
- `src/routes/index.tsx` — hero rewrite, new explainer section, simplified How it works, replaced feature cards, AuraLink copy + meta.

## Acceptance check

- Each page load shows a visually distinct hero Aura (palette + mood + key + energy strip).
- Clicking the hero Aura routes to `/create`.
- "View Example Aura" smooth-scrolls to `#what-is-an-aura` showing an animated second Aura with mood/energy/key/vibe.
- How It Works has 3 outcome-led steps with sign-up demoted to a single supporting line.
- Word "playable" appears in hero subhead area (via secondary CTA's destination section), AuraLink section, and meta description.
