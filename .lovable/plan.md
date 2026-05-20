# Plan: Auragram fixes + AuraLink deep customization

A 4-part build delivered in safe, additive steps so nothing breaks. Schema gets one small migration (avatar + AuraLink customization JSON). Everything else is UI / client logic.

---



---

## 2. Post-save onboarding (after first sign-up + claim)

After the guest claim flow saves the Aura, instead of going straight to `/auralink/create`, route to a new lightweight `/onboarding` step (the route file already exists — repurpose it) with a 3-step checklist:

1. **Name your AuraLink handle** (slug, pre-filled from artist name).
2. **Add 1 streaming or social link** (optional skip).
3. **Pick a starting theme** (visual grid).

"Finish" creates the first AuraLink in cloud with the chosen slug + theme + the just-claimed Aura preselected and featured, then navigates to `/auralink?id=…` builder for deeper edits. "Skip" goes straight to the builder.

Only shown once — gated by `profile.onboarded_at` (new column, nullable timestamptz). Existing users see nothing.

Files: `src/routes/onboarding.tsx`, `src/routes/aura.$id.tsx` (redirect target), tiny update to `cloudAura` claim flow.

---

## 3. My Auras page polish (`/farm`)

Keep existing structure, additive UX upgrades:

- Add **search** input (filter by track title / aura name / artist).
- Add **sort** dropdown (Newest, Oldest, A–Z, Most-used in AuraLinks).
- Each card gets a **"Set as featured in AuraLink"** quick action when the user has ≥1 AuraLink (lists their AuraLinks in a small popover; updates `featured_aura_id`).
- Already supports delete + add-to-AuraLink — keep those.
- Bulk select mode (checkbox per card, "Add selected to AuraLink" / "Delete selected"). Optional polish; include behind a small "Manage" toggle.

Files: `src/routes/farm.tsx`, `src/components/AuraFarmCard.tsx`.

---

## 4. AuraLink deep customization (the MySpace energy)

This is the largest piece. Extend the existing `AuraLinkTheme` model rather than replacing — back-compat preserved.

### Data model additions (stored in existing `auralinks.theme` JSONB — no migration needed)

```ts
type AuraLinkTheme = {
  // existing
  name; mode; preset; backgroundColor; primaryAccent;
  secondaryAccent; buttonColor; glowColor;

  // NEW (all optional, sensible defaults)
  background?: {
    kind: "solid" | "gradient" | "image" | "aura";
    imageUrl?: string;        // uploaded to auralink-images bucket
    auraId?: string;          // uses that Aura's palette as animated bg
    gradientAngle?: number;   // 0–360
    overlayOpacity?: number;  // 0–1 darken on top of image
  };
  fontHeading?: string;       // preset key from a curated list (12 pairs)
  fontBody?: string;
  buttonShape?: "pill" | "rounded" | "square" | "soft" | "outline" | "glass";
  buttonStyle?: "solid" | "outline" | "ghost" | "gradient";
  sectionOrder?: Array<"profile" | "socials" | "streaming" | "auras" | "custom">;
  spacing?: "compact" | "comfy" | "airy";
  showLogo?: boolean;         // hide Auragram footer logo (premium-feeling)
  decorations?: {
    grain?: boolean;
    stars?: boolean;
    bokeh?: boolean;
  };
};
```

### Builder UI (`AuraLinkBuilder.tsx`)

Reorganize the existing right-rail editor into tabbed sections:

- **Content** — title, artist, description, profile image (existing).
- **Theme** — preset grid (existing) + custom color pickers (existing) + **font pair picker** (12 curated pairs) + **button shape** chips + **decorations** toggles.
- **Background** — radio: Solid / Gradient / Image upload / Use an Aura. Image upload reuses `uploadAuraLinkCover`. "Use an Aura" picks from the user's saved Auras and renders the Aurascope as an animated background.
- **Layout** — drag-to-reorder list for `sectionOrder`, spacing toggle.
- **Links & Auras** — existing streaming/social/custom/aura sections.
- **SEO** — existing.

Live preview on the left already updates in realtime — extend `AuraLinkView` to honor the new theme fields.

### Public renderer (`AuraLinkView.tsx`)

- Respect `sectionOrder` when rendering blocks.
- Apply `fontHeading`/`fontBody` via inline `style={{ fontFamily }}` on headings/body (fonts loaded via Google Fonts `<link>` injected by the renderer for whichever pair is selected — preloaded list, no arbitrary CSS).
- Render background variants (solid, linear-gradient with angle, full-bleed image with overlay, or animated Aura background using existing `Aurascope` in `mode="atmosphere"` scaled to viewport with low opacity).
- Apply button shape / style classes consistently.
- Render decorations (CSS-only grain noise, twinkling stars, bokeh blobs) — pure CSS, no perf hit.

**No custom CSS textarea** (security risk). Customization is constrained to the typed fields above — keeps it safe but still gives strong MySpace-style expressiveness.

Files: `src/lib/auralink.ts` (type + defaults + 12 font pairs catalog), `src/components/AuraLinkBuilder.tsx` (tabs + new controls), `src/components/AuraLinkView.tsx` (renderer), `src/components/auralink/BackgroundEditor.tsx`, `src/components/auralink/LayoutEditor.tsx` (new, small).

---

## 5. Profile avatar (foundation for future public profile)

- New column: `profiles.avatar_url text`.
- Reuse `auralink-images` bucket (already public, has user-folder RLS).
- Avatar upload UI in `UserMenu` dropdown ("Edit profile" → small dialog with file picker, compress to 256px via existing `compressImage`).
- Show avatar in `Nav` (replaces initials circle) and as default `profileImageUrl` fallback in AuraLink builder when the user hasn't uploaded a per-AuraLink cover.
- No public profile page yet — that's deferred per your answer ("Light: public profile page only" was chosen but you also said skip social; we'll lay the data foundation now and defer the actual `/u/$username` page to a follow-up unless you want it in this batch).

Files: migration (one column add), `src/components/UserMenu.tsx`, `src/components/Nav.tsx`, new `src/components/EditProfileDialog.tsx`, small helper `src/lib/profileImage.ts`.

---

## Database migration (single, additive, safe)

```sql
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists onboarded_at timestamptz;
```

No table drops, no RLS rewrites, no data loss. Existing rows unaffected (NULLs).

---

## What I'm explicitly NOT doing in this batch

- Follow / like / comment / public profile pages (deferred per your answer).
- Custom CSS textbox on AuraLink (security).
- Photo gallery on profile (only single avatar this round).
- Changing existing Auracle / aura generation logic.
- Any breaking changes to existing AuraLinks — old themes still render via `resolveTheme` fallbacks.

---

## Order of execution

1. Migration (avatar + onboarded_at) — 1 step, awaits your approval.
2. Profile avatar upload + Nav swap.
3. Music link upload mode on `/create`.
4. AuraLink theme model extension + builder tabs + renderer.
5. My Auras polish (search/sort/featured).
6. Post-save onboarding route + claim redirect rewire.

Each step is independently shippable and gated by a passing build. If you approve, I'll start with the migration.