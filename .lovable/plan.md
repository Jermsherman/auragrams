# Persist uploaded audio in Supabase Storage

Today the uploader only creates an in-memory `URL.createObjectURL(file)` and references it via `setSessionAudio()`. After refresh the object URL dies, the Farm Aura plays nothing, and public AuraLinks have no audio. This patch uploads the file to Supabase Storage, saves the public URL on the track/Aura, and falls back to it for playback.

## What you'll see

1. On `/create`, after picking/recording a file, an "Uploading audio…" indicator appears next to the track title. Submit stays disabled until the upload finishes (or you can cancel and pick another file).
2. After saving, refreshing `/aura/:id` still plays the audio. Aurascope still reacts.
3. The Farm card and any public AuraLink that includes that Aura play the same audio without needing a re-upload.
4. Files >50 MB or non-audio MIME types are rejected with a clear toast.
5. If a legacy Aura has no stored URL, the player shows: "This uploaded audio is no longer available. Re-upload to restore playback."

## Backend changes

Create a new public storage bucket `auragram-audio` via migration:

- public read, authenticated insert/update/delete
- RLS on `storage.objects` so users can only write under `auth.uid()/...`
- 100 MB per-object limit, allowed mime types: `audio/*`

Add columns to `public.auras` (nullable for backwards compatibility):

- `audio_storage_path text`
- `audio_public_url text`
- `audio_file_name text`
- `audio_mime_type text`
- `audio_size_bytes bigint`
- `audio_duration_seconds numeric`

## Frontend changes

### `src/lib/audioStorage.ts` (new)
- `uploadAuraAudio({ userId, auraId, file })` → uploads to `auragram-audio/{userId}/{auraId}/{safeName}` using the browser supabase client, returns `{ storagePath, publicUrl, fileName, mimeType, sizeBytes, durationSeconds }`.
- Uses `supabase.storage.from('auragram-audio').upload(path, file, { upsert: true, contentType })` and then `getPublicUrl`.
- Probes duration with a temporary `HTMLAudioElement` + the local object URL.
- Validates: MIME starts with `audio/` or extension in `.mp3 .wav .m4a .aac .ogg .webm`; size ≤ 100 MB.

### `src/lib/tracks.ts` and `src/lib/farm.ts`
- Extend `Track` and `SavedAura` with: `audioStoragePath`, `audioPublicUrl`, `audioFileName`, `audioMimeType`, `audioSizeBytes`, `audioDurationSeconds`, `uploadStatus: "pending" | "uploading" | "complete" | "failed"`.
- `saveAuraFromTrack` carries the new fields through.

### `src/lib/cloudAura.ts`
- Persist the new audio fields on insert/update of `auras` rows (mapped to the new columns).

### `src/routes/create.tsx`
- After `onPick`/`onRawRecorded`, kick off `uploadAuraAudio` for the (already‑allocated) `auraId` and track an `uploadStatus` state. Keep the local `URL.createObjectURL(file)` only as a preview while uploading.
- Generate the `id` once when a file is chosen so the storage path is stable.
- Block `submit()` while `uploadStatus === "uploading"`; on `failed`, show "Upload failed. Please try again." and allow retry.
- Save returned audio fields onto the track and into cloud Aura row.
- For Auracle multi-file flow, upload each file with its allocated id.

### `src/routes/aura.$id.tsx`
- Source priority for `<audio>` and Aurascope analysis:
  1. `track.audioPublicUrl` (preferred — survives refresh, set `crossOrigin="anonymous"`)
  2. `getSessionAudio(id)?.audioUrl` (in-memory preview during the same session)
  3. legacy `track.audioDataUrl`
- If none and `sourceType === "upload"`, render the "no longer available" message.

### `src/components/AuraLinkView.tsx` and `src/routes/l.$slug.tsx`
- When rendering an Aura with `audioPublicUrl`, allow playback of that URL on the public link page (existing logic just gains the new fallback).

## Technical notes

- Bucket is public for MVP (matches the public AuraLink expectation). We can switch to signed URLs later without changing call sites — `audioPublicUrl` is the single read field.
- File names are sanitized (`replace(/[^a-z0-9._-]+/gi, '_')`) and stored under `{userId}/{auraId}/...` so each user's uploads are isolated and RLS on `storage.objects` enforces ownership.
- `supabase.storage.upload` runs from the browser client with the user's session — no edge function needed.
- No change to existing `session.ts` flow; it still provides instant local preview before the network round-trip completes.

## Acceptance check

- Upload → refresh `/aura/:id` → audio still plays.
- Save to Farm → log out and back in → Farm card plays.
- Build an AuraLink with that Aura → open `/l/:slug` in incognito → Aura plays.
- Upload a 200 MB file → rejected with size toast.
- Upload a `.txt` → rejected with type toast.
