# Real-audio link mode + UX polish

You're right: an Aura without real audio is fake. The fix is to only accept links from sources where we can fetch a real audio preview, then run that preview through the **same analyzer pipeline** as an uploaded MP3 (key, pitch center, energy, mood suggestions). Everything else gets a friendly "upload the file instead" message.

## What ships as v1

**Supported in link mode:** Spotify track URLs.
- Spotify's Web API returns a `preview_url` (30s MP3, CDN-hosted, CORS-friendly) for most tracks plus title, artist, cover art, duration.
- 30s is enough for the existing key/pitch/energy detectors — they already window to ~30s.

**Hidden / "not supported yet" in link mode:**
- Apple Music, YouTube, YouTube Music, Tidal, Deezer, Amazon, Pandora, smart links — no clean preview audio without scraping or TOS issues. SoundCloud and Bandcamp are technically possible but need more work (separate follow-up); they stay listed but show "Upload the file for now."

If the user pastes a non-Spotify link, the Generate button is disabled and we show: *"We can only read audio from Spotify track links right now. Paste a Spotify track URL, or upload the file."*

## Technical detail

### 1. New server function `src/lib/musicLinks.functions.ts`
- `resolveMusicLink({ url })` → `{ ok: true, provider, trackId, title, artist, coverUrl, previewUrl, durationMs } | { ok: false, reason }`
- Spotify-only branch:
  - Read `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` inside `.handler()`.
  - Get a client-credentials token (cached in-memory per worker for `expires_in - 60s`).
  - `GET https://api.spotify.com/v1/tracks/{id}?market=US` (market chosen to maximize `preview_url` availability).
  - Return DTO only — never leak tokens.
- Reasons: `unsupported_provider`, `no_preview` (track has no preview_url — common for some labels), `not_found`, `bad_url`, `server_misconfig`.
- Input validated with the existing `musicLinkSchema` (Zod, max 500 chars, must parse as URL).

### 2. Secrets
Requires two runtime secrets the user must add via the secret prompt:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
(Free Spotify developer app — instructions surfaced in the prompt copy. Until both are set, link mode shows a soft "Coming soon" state instead of crashing.)

### 3. Client flow in `src/routes/create.tsx` (link mode)
Replace the current `linkInfo` memo + naive `platform_link` submission with a real fetch-and-analyze flow:

1. User pastes URL.
2. Inline validation via existing `parseMusicLink` — show platform chip immediately.
3. If provider !== `"spotify"` → disabled CTA with the message above + a "Switch to file upload" button that copies the title/artist guess and flips `mode` to `"file"`.
4. If provider === `"spotify"` → click **Fetch preview** (or auto-debounce 600ms after paste):
   - Call `resolveMusicLink`.
   - Show loading skeleton on the cover card.
   - On success: render cover thumbnail, prefill `title` + `artist` (user can still edit), download the `previewUrl` as a Blob, wrap it in a `File`, and feed it into the **existing** `onPick(file)` path. From here every downstream detector (`detectKey`, `analyzeFile`, `detectPitchCenter`, `suggestMoods`) runs unchanged, and `sourceType` becomes `"upload"` because we now have real audio — that keeps the Aura honest. We tag the track with `provider: "spotify"`, `streamUrl: url`, `embedUrl` so the player still shows the Spotify embed for playback of the full track.
   - On `no_preview`: show "Spotify didn't return an audio preview for this track. Try a different release or upload the file." with an Upload CTA.
   - On `not_found` / `bad_url`: inline error under the input.

### 4. UX polish on the Link tab
- Big paste-friendly input with a Spotify icon prefix, "Paste a Spotify track URL" placeholder, and a one-tap **Paste** button (uses `navigator.clipboard.readText`, falls back to focus).
- Live state card directly under the input with three visual states:
  - **Empty** — soft hint + supported/unsupported provider list (Spotify ✅; everything else "Upload the file").
  - **Resolving** — skeleton cover + shimmer title.
  - **Resolved** — 64px cover, title, artist, duration, "Preview loaded ✓" pill, and a small ▶︎ to preview the 30s clip in place using the existing `AudioPlayer`.
- Clear "Clear link" (×) action; mode tabs preserve state when you switch back.
- Submit button copy becomes **"Generate Aura from preview"** (vs "Generate Aura" for file mode) so the user knows what's analyzed.
- Help link: a "Why only Spotify?" tooltip linking to a short FAQ entry explaining we need real audio to make a real Aura.

### 5. Remove dead code paths
- Drop the old `mode === "link"` branch in `submit()` that wrote a `platform_link` track with no audio — replaced by the upload path described above. The `sourceType: "platform_link"` enum value stays in types for backwards compatibility with existing saved Auras, but new Auras created from a Spotify link are stored as `sourceType: "upload"` + `provider: "spotify"` + `streamUrl` so playback still goes to Spotify.

### 6. Files touched
- **New:** `src/lib/musicLinks.functions.ts` (server fn + Spotify client-credentials helper).
- **Edited:** `src/routes/create.tsx` (link mode UI + new client flow), `src/lib/musicLinks.ts` (add `isSupportedForAudio(provider)` helper + tighter messages).
- **Secrets request:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` (prompted before wiring the server fn).
- **No DB migration. No changes to AuraLink, Farm, or onboarding** in this turn.

## Out of scope (call out, don't build)
- SoundCloud / Bandcamp real-audio support (needs separate research — SoundCloud requires a deprecated client_id; Bandcamp needs HTML scraping of the embed JSON).
- Apple Music / YouTube real-audio support (no legitimate preview endpoint).
- Any AuraLink, profile, or onboarding work — last turn's pending items stay pending.

## Confirmation needed before I start
I'll request the two Spotify secrets via the secret prompt. You'll need a free Spotify Developer app (dashboard.spotify.com → Create App → copy Client ID + Secret). Approve this plan and I'll trigger that prompt as the first step.
