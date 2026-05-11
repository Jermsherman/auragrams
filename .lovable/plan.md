## What's already in place

After auditing the codebase, the bulk of the AuraLink spec is already implemented and shipped:

- Homepage has dual CTAs (Create Aura / Build AuraLink) + an "AuraLink is your music-first link page" spotlight section.
- `/auralink` and `/auralink/create` routes both render `AuraLinkBuilder` behind `RequireAuth`.
- Builder covers: Basic Info (title, artist, slug, description, cover upload), Mode selector, Streaming Links (full PLATFORMS catalog incl. Spotify/Apple/SoundCloud/YouTube/YT Music/Bandcamp/Audiomack/Tidal/Deezer/Amazon/Pandora/Boomplay/Audius/Presave/Website/Merch/Tickets/Other), Social Links (full SOCIAL_PLATFORMS catalog), Custom Links, Auras-from-Farm picker with multi-select + reorder + featured, Theme picker (10 presets + Custom theme with bg/accent/button/glow), live preview, save/publish, library strip with Edit/Copy/Open/Delete.
- Public `/l/$slug` page renders `AuraLinkView` with profile/featured Aurascope, title, artist, bio, social pill row, featured Aura, streaming + custom buttons, playable Aura cards, footer.
- `AuraLinkAuraCard` plays audio inline, drives the Aurascope analyser, pauses siblings when another card plays, links to `/aura/$id`.
- Farm cards already expose "Add to AuraLink" via `AddToAuraLinkDialog`.
- Aura page `ShareDialog` already has Copy AuraLink, View Story Preview, Add to AuraLink, Build new AuraLink.

So this patch is a focused polish pass on the few real gaps — not a rebuild.

## Remaining gaps to close

1. **Copy tweaks** (spec-exact wording)
   - Homepage hero subheadline → "Turn songs into living Auras, save them to your Farm, and build an AuraLink that brings your music, visuals, and socials into one shareable page."
   - Homepage spotlight subtitle → "Add streaming links, social profiles, and playable Auras from your Farm into one page built for bios, stories, DMs, and rollouts."
   - Builder subtitle → "Create a music-first link page with streaming links, social links, and Auras from your Farm."

2. **SEO fields on AuraLink**
   - Extend `AuraLinkPage` in `src/lib/auralink.ts` with optional `seoTitle`, `seoDescription`, `socialPreviewImage`.
   - Add a collapsible "SEO & sharing" section at the bottom of `AuraLinkBuilder` with three inputs + an image uploader (reuses `uploadAuraLinkCover` from `src/lib/auralinkImages.ts`). Show placeholder text with the spec defaults: `[Artist Name] | AuraLink` and `Listen to [Artist Name], explore Auras, and find all official music links.`
   - Persist through `saveAuraLink` / `updateAuraLink` (no migration needed — fields are optional).

3. **Dynamic public-page metadata** (`src/routes/l.$slug.tsx`)
   - Add a `loader` that calls `getAuraLinkBySlug(params.slug)` and returns `{ page }` (or throws `notFound`).
   - Add `head: ({ loaderData })` that emits `title`, `description`, `og:title`, `og:description`, `og:type=profile`, and `og:image`/`twitter:image` using:
     - title → `page.seoTitle` ?? `\`${page.artistName || page.title} | AuraLink\``
     - description → `page.seoDescription` ?? `\`Listen to ${page.artistName || page.title}, explore Auras, and find all official music links.\``
     - image → `page.socialPreviewImage` ?? `page.profileImageUrl` (omit if neither exists).
   - Keep component using the loader data so we don't double-fetch.
   - Note: `getAuraLinkBySlug` reads `localStorage`, so guard the loader with `typeof window !== "undefined"` and fall back to a generic head on SSR/prerender (consistent with the rest of the localStorage-backed app).

## Files

- **Edit** `src/routes/index.tsx` — two subhead copy strings.
- **Edit** `src/components/AuraLinkBuilder.tsx` — header subtitle copy + new SEO section bound to three new state fields, threaded into `previewPage` and `publish`.
- **Edit** `src/lib/auralink.ts` — add `seoTitle?`, `seoDescription?`, `socialPreviewImage?` to `AuraLinkPage`.
- **Edit** `src/routes/l.$slug.tsx` — convert static head to dynamic head via loader/`useLoaderData`, with SSR-safe guard.

## Out of scope (per user)

No Fave 5, no extra social features, no MySpace-tier customization, no backend migration — localStorage stays the source of truth.