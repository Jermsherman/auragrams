# Pass 2 — Privacy + cost hardening

Scope is exactly the four items from the approved release plan's Pass 2. No new features, no scope creep.

## 1. Signed audio URLs (P0.3)

**Goal:** stop anyone from bulk-downloading uploaded songs by scraping public URLs, without breaking playback.

- Flip the `auragram-audio` bucket to **private** via `supabase--storage_update_bucket`.
- Add a `storage.objects` RLS policy allowing `SELECT` for `authenticated` and `anon` (needed so signed URLs work for guests too) — access is gated by the signed token, not the row.
- In `src/lib/audioStorage.ts`:
  - Remove the `getPublicUrl` write from `uploadAuraAudio`. Keep storing `audio_storage_path` only.
  - Add `getSignedAudioUrl(path, expiresInSec = 604800)` (7-day expiry).
- In `src/lib/cloudAura.ts`:
  - In `mapAuraRowToSaved` and `getPublicAura`, mint a signed URL from `audio_storage_path` at read time instead of trusting the stored `audio_public_url`.
  - Leave the DB column in place (backward compatibility) but stop writing it.
- No client changes — `AudioPlayer` receives the same string, just now a signed URL.

## 2. Upload cap → 25 MB (P1.6)

- `src/lib/audioStorage.ts`: `MAX_AUDIO_BYTES = 25 * 1024 * 1024`.
- Client warning at ≥ 20 MB (in `RawAuraRecorder` / upload flow) suggesting MP3.
- Update copy in the upload UI to reflect the new limit.

## 3. Audio delete integrity (P1.7)

- In the aura-delete server function / helper: `await deleteAuraAudio(path)`, don't swallow the error.
- On failure: retry once, then log and surface a toast to the user ("Aura deleted, but the audio file couldn't be removed — try again later"). This stops silent Storage bloat.

## 4. Guest cleanup cron (P1.8)

- New server route `src/routes/api/public/cron/cleanup-guest-auras.ts` (POST):
  - Verify `apikey` header matches `SUPABASE_PUBLISHABLE_KEY`.
  - `select id, audio_storage_path from auras where user_id is null and created_at < now() - interval '72 hours'`.
  - For each: delete storage object (best-effort), then delete DB row.
  - Return `{ deleted: n }`.
- Migration adds a `pg_cron` job running daily at 03:00 UTC that `net.http_post`s to the route.
- Client side (`src/lib/pendingAura.ts`): on session start, if `pendingAura.createdAt > 72h` ago, clear IDB + localStorage entry so the UI doesn't try to claim a row the cron already reaped.

## Files touched

- `src/lib/audioStorage.ts` — private bucket, signed URLs, 25 MB cap.
- `src/lib/cloudAura.ts` — mint signed URL at read time.
- `src/lib/pendingAura.ts` — expire local guest state after 72h.
- Aura-delete call site (`src/routes/aura.$id.tsx` or the shared helper it uses) — await delete + toast on failure.
- `src/components/RawAuraRecorder.tsx` — 20 MB warning copy.
- **new** `src/routes/api/public/cron/cleanup-guest-auras.ts`.
- **new migration** — flip bucket private (via tool), add `storage.objects` signed-read policy, install `pg_cron`/`pg_net` if not already, schedule the cleanup job.

## Verification

- Upload a track → play from `/aura/$id` → confirm the audio URL in DevTools is a `/object/sign/...` URL and 404s after the expiry query param is removed.
- Upload a 30 MB file → rejected client-side with clear message.
- Delete an aura → confirm the storage object is gone (Storage tool listing).
- Force-set a guest aura row's `created_at` to `now() - interval '4 days'` → invoke the cron route with the anon `apikey` → row + object gone.
- `tsgo` clean.

---

# On the two MCP tool ideas you mentioned

These aren't in Pass 2 — they're extra tools that would live on **this app's** MCP server (`/mcp`, already wired via `@lovable.dev/mcp-js`). Explaining what each would actually do so you can decide whether to add them later.

## `analyze_audio` — "MCP audio analysis"

Exposes the analyzers you already ship in `src/lib/audioFeatures.ts` and `src/lib/keyDetect.ts` as a tool an assistant (Claude / ChatGPT / Cursor) can call.

- **Input:** a URL to an audio file (or a Storage path in this app).
- **Server work:** fetch the bytes, decode, run the existing feature extraction — RMS/loudness, spectral centroid (brightness), bass/mid/treble energy, transient intensity, estimated tempo, key + mode, pitch center.
- **Output:** the same `AudioFeatures` + `KeyDetection` JSON the browser already computes, plus a one-line human summary.
- **Why it's useful:** lets an assistant say "your track is 92 BPM, E minor, warm and low-transient — here's an Aura palette that matches" without the user opening the app. Also lets it batch-analyze a playlist and reason about it.
- **Caveat worth flagging:** the current analyzers are Web Audio API only (`AudioContext`, `decodeAudioData`). Running them server-side means porting to a Worker-safe decoder (e.g. `wav-decoder` for WAV, a WASM MP3 decoder) or moving the FFT/chroma math off the browser primitives. Not a one-line change.

## `render_aura` — "MCP aura renderer"

Turns an Aura into an image (or the same JSON the app uses) via the same deterministic generator in `src/lib/aura.ts` + `src/components/OrbVisual.tsx`.

- **Input:** either an audio URL (chain with `analyze_audio` internally) OR an existing `aura.id`.
- **Server work:** run `generateAuraFromFeatures` → get palette, mood, energy, orb params. Optionally rasterize the orb to a PNG (headless canvas / server-side SVG → PNG).
- **Output:** `{ palette, mood, vibeDescription, energy, imageUrl }` where `imageUrl` is a short-lived signed URL to the rendered orb.
- **Why it's useful:** an assistant can generate share previews, thumbnails, or "here's what your song looks like" images without the browser. Great for pipelines like "post my new track to X with its Aura as the cover."
- **Caveat:** rendering to PNG server-side requires a Worker-compatible canvas (satori + resvg-js is the usual choice on Cloudflare Workers). Returning just the JSON aura is free; PNG rendering is the part that costs.

Neither is on the Pass 2 critical path. Recommend deferring both until after beta unless you have a specific assistant workflow in mind — the current MCP `echo` (or whatever tools you exposed) is enough to prove the connection, and adding these two later is additive.

---

Approve this plan and I'll execute Pass 2 in one build turn. The MCP tools stay out of scope unless you explicitly say "add them."
