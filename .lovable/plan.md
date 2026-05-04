# Fix: "Publish AuraLink" button does nothing

## Root cause

Clicking **Publish** throws `QuotaExceededError` from `localStorage.setItem` inside `saveAuraLink` (`src/lib/auralink.ts`). The toast/navigate after `saveAuraLink(...)` never runs, so the button appears dead.

The quota is blown because the AuraLink builder reads the chosen cover/avatar image as a base64 data URL and stuffs the whole thing into the page object:

```ts
// src/routes/auralink.create.tsx
const onImage = (file: File | null) => {
  const reader = new FileReader();
  reader.onload = () => setProfileImageUrl(String(reader.result || ""));
  reader.readAsDataURL(file);              // ← multi-MB string
};
// ...
profileImageUrl: profileImageUrl || undefined,
saveAuraLink(page);                         // ← localStorage.setItem blows up
```

A 2–5 MB photo from a phone camera easily exceeds the ~5 MB localStorage cap once combined with existing Farm + AuraLink data.

## Fix

1. **Upload cover images to Supabase Storage** instead of base64 in localStorage.
   - Reuse the existing public `auragram-audio` bucket via a new `auralinks/` prefix, or add a new public bucket `auralink-images` (cleaner).
   - On image select, upload immediately and store only the resulting public URL in component state (and ultimately in the page record).
   - Show a small "Uploading…" state on the file field while in flight; disable Publish until done.

2. **Defensive save in `src/lib/auralink.ts`**
   - Wrap `localStorage.setItem` in try/catch. On `QuotaExceededError`, surface a real error (return `null` / throw) so the caller can `toast.error("Storage full — try a smaller cover image.")` instead of silently failing.

3. **Trim payload before persisting**
   - If `profileImageUrl` is still a `data:` URL for any reason (legacy entries), reject it at save time with a clear error rather than attempting to write.

4. **Compress as a safety net**
   - Before upload, downscale the image client-side to max 512×512 JPEG (quality 0.85) using a `<canvas>` helper. Keeps uploads fast and predictable.

## Files to change

- `src/lib/auralink.ts` — try/catch around `write()`; bubble quota errors.
- `src/routes/auralink.create.tsx` — replace `FileReader` data-URL flow with Supabase upload; add upload state; gate Publish on upload completion; show toast on save failure.
- `src/lib/auralinkImages.ts` *(new)* — small helper: `compressImage(file)` + `uploadAuraLinkCover(file, userId)` returning a public URL.
- *(optional)* `supabase/migrations/<timestamp>_auralink_images_bucket.sql` — create `auralink-images` public bucket with owner-write RLS, mirroring the audio bucket pattern. If we reuse `auragram-audio`, no migration needed.

## Acceptance criteria

- Selecting a cover image uploads to Supabase Storage and shows a progress indicator.
- Publish succeeds for users with existing Farm data; the page navigates to `/l/<slug>`.
- No `QuotaExceededError` in console after publishing.
- If localStorage ever fills up for another reason, the user sees a clear toast instead of a silent no-op.
- Existing AuraLinks without a cover image continue to work (fallback to featured Aurascope).

## Decision needed

Reuse `auragram-audio` bucket under an `auralinks/` prefix (no migration), or add a dedicated `auralink-images` bucket (one small migration, cleaner separation)? Default recommendation: **dedicated bucket**.
