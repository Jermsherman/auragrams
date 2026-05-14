# Fix: guest Aura loses its audio after sign-up

## Root cause

When a guest creates an Aura, the uploaded file lives only in an in-memory `Map` in `src/lib/session.ts`. Tapping "Save this Aura" navigates to `/auth`, which triggers a full page reload (and another one after auth redirects back). That wipes the in-memory store.

By the time `/aura/$id?claim=1` runs the claim effect in `src/routes/aura.$id.tsx`:

- `getSessionAudio(id)` returns `null`
- the upload-to-Supabase branch is skipped
- `saveAuraToCloud(...)` writes the row with no `audio_storage_path` / `audio_public_url`

Result: the cloud Aura has no audio, and on the next visit the page falls back to the cloud row — audio appears deleted.

## Plan

Keep the in-memory session store as-is (still the fast path), but add a tiny IndexedDB-backed persistence layer for the guest audio Blob, keyed by aura id, so it survives the auth navigation.

### 1. New file `src/lib/guestAudioStore.ts`

Minimal IndexedDB wrapper (no deps):

- `putGuestAudio(id, file: File): Promise<void>` — store `{ id, blob, name, type, savedAt }` in object store `guest_audio`.
- `getGuestAudio(id): Promise<{ file: File; audioUrl: string } | null>` — reconstruct a `File` from the blob and create an object URL.
- `clearGuestAudio(id): Promise<void>` — delete the entry and best-effort `URL.revokeObjectURL`.
- All functions are SSR-safe (`typeof indexedDB === "undefined"` → return null / noop) and swallow errors.

### 2. `src/routes/create.tsx`

Wherever we currently call `setSessionAudio(id, file, audioUrl)` (the two sites at ~line 276 and ~line 387), also `await putGuestAudio(id, file).catch(() => {})` when there is no signed-in user. This guarantees the file is durable before navigation.

(Logged-in users don't need this — they upload to Supabase Storage in the normal flow.)

### 3. `src/routes/aura.$id.tsx`

Two surgical changes inside the existing `claim` effect (lines ~171–232):

a. If `getSessionAudio(id)` returns nothing, fall back to `await getGuestAudio(id)` and use that `{ file }` for the `uploadAuraAudio(...)` call. Everything else stays the same.

b. After a successful `saveAuraToCloud(...)`, call `await clearGuestAudio(id).catch(() => {})` alongside the existing `clearPendingAura()`.

Also extend the initial audio-resolution effect (lines ~92–110): if no session blob and no `audioPublicUrl`, asynchronously try `getGuestAudio(id)` and `setAudioUrl(entry.audioUrl)`. This makes the guest Aura playable on `/aura/$id` even after a hard refresh before sign-up.

### 4. Out of scope

- No schema changes.
- No changes to `auralinkService`, `farm.ts`, or any other route.
- We do NOT remove the in-memory `session.ts` store — the IDB layer is purely additive.
- No quota/eviction UI; only one pending guest Aura is allowed at a time (already enforced by `pendingAura.ts`), so storage stays bounded.

## Acceptance check

1. Sign out, create an Aura as guest, tap "Save this Aura", complete sign-up.
2. Land back on `/aura/$id?claim=1` — toast says "Saved to My Auras".
3. The Aura in `/farm` plays the original uploaded audio.
4. Refresh the page — audio still plays from the cloud URL.
