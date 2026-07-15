# Auragram MVP evaluation — release plan

Below is a full-app audit and a prioritized plan to reach a releasable beta on **Lovable + Lovable Cloud only** with **minimal recurring cost**. Everything is grouped by urgency. Nothing here changes the core "music → living Aura → AuraLink" concept — it hardens what you have.

---

## Verdict

Product concept, hero, and Aura visuals are strong. The blockers are: one broken route link, generic share previews, an unnecessarily public audio bucket, and 3-step onboarding friction. Fix those and you can ship.

Everything else is polish or nice-to-have.

---

## P0 — Ship blockers (must fix before beta)

### 1. Broken link crashes the Aura detail page
`src/routes/aura.$id.tsx` renders `<Link to="/artist/$handle" params={{ handle: track.artistHandle }}>` but `/artist/$handle` was removed. TanStack Router will throw on this typed route. Replace with a plain `<span>` (artist name only) — no artist discovery page exists in MVP.

### 2. Aura share previews are generic
`/aura/$id` uses `head: () => ({ meta: [{ title: "AuraLink · " + params.id }] })`. Every share on IG/TikTok/DMs shows the aura id, not the track. Move to `loader`-driven meta using the same `getPublicAura` fetch already used in the component (dedupe). Set title = `"{trackTitle} · Aura on Auragram"`, description = `vibeDescription` or a fallback, `og:image` = `extra.coverUrl` when present.

### 3. Audio bucket is public — privacy and cost hazard
`auragram-audio` is public. Anyone who guesses or scrapes URLs can bulk-download every uploaded song. Two options, keep it simple for MVP:

- Keep bucket public but generate **signed URLs (7-day expiry)** on read instead of raw `getPublicUrl`. Store `audio_storage_path` (already stored); mint the signed URL in `getPublicAura` / `mapAuraRowToSaved`. Anonymous crawlers cannot enumerate paths.
- OR flip the bucket to private and add an RLS policy allowing SELECT on the bucket for signed URLs only. Same public playback UX, no scrape risk.

Either way: remove `audio_public_url` write from `uploadAuraAudio` and derive it at read time.

### 4. Root `og:image` is a stale Lovable preview PNG
`src/routes/__root.tsx` hardcodes a preview screenshot URL in `og:image`/`twitter:image`. Remove those two entries from `__root.tsx` — Lovable hosting injects a fresh project og:image at serve time. Keep `og:image` only on leaf routes that own real content (`/l/$slug` already does).

### 5. Onboarding is 3 forced steps
Current onboarding forces username → artist profile → default identity before the user can create anything. For beta:

- Collapse to **Step 1 only**: pick a username (required) + optional display name.
- Move Artist Profile creation into `/create` as an inline "Post as…" chip — create the artist profile the first time the user picks that mode.
- Drop "default visibility" and "allow anonymous" from onboarding entirely; keep username as the always-on default identity. Add these controls later in Settings.

Result: from ~90 seconds to ~10 seconds before the first Aura.

---

## P1 — Cost minimization (Lovable Cloud only)

Storage GB + Storage egress are your two biggest cost lines. Everything else (DB, auth, page hosting) is negligible at MVP scale.

### 6. Cap audio uploads at 25 MB
`MAX_AUDIO_BYTES = 100 * 1024 * 1024` (100 MB) is 4× larger than a typical 3-minute MP3. Lower to 25 MB. Add a client-side warning at ≥ 20 MB suggesting MP3.

### 7. Actually delete audio when Auras are deleted
`deleteAuraAudio` is called with a swallowed `.catch`. When it silently fails, the file lives in Storage forever and keeps costing you. Await the delete, and if it fails, retry once and toast the user. Log failures.

### 8. Sweep abandoned guest Auras
Guest uploads land in Storage + IDB. If the guest never signs up, that audio is orphaned. Add a scheduled cleanup:

- Server function: delete rows in `auras` where `user_id IS NULL` and `created_at < now() - 72h`.
- Client already clears IDB on claim; also clear on session start if `pendingAura` is older than 72h.

Trigger via a `/api/public/cron/cleanup-guest-auras` server route + pg_cron (free on Lovable Cloud).

### 9. Trim the dependency graph
`package.json` includes ~30 Radix packages, plus `recharts`, `embla-carousel-react`, `html-to-image`, `input-otp`, `vaul`, `cmdk`, `react-day-picker`, `react-resizable-panels`. Grep confirms most are unused. Remove unused packages — smaller install, faster CI/build. Zero runtime cost impact (Vite tree-shakes), but cheaper to iterate.

### 10. Do **not** add AI Gateway, PostHog, Sentry, Stripe yet
- Aura generation is deterministic client-side — no AI Gateway needed.
- Skip analytics vendors; use Lovable Analytics (built-in, free).
- Skip Sentry until after beta feedback — console + Supabase logs are enough.
- No payments in MVP.

---

## P2 — UI adjustments

### 11. Make "playable" real on the landing hero
The hero teaches "generated from music" via metadata text but the orb doesn't actually play. Attach a short (6–8 sec) muted-by-default preview loop per `ShowcaseAura`:

- Store one royalty-free clip per showcase entry (or synthesize a short WebAudio loop with mood-matched tone — zero storage cost).
- Add a small circular play/mute button on the hero orb.
- When playing, feed the audio through the existing `useAudioAnalyser` → OrbVisual pulses to the beat. This sells "playable" in 2 seconds.

Prefer synthesized WebAudio (10 lines of code, zero storage) unless you want licensed samples.

### 12. Aura detail page — cleaner primary action
`/aura/$id` currently exposes 5 buttons: Save, Share AuraLink, Story Preview (flag-gated), Delete, Shuffle Palette. Reorder to **one primary CTA per state**:

- Guest: `Save & Build AuraLink` (already there).
- Signed-in not-owner: `Save to My Auras` primary, share secondary.
- Signed-in owner not-saved: same.
- Signed-in owner saved: `Build AuraLink` primary (or "View AuraLink" if one already exists), Share secondary, Delete tertiary in dropdown.

Move Delete + Shuffle Palette into a `⋯` menu to stop the button carpet.

### 13. Nav: "My AuraLink" should route contextually
`Nav.tsx` links "My AuraLink" to `/auralink` which starts a new builder every time. If the user has an existing AuraLink, route to `/l/{slug}` in a new tab OR to `/auralink?edit={id}` (existing builder in edit mode). You already fetch `previewSlug` for the "Public Preview" chip — use it here.

### 14. Homepage secondary CTA is redundant
Hero has "See Your Sound" (→ /create) and "View Example Aura" (→ #what-is-an-aura). The eyebrow chip above the H1 also says "See your sound" and scrolls to the same anchor. Drop the eyebrow chip; keep the two big CTAs.

### 15. Auth page — Google sign-in is disabled
`auth.tsx` has a `{/* Google sign-in temporarily disabled */}` comment. Enabling Google sign-in cuts signup drop-off by roughly half in similar apps. Turn on Google in the same edit that ships beta:

- Add the `lovable.auth.signInWithOAuth("google", ...)` button per Lovable Cloud auth conventions.
- `supabase--configure_social_auth` for `google` in the same turn so the first click doesn't error "Unsupported provider".

### 16. Small polish
- Root route: fix the outdated `<meta name="author" content="Lovable">` — set to `Auragram`.
- Onboarding: remove `Step X of 3` chip after collapsing to one step (see P0.5).
- `/farm` empty state: keep the primary "Create Aura" CTA, remove the search/filter row until there are ≥ 6 Auras — noise at zero.
- `/create` submit label: currently just "Continue" — make it "Generate Aura" for clarity.

---

## P3 — Functionality adjustments

### 17. Password reset flow
Not implemented. Add "Forgot password?" link on `/auth` → uses `supabase.auth.resetPasswordForEmail` with a return URL to a new `/auth/reset` page. Ships in ~30 lines.

### 18. Cover image never uploaded
`create.tsx` has `cover: File | null` state and reads `fileToDataUrl(cover)` but no UI ever sets `cover`. Either add the cover picker to the create form (recommended — improves share previews) or remove the dead state.

### 19. `AudioUploadPlayer` imported but unused in `aura.$id.tsx`
Line 7 imports it, nothing renders it. Delete the import.

### 20. Two-way AuraLink ↔ Aura navigation
From `/aura/{id}` you can build an AuraLink; from `/l/{slug}` you cannot jump to an Aura's own page. Add "Open Aura" chips on each aura tile in `AuraLinkView`.

### 21. Route protection
Protected routes (`/farm`, `/auralink`, `/settings/artists`) currently rely on the `<RequireAuth>` client component. This works but flashes for a moment on hard refresh. Optional: migrate to the integration-managed `_authenticated/` layout for cleaner SSR redirects. Not blocking — defer to post-beta.

---

## P4 — SEO / share hardening

### 22. Loader-driven meta on `/aura/$id`
Covered in P0.2. Once meta is loader-driven, the Aura detail becomes shareable everywhere with a real preview.

### 23. sitemap.xml
Add `src/routes/api/public/sitemap[.]xml.ts` server route emitting `/`, `/auralink`, `/create`, `/faq`, plus `/l/{slug}` and `/aura/{id}` for public rows. Cache 1 hour. Free traffic.

### 24. robots.txt
Not required — Lovable defaults are fine. Only add if you want to `Disallow: /generating` and `/onboarding`.

---

## Tools & services recommendation (keep costs minimal)

| Concern | Recommendation |
| --- | --- |
| Hosting | **Lovable Publish** (built-in). Custom domain: connect in Project Settings after first publish. |
| Backend (DB, auth, storage) | **Lovable Cloud only.** No external Supabase project, no Firebase. |
| AI | **None for MVP.** Do not enable AI Gateway — current generation is fully deterministic client-side. |
| Payments | **Skip.** Add later via seamless Stripe when you introduce paid tiers. |
| Email (transactional) | **Skip.** Supabase Auth default sender is fine for MVP; add Lovable Email + custom domain post-beta. |
| Analytics | **Lovable Analytics** (built-in). Skip PostHog/Amplitude/GA4 until you have 100+ DAU. |
| Error tracking | **Console + Supabase logs.** Add Sentry only if you hit unreproducible bugs post-launch. |
| CDN / edge | Lovable's default. No Cloudflare account needed. |
| MCP connectors | **None required for MVP.** |

Result: your only recurring costs are Lovable Cloud usage credits (DB + Storage GB + egress) — capped by upload size (P1.6), lifecycle cleanup (P1.7, P1.8), and single-vendor bundling.

---

## Suggested execution order

Ship in three passes so you can publish after each pass:

**Pass 1 — Unblock beta (est. 1 focused day)**
- P0.1 broken /artist link
- P0.2 aura share meta
- P0.4 root og:image cleanup
- P0.5 onboarding collapse to 1 step
- P2.15 enable Google sign-in

**Pass 2 — Privacy + cost (est. half day)**
- P0.3 signed audio URLs
- P1.6 upload cap → 25 MB
- P1.7 audio delete integrity
- P1.8 guest cleanup cron

**Pass 3 — Polish (est. half day)**
- P2.11 playable hero preview (synthesized WebAudio)
- P2.12 aura detail CTA cleanup
- P2.13 nav contextual AuraLink link
- P2.14 hero eyebrow chip cleanup
- P3.17 password reset
- P3.18 cover picker (or remove)
- P3.19 stale imports
- P4.23 sitemap

**Everything after that** (route layout migration, sitemap, deeper analytics) can ship post-beta based on real user signal.

---

## Files touched (across all passes)

- Fixes: `src/routes/aura.$id.tsx`, `src/routes/__root.tsx`, `src/routes/onboarding.tsx`, `src/routes/auth.tsx`, `src/routes/index.tsx`
- Cost/security: `src/lib/audioStorage.ts`, `src/lib/cloudAura.ts`, new `src/routes/api/public/cron/cleanup-guest-auras.ts`
- UI: `src/components/Nav.tsx`, showcase preview (new small hook: `src/hooks/useShowcaseAudio.ts`)
- Auth: `supabase--configure_social_auth` (google)
- Deps: prune unused packages in `package.json`

No DB schema changes required beyond adding a cron entry.

---

## Out of scope (deliberately)

- Discovery / social feed / follows
- Notifications / email digests
- Payments and subscriptions
- Mobile app (PWA is enough at this scale)
- Migration to `_authenticated` route layout
- AI-authored vibe descriptions
- Multi-language

Approve this plan and I will execute Pass 1 in the first build turn. Pass 2 and 3 are separate approvals so you can preview beta before privacy/polish lands.