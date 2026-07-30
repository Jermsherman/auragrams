# Three targeted Auragram fixes

## 1. Auto-detect moods after upload

In `src/routes/create.tsx`:

- Extract the current body of `handleDetectMood` into a shared runner so the button and the auto-run share identical logic, error handling, and toasts.
- Add an effect that fires once `audio`, `features`, and `keyDetection` are all available and `moods.length === 0`, running the same detection. A ref guards against re-running for the same file; `runAnalysis` resets that guard when a new file is picked.
- Never overwrite user-selected moods: the auto-run is skipped whenever the mood list is non-empty.
- Keep the existing "Detect Mood" button; pass a label through so it reads "Re-detect" once moods are populated.

In `src/components/MoodPicker.tsx`:

- Accept an optional `detectLabel` prop (default `"Detect Mood"`) and render it in the existing button. No other changes.

## 2. Surface the 72-hour guest expiry

- `src/routes/create.tsx`: under the existing uploader helper text, add a short persistent note for signed-out visitors — "Previews are temporary. Sign up to keep this Aura permanently."
- `src/routes/aura.$id.tsx` (line ~691, the guest save block): replace the soft "Sign up to save it..." line with urgency and the concrete window — "Unsaved Auras are deleted after 72 hours. Save yours now to keep it and build your AuraLink."
- Tone matches existing landing/FAQ copy: short sentences, plain language, no exclamation marks.

## 3. Clarify that "Anonymous" is not privacy

In `src/components/IdentitySelector.tsx`:

- Update the Anonymous option's sub-label to state clearly that it hides the name only: "Hides your name — the Aura page is still publicly viewable by anyone with the link."
- Adjust the existing anonymous clarifier paragraph in `create.tsx` to match, so the two do not contradict each other.

No changes to RLS, the cron job, storage, or the detection engine.

## Technical notes

- All edits are UI/trigger-point only; no new dependencies, no schema or type changes.
- The auto-detect effect depends on `[audio, features, keyDetection]` and bails early when moods exist, so it cannot loop.
