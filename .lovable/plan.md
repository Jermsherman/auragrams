## What's going wrong

Network logs and console confirm the real failure mode:

- The audio file uploads to Storage successfully (200 OK at
  `auragram-audio/{userId}/gqz92qvsao/...mp3`).
- The follow-up `POST /rest/v1/auras` fails with **400**:
  `invalid input syntax for type uuid: "gqz92qvsao"`.

Why: `makeId()` in `src/lib/tracks.ts` returns a short random base36 string,
but `public.auras.id` is a `uuid` column. So:

1. The Aura row is **never created in the cloud**.
2. After refresh, or on Farm/AuraLink/public views that read from the cloud,
   there is no row → no `audio_public_url` → playback shows the
   "audio is no longer available" empty state.
3. Even though `localStorage` still has the track with `audioPublicUrl`,
   anything cloud-driven (Farm sync, public AuraLink page, another device)
   sees nothing.

The Storage object itself plays fine — the failure is purely the missing DB
row, which breaks every code path that doesn't rely on the same browser's
localStorage.

## Fix

### 1. Use real UUIDs for new Auras and Auracles

In `src/lib/tracks.ts` and `src/lib/auracle.ts`, change `makeId()` to:

```ts
export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // RFC4122 v4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

This makes the cloud insert succeed, so `auras.audio_public_url` is actually
persisted and playback works after refresh, on the Farm, and on public
AuraLinks.

### 2. Surface upload/save failures instead of swallowing them

In `src/routes/create.tsx`, replace the silent
`.catch((e) => console.error("cloud save aura", e))` with a user-facing
toast:

```ts
.catch((e) => {
  console.error("cloud save aura", e);
  toast.error("We couldn't save your Aura to the cloud. Try again.");
});
```

That way, if the DB insert ever fails again the user knows immediately
instead of getting a broken playback experience later.

### 3. Tighten the playback fallback in `/aura/$id`

`src/routes/aura.$id.tsx` currently uses local track only. Add a cloud
fallback so an Aura opened on a fresh device still plays:

- If `getTrack(id)` returns null OR has no `audioPublicUrl`, call
  `getPublicAura(id)` from `src/lib/cloudAura.ts` and use
  `audio_public_url` as the source.
- Keep the existing session-URL path for the just-uploaded case.

Final priority for `audioUrl`:
1. `track.audioPublicUrl` (local cache)
2. cloud row's `audio_public_url`
3. session blob URL (just-uploaded, same tab)
4. legacy `audioDataUrl`

### 4. Validate IDs already in localStorage

For users who already created Auras with the old short IDs (which exist in
their localStorage but never made it to the cloud), the local playback path
still works in the same browser session. We do not migrate them — they will
recreate or re-save Auras with the new UUIDs. No destructive change.

## Files to change

- `src/lib/tracks.ts` — UUID-based `makeId()`.
- `src/lib/auracle.ts` — same UUID-based `makeId()`.
- `src/routes/create.tsx` — surface cloud-save errors via toast.
- `src/routes/aura.$id.tsx` — cloud fallback for `audioUrl`.

No database migration, no Storage policy changes, no schema changes.

## Acceptance

- Uploading an audio file results in a successful `POST /rest/v1/auras`
  (no more 22P02 UUID error in console).
- After page refresh on `/aura/{id}`, the uploaded audio still plays.
- Saved Farm Auras play without re-uploading.
- Public AuraLinks for public Auras play the uploaded audio on any device.
- If the DB write ever fails, the user sees a clear toast instead of a
  silent broken player.
