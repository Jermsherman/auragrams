# Must-Fix-Before-Launch Plan

Ten focused fixes, grouped by risk so I can batch the safe deletions first and the higher-risk refactors last. No new features. No database schema changes except a reserved-slug guard.

---

## Group A — Dead code removal (zero risk)

**1. Delete orphaned files and imports**
- Delete `src/lib/musicLinks.ts` (never imported anywhere).
- Delete `src/routes/aura.$id.influence.tsx` (only a redirect).
- Remove `InfluenceAuraDialog` import + usage from `src/routes/aura.$id.tsx:27` (the influence button + modal).
- Remove the dead `sourceType === "platform_link"` filter from `src/routes/farm.tsx:72` (uploads-only model means it's always empty).
- Remove the non-functional "Remember me" checkbox from `src/routes/auth.tsx:63-64`.
- Convert `src/routes/auralink.create.tsx` into a one-line redirect to `/auralink` (kept for back-compat with any shared URLs).
- Regenerate `routeTree.gen.ts` is automatic via the Vite plugin.

---

## Group B — `/artist/$handle` decision

**2. Remove `/artist/$handle` for launch**
The current implementation reads `localStorage` only (`src/routes/artist.$handle.tsx:53`), so every shared link 404s for visitors. Rebuilding it against the cloud is post-launch work.

- Delete `src/routes/artist.$handle.tsx`.
- Search for any `<Link to="/artist/...">` references and remove or replace with the AuraLink page (which is now the canonical public artist surface).

---

## Group C — Create-flow simplification

**3. Hide non-MVP create modes behind a feature flag**
Keep the code (so we can re-enable post-launch) but remove from the UI.

- Add `src/lib/featureFlags.ts` with `MVP_LAUNCH = true` and named flags: `enableRawRecording`, `enableAuracle`, `enableStoryExport`, `enableInfluence`, `enableEditPalette`, `enableColorInfluence`.
- In `src/routes/create.tsx`: gate the Raw and Auracle mode tabs behind their flags. With MVP_LAUNCH=true, the mode selector renders nothing — upload is the only path. Tighten `Mode` to `"file"` when flags are off.
- In `src/routes/aura.$id.tsx`: gate the Story, Edit Palette, Add-to-Auracle buttons behind their flags.
- In `src/routes/__root.tsx` / `Nav.tsx`: hide any Auracle nav links.
- Hide the Auracle routes by returning `notFound()` from `/auracle/create` and `/auracle/$id` loaders when `enableAuracle` is false (file stays, route is dead at runtime).

This is reversible by flipping flags — no code is actually deleted.

---

## Group D — Upload + analysis UX

**4. Real upload progress indicator on `/create`**
- `src/lib/audioStorage.ts::uploadAuraAudio`: Supabase JS `.upload()` doesn't expose progress directly, so wrap it with a manual XHR fallback using `supabase.storage.from(bucket).uploadToSignedUrl` after creating a signed upload URL (`createSignedUploadUrl`) — XHR's `upload.onprogress` gives real bytes-sent.
- Surface progress as `0–100` via a callback param.
- `src/routes/create.tsx::submit`: show a thin progress bar under the CTA while `busy === "upload"`. Reuse `<Progress />` from shadcn.
- Add an "Analyzing audio…" indicator next to the file name while `runAnalysis` promises are pending (track all three with `Promise.allSettled`).

**5. Reduce decode passes from 3 → 1**
- Add `src/lib/audioDecode.ts` with `decodeOnce(file): Promise<AudioBuffer>` using a single shared `AudioContext`.
- Refactor `detectKey`, `analyzeFile`, `detectPitchCenter` to accept an optional pre-decoded `AudioBuffer` (existing File-based signature kept for back-compat).
- In `src/routes/create.tsx::runAnalysis`: decode once, then pass the buffer into all three detectors via `Promise.all`. ~3× RAM saved on a 50 MB file.

**6. Real generating screen**
- `src/routes/generating.tsx`: replace the hardcoded 4200 ms with a minimum-1500 ms theatrical floor that resolves the instant the aura is ready. Use `Promise.all([generationPromise, sleep(1500)])`. Generation already finishes before navigation, so this becomes just the 1.5 s reveal animation.

---

## Group E — Cover image fix

**7. Stop storing base64 cover images in `auras.extra`**
- `src/lib/cloudAura.ts::saveAuraToCloud` currently writes `coverDataUrl` straight into the `extra` JSON column. For any non-trivial cover this bloats every row.
- Add `src/lib/auraImages.ts::uploadAuraCover(authUserId, auraId, dataUrl)` that:
  - Decodes the data URL.
  - If size > 50 KB or it's a data URL at all, uploads to the existing `auralink-images` bucket under `covers/{authUserId}/{auraId}.jpg` (compressed via the existing helper).
  - Returns the public URL.
- In `saveAuraToCloud`: before writing `extra`, if `coverDataUrl` is a data URL, upload it and store the URL instead. Strip raw data URLs from `extra`.
- Backfill is not needed — old rows remain valid; new writes are clean.

---

## Group F — Security tightening

**8. Owner-gate destructive ops + slug blocklist**
- `src/lib/cloudAura.ts::deleteAura`: add `.eq("user_id", profileId)` so the client query matches the pattern in `deleteAuraLink`. RLS stays as the backstop; this gives defense-in-depth.
- `src/lib/auralinkService.ts`: add a reserved-slug constant `RESERVED_SLUGS = new Set(["admin","api","auth","login","app","www","root","help","about","faq","create","auralink","auracle","aura","farm","artist","l","settings","onboarding","public"])`. In the slug-generation loop, if `slug` is in the set, append `-1` and continue. Apply to both create and rename paths.

---

## Group G — Visibility model honesty

**9. Honest copy for the visibility selector**
Real private/unlisted requires RLS changes — that's post-launch. For now, fix the lie:
- In `src/components/IdentitySelector.tsx`: add a small helper line under the selector — *"All Auras are public and shareable by link. This controls how your name appears on the AuraLink."*
- In `src/routes/onboarding.tsx` step 3: same clarifying copy.
- Remove "private/unlisted" implications from any landing copy if present.

No code path for actual privacy is added — just truthful labeling.

---

## Group H — Generating screen + onboarding (already addressed in F)

Item 8 from the original list (replace 4.2s fake wait) is handled in **#6** above.

Item 9 (Auracle removal) is handled in **#3** via flag.

Item 10 (visibility model decision) is handled in **#9**.

---

## Technical Details (for engineering review)

**Feature flag shape:**
```ts
// src/lib/featureFlags.ts
export const flags = {
  enableRawRecording: false,
  enableAuracle: false,
  enableStoryExport: false,
  enableInfluence: false,
  enableEditPalette: false,
  enableColorInfluence: false,
} as const;
```
Static booleans — bundler tree-shakes the disabled branches in production builds. No env var needed for MVP launch.

**Upload progress signature:**
```ts
uploadAuraAudio(opts: {
  file: File;
  authUserId: string;
  auraId: string;
  onProgress?: (pct: number) => void;
}): Promise<UploadResult>
```
Uses `createSignedUploadUrl` + XHR PUT to get progress events. Falls back to the existing `.upload()` if signed-url creation fails.

**Shared decode:**
```ts
// src/lib/audioDecode.ts
let _ctx: AudioContext | null = null;
export async function decodeOnce(file: File): Promise<AudioBuffer> {
  _ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
  return _ctx.decodeAudioData(await file.arrayBuffer());
}
```
Each detector gets an optional `buffer?: AudioBuffer` param; if provided, skip its own decode.

**Cover image upload:**
Reuses the existing `auralink-images` bucket and image compression helper (`auralinkImages.ts:21-35`) — no new bucket, no migration.

**Slug blocklist:**
Pure client-side guard at write time. RLS-level enforcement (a CHECK constraint or trigger) is post-launch hardening.

---

## Out of scope (deferred to post-launch list)

- Consolidating the dual localStorage + cloud storage model.
- Lazy-loading `AuraLinkBuilder` (1631 lines).
- `ArtistProfile` type unification.
- Moving onboarding after the wow moment (requires deeper claim-flow rework).
- Replacing `as never` casts.
- Re-enabling Google OAuth.
- Dropping the `is_anonymous` DB column.
- Rebuilding `/artist/$handle` against the cloud.

---

## Order of execution

1. Group A (deletes) — fastest, lowest risk.
2. Group B (artist route) — single file delete.
3. Group F (security) — small, surgical.
4. Group G (copy fix).
5. Group C (feature flags + UI gating).
6. Group E (cover upload).
7. Group D (decode-once + progress + generating screen) — biggest change, saved for last so I can verify the pipeline still produces an Aura end-to-end after the refactor.

I will verify after each group that `/create` still produces an Aura, the orb renders on `/aura/$id`, and `/l/$slug` still loads.
