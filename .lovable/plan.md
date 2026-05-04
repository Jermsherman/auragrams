
## AuraLink as a first-class product

Auragram already calls each Aura page an "AuraLink." This patch introduces the **AuraLink page builder** — a separate Linktree-style music-first page that bundles streaming links and saved Auras into a single shareable URL. To avoid confusion with the existing `/aura/$id` page (also called "AuraLink"), we treat per-track AuraLinks and the new multi-link AuraLink pages as two flavours of the same idea — the new builder is for "AuraLink pages."

### 1. Data model — `src/lib/auralink.ts` (new)

```ts
export type AuraLinkMode = "streaming_links" | "auras" | "mixed";
export type AuraLinkTheme = "midnight" | "sunset" | "ocean" | "velvet" | "minimal";
export type AuraLinkLink = {
  id: string;
  type: "streaming" | "custom" | "aura";
  platformName?: string;   // spotify, apple, youtube, ...
  label: string;
  url?: string;
  auraId?: string;
  order: number;
  icon?: string;
  isFeatured?: boolean;
};
export type AuraLinkPage = {
  id: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  artistName: string;
  handleSlug: string;       // unique slug for /l/:slug
  description?: string;
  profileImageUrl?: string;
  mode: AuraLinkMode;
  selectedAuraIds: string[];
  links: AuraLinkLink[];
  theme: AuraLinkTheme;
  visibility: "public" | "unlisted";
  publicUrl?: string;
};
```

CRUD via localStorage (key `auragram_auralinks`): `getAuraLinks`, `saveAuraLink`, `updateAuraLink`, `deleteAuraLink`, `getAuraLinkBySlug`, `slugify`, `ensureUniqueSlug`. Code structured so a Supabase migration is a drop-in later.

### 2. Builder route — `src/routes/auralink.create.tsx` (new)

Sections, top to bottom:

- Header: "Build AuraLink" / "Create a music-first link page with streaming links, Auras, or both."
- **Mode selector** ("What do you want to share?"): Streaming Links · Auras · Mixed Page (3 large pill cards).
- **Identity block**: AuraLink title, artist name, slug (`/l/{slug}` preview), description, optional cover image (data URL upload).
- **Links block** (visible in Streaming + Mixed):
  - "Add Streaming Link" — opens a small platform picker (Spotify, Apple Music, SoundCloud, YouTube, YouTube Music, Bandcamp, Audiomack, Tidal, Deezer, Amazon Music, Pandora, Boomplay, Audius, Website, Merch, Tickets, Presave, Other) with URL + display label.
  - "Add Custom Link" — label + URL.
  - List with reorder (Move Up / Down) + remove.
- **Auras block** (visible in Auras + Mixed): grid of saved Auras from Farm with checkmark selection, ordered list of selected ones. Empty-state with "Create Aura" / "Use Streaming Links" CTAs.
- **Theme picker** ("Choose a vibe"): Midnight Glass · Sunset Pulse · Ocean Glow · Velvet Neon · Minimal Dark — small swatches.
- **Live mobile preview** (right column on desktop, toggle Edit/Preview on mobile) — renders the same `<AuraLinkView />` used by the public page.
- Sticky footer: "Preview AuraLink" (open public page in new tab) + "Publish AuraLink" (saves, navigates to `/l/{slug}`).

### 3. Public page — `src/routes/l.$slug.tsx` (new)

Mobile-first layout:
- Optional Logo top-left.
- Hero: profile image OR featured Aurascope (uses theme palette and first selected aura when `mode !== "streaming_links"`).
- Title, artist name, short description.
- Streaming buttons — large rounded buttons with platform glyph + label + glow accent from theme.
- Aura items rendered as alive cards: mini Aurascope + track title + aura name + mood tags + "Open Aura" link to `/aura/$id`.
- Share button (Web Share API, falls back to copy).
- "Created with Auragram" footer link.

Theme drives: page gradient, button glow, accent color, featured Aurascope tint. Implemented as a `THEMES` map of `{ bgClass, accent, glow }`.

Reusable component `src/components/AuraLinkView.tsx` shared by builder preview and public page.

### 4. Home page emphasis — `src/routes/index.tsx`

- Hero CTAs become two buttons: primary "Create Aura" → `/create`, secondary "Build AuraLink" → `/auralink/create`. Subheadline rewritten per spec, plus a small flow chip: `Create Aura → Save to Farm → Build AuraLink → Share Anywhere`.
- New section "AuraLink is your music-first link page." with feature bullets and a "Build AuraLink" CTA. Replaces nothing — sits between How It Works and the existing Features grid.

### 5. Navigation — `src/components/Nav.tsx`

Authenticated users see: `Farm` · `AuraLink` (new link to `/auralink/create`) · `Create` (CTA). On narrow widths the labels stay because they're short.

### 6. Farm + Aura integrations

- **`src/routes/farm.tsx`**: top-right adds "Build AuraLink from Farm" link (to `/auralink/create?mode=auras`). Empty Auras state stays.
- **`src/components/AuraFarmCard.tsx`**: new "Add to AuraLink" small action that opens a lightweight picker dialog listing the user's existing AuraLink pages (and a "Build new" button). For this iteration the dialog appends the aura into `selectedAuraIds` + a `type: "aura"` link entry on the chosen AuraLink. Dialog component: `src/components/AddToAuraLinkDialog.tsx` (new).
- **`src/components/ShareDialog.tsx`**: extend the existing dialog with three new rows above the existing Influence Aura link:
  - "Add Aura to existing AuraLink" → opens the `AddToAuraLinkDialog`.
  - "Build new AuraLink" → navigates to `/auralink/create?mode=mixed&aura={id}`.
  - "Copy Aura page link" — already covered by the existing copy button (kept).

### 7. Empty states

- No saved Auras in Auras mode: "You don't have any Auras yet." with **Create Aura** + **Use Streaming Links** buttons (the latter switches the builder mode).
- No AuraLinks list (used inside `AddToAuraLinkDialog`): "No AuraLinks yet." + Build AuraLink CTA.

### 8. Files

Created
- `src/lib/auralink.ts`
- `src/components/AuraLinkView.tsx`
- `src/components/AddToAuraLinkDialog.tsx`
- `src/routes/auralink.create.tsx`
- `src/routes/l.$slug.tsx`

Edited
- `src/routes/index.tsx` — hero CTAs, AuraLink section.
- `src/routes/farm.tsx` — "Build AuraLink from Farm" CTA.
- `src/components/Nav.tsx` — AuraLink nav link.
- `src/components/AuraFarmCard.tsx` — "Add to AuraLink" action.
- `src/components/ShareDialog.tsx` — AuraLink share rows.

No DB migration in this pass (localStorage only) — the data shape is structured so a Supabase `auralinks` table can be wired in a follow-up without changing call sites.
