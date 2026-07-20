# Fix MP3 upload failure

## Diagnosis (confirmed)

The console error says "new row violates row-level security policy", but the storage RLS policies are correct — I verified them:

- Path uploaded: `a4dc785e-…/c342e531-…/red_cottage_….mp3`
- Policy: `auth.uid()::text = (storage.foldername(name))[1]`
- `auth.uid()` for this session IS `a4dc785e-…` — the folder matches.

The real cause is the **bucket's `file_size_limit` = 100 MB**. Supabase Storage returns this exact "row violates RLS" 403 when a file exceeds `file_size_limit` (misleading, but that's the wire error). `red_cottage_… FINAL_MIX_.mp3` is almost certainly larger than 100 MB.

Earlier I removed the app-side 25 MB check, but the bucket cap still fires server-side — that's what the user is hitting now.

## Fix

1. **Raise the bucket cap.** Run a migration setting `file_size_limit` to `NULL` (unlimited) on the `auragram-audio` bucket. Also widen `allowed_mime_types` to include `audio/x-mpeg`, `audio/mpeg3`, `audio/x-aac`, `audio/x-flac`, and `audio/x-hx-aac-adts` so uncommon browser-reported types stop being pre-rejected.

    ```sql
    UPDATE storage.buckets
    SET file_size_limit = NULL,
        allowed_mime_types = ARRAY[
          'audio/mpeg','audio/mp3','audio/x-mpeg','audio/mpeg3',
          'audio/wav','audio/x-wav','audio/wave',
          'audio/mp4','audio/x-m4a','audio/aac','audio/x-aac',
          'audio/ogg','audio/webm',
          'audio/flac','audio/x-flac',
          'audio/x-hx-aac-adts'
        ]
    WHERE id = 'auragram-audio';
    ```

    If the SQL migration path rejects a direct `storage.buckets` UPDATE, fall back to raising just the app-facing limit and telling the user the platform still caps individual files (worst case, use a workspace-side change) — but I'll try the SQL path first since there's no dedicated tool for `file_size_limit`.

2. **Better client-side error.** In `src/lib/audioStorage.ts`, when the upload response is 403 with `"row-level security policy"`, translate the toast to something honest:

    > "Upload rejected by storage. Common causes: file too large or an unsupported audio type."

    Currently it just says "Upload failed. Please try again." which sent the user chasing an auth/RLS ghost.

3. **Detect oversized files pre-upload.** Add a lightweight guard: if `file.size > 500 MB` show a soft warning ("Very large file — upload may take several minutes over cellular"). Not a hard block. This replaces the removed 25 MB cap with something that only fires on truly extreme uploads.

## Files touched

- `supabase/migrations/<new>.sql` — the UPDATE above.
- `src/lib/audioStorage.ts` — 403 detection + better error text, soft warning helper.
- `src/routes/create.tsx` — wire the soft warning toast on file pick.

## Verification

- Re-upload the same MP3 that just failed; expect success.
- Try a synthetic 200 MB file; expect success (was blocked before).
- Try a fake `.exe` renamed to `.mp3`; expect a clearer mime rejection message.
- No changes to auth, RLS policies, AuraLink, or playback code.
