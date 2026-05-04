# Auragram MVP Upgrade Plan

A focused patch that strengthens audio reactivity, broadens platform link support, and introduces the "Aura Farm" saved-collection concept — without bloating the product.

## 1. Upload + Real Audio Reactivity

**`src/lib/session.ts`** — already correct (object URL only, in-memory). No change.

**`src/routes/create.tsx`** — small polish:
- Add file size + extended `accept` (`.aac`, `.ogg` already partially listed, normalize).
- After picking, show file size (already shown) + name (already shown). Keep as is.
- Drag/drop already wired.

**`src/hooks/useAudioReactive.ts`** — upgrade:
- Increase `analyser.fftSize` to `2048` so we can read time-domain (waveform) data.
- Lower `smoothingTimeConstant` to `0.6`.
- Expose both frequency and waveform readers via the same analyser node.

**`src/components/OrbVisual.tsx`** — upgrade analyser loop:
- Read `getByteTimeDomainData` (waveform) → drives **deformation, ripple, pulse** (peak-to-peak amplitude, smoothed).
- Read `getByteFrequencyData` → split into bass / mid / high bins.
  - bass → outer halo scale + ripple bursts
  - mid → surface motion (overall brightness)
  - high → particle shimmer intensity
- Heavy smoothing (lerp factor 0.15) + envelope follower so visuals feel musical, not jittery.
- Idle (no analyser): keep current breathing animation.

## 2. Platform Link Expansion

**`src/lib/tracks.ts` — `detectProvider()`** rewrite to recognize:

| Platform | Domains | Embed |
|---|---|---|
| Spotify | `open.spotify.com` | `embed/{type}/{id}` |
| YouTube / YT Music | `youtube.com`, `youtu.be`, `music.youtube.com` | `youtube.com/embed/{id}` |
| SoundCloud | `soundcloud.com`, `on.soundcloud.com` | `w.soundcloud.com/player/?url=…` |
| Apple Music | `music.apple.com` | `embed.music.apple.com` |
| Audiomack | `audiomack.com` | card |
| Bandcamp | `*.bandcamp.com` | card |
| Tidal | `tidal.com` | card |
| Deezer | `deezer.com` | card |
| Amazon Music | `music.amazon.com` | card |
| Pandora, Boomplay, Audius | their domains | card |
| Smart links (linkfire, lnk.to, ffm.to, fanlink.to, hyperfollow, distrokid, toneden, smarturl, solo.to, beacons, linktr.ee) | their domains | card |
| Anything else valid | — | card with "External Link" |

Update `Provider` union to include all platforms; add `platformName` (display label) and treat unknown valid URLs as `provider: "external"`.

**`src/components/PlatformCard.tsx`** (new): polished glass card with platform icon/badge + "Open on {platform}" CTA. Used when no embed is available.

**`src/routes/aura.$id.tsx`**: render embed iframe when `embedUrl` present, otherwise render the new `PlatformCard`. Show small caption *"Aura generated from your selected mood and track identity."* for platform sources, vs *"Aura reacting to uploaded audio."* for uploads.

## 3. Aura Farm (Saved Collection)

**`src/lib/farm.ts`** (new): localStorage helpers under key `auragram_farm_auras`:
- `getSavedAuras(): SavedAura[]`
- `saveAura(track: Track)` — stores metadata only (no file blobs)
- `deleteAura(id: string)`
- `isAuraSaved(id: string): boolean`

`SavedAura` shape: id, createdAt, trackTitle, artistName, sourceType (`upload` | `platform_link` | `external_link`), platformName, platformUrl, embedUrl, moodTags, auraName, auraDescription, energyLevel, palette.

**`src/routes/farm.tsx`** (new route `/farm`):
- Header with title "Aura Farm" + subtitle "Your growing collection of sonic auras."
- "Create New Aura" CTA → `/create`.
- Responsive grid of `AuraFarmCard`s.
- Empty state: "Your Farm is empty." + Create CTA.

**`src/components/AuraFarmCard.tsx`** (new):
- Mini orb (`<OrbVisual size={88} particles={false} />`).
- Aura name, track title, artist, mood chips, source-type badge.
- Buttons: Open (→ `/aura/$id`), Share (opens ShareDialog), Delete (trash icon → confirm).

**`src/components/Nav.tsx`** — add "Farm" link beside the create CTA.

## 4. Save / Delete UX on Aura Page

**`src/routes/aura.$id.tsx`**:
- "Save to Farm" button beside Share. Becomes "Saved in Farm" once saved.
- Overflow menu with "Delete from Farm" (confirm dialog → toast → navigate to `/farm`).
- For uploads where session expired AND aura is saved, still render the orb + metadata; show subtle banner "This uploaded audio session expired. Upload again to replay."

## 5. Share Modal Updates

**`src/components/ShareDialog.tsx`**:
- Add "Save to Farm" / "Saved in Farm" row.
- If platform link: add "Open on {platform}" + "Copy platform link" rows.
- Source-type badge at top (Uploaded Audio / Spotify / etc).

## 6. Story Preview Updates

**`src/components/StoryCanvas.tsx`**:
- Add platform badge when `sourceType === "platform_link"` (small pill above title).
- CTA text becomes "Open on {platform}" for platform links, otherwise "Listen on Auragram".

## 7. Routing

Add `src/routes/farm.tsx`. The TanStack Router Vite plugin regenerates `routeTree.gen.ts` automatically.

## Acceptance check
- Upload → orb reacts to real waveform, smooth.
- Paste any of 13+ platforms → embed or platform card.
- Save → appears in `/farm`. Delete works from card and aura page.
- Share modal & story preview adapt to source type.
- No streaming-audio scraping anywhere.
- App stays minimal, premium, dark, mobile-first.

## Out of scope
Backend persistence, analytics, NFT/wallet, multi-user collections, real Spotify SDK playback.
