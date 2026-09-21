# Create flow stabilization and UX refinement

## Goal

Make `/create` feel like one clear, premium upload-to-generation journey, with a Generate action that remains reachable and never conflicts with signed-in mobile navigation. Preserve Aura generation, identity, storage, publishing defaults, guest limits, routes, and the existing Glass v2 visual direction.

## Confirmed audit findings

- The page currently renders its own fixed mobile Generate bar at the bottom while signed-in users also receive the fixed mobile navigation there. The navigation has the higher stacking level, so it can cover the Generate action.
- The fixed Generate bar also obscures footer content for signed-out visitors and consumes substantial space when its disabled-state helper appears.
- The form is one long undifferentiated column. The full mood list is always expanded, while more specialized controls appear at the same visual priority as required track details.
- The page computes a live Aura preview, but the visible “Your Aura” summary is only a generic gradient dot and does not communicate how current choices affect the result.
- Generate can become available while audio analysis is still running, allowing a result before key, energy, and automatic mood analysis finish.
- Removing or replacing a selected file does not consistently clear prior moods and analysis results, so a second track can inherit stale choices from the first.
- The upload progress rail mixes pre-generation analysis with upload stages that only begin after Generate is pressed, making the current state harder to understand.
- Mobile and desktop screenshots show excessive vertical scanning, small secondary labels, and weak distinction between required steps and optional customization.

## Implementation

### 1. Give Generate a collision-free mobile action dock

Update `src/routes/create.tsx`, `src/components/MobileBottomNav.tsx`, and the shared mobile-clearance utilities in `src/styles.css`:

- Keep the signed-in bottom navigation visible on `/create`.
- Position the Create action dock above the navigation for signed-in mobile users, using one shared measured clearance rather than competing `bottom: 0` bars.
- Position the dock above the device safe area for guests, where no signed-in navigation exists.
- Add matching page-bottom clearance in both states so the dock never covers fields, footer links, or validation messages.
- Keep the normal in-flow Generate button on desktop.
- Reduce the mobile dock to one stable-height action row. Move missing-requirement guidance into the form instead of changing dock height.
- Use a clear busy state and prevent duplicate submissions.

### 2. Turn the page into a clear three-part journey

Refine the existing content in `src/routes/create.tsx` without adding routes or changing saved data:

1. **Add your track** — upload/record selection, selected-file state, analysis status, and guest-expiry note.
2. **Song details** — title, artist/identity, and concise inline completion feedback.
3. **Shape the Aura** — detected moods, vocals, colors, bands, cover, and live preview.

Use section labels, compact progress cues, and consistent structural-glass grouping. Keep required controls immediately visible; keep advanced visual controls available but collapsed by default.

### 3. Make analysis trustworthy and file changes safe

In `src/routes/create.tsx`:

- Reset key, pitch, energy/features, moods, and one-shot detection state whenever a file is removed or replaced.
- Ignore late analysis results from an older file after the user selects a new one.
- Keep Generate unavailable until the current track’s analysis settles, with a direct “Analyzing track…” action label rather than a generic disabled button.
- Preserve manual mood choices for the current file, while ensuring a new file receives fresh automatic suggestions.
- Separate the pre-generation analysis indicator from post-click compression/upload progress so each stage describes only work actually happening.
- Surface actionable inline errors near the relevant step while retaining existing toast feedback for unexpected failures.

### 4. Reduce choice overload while preserving customization

Update `src/components/MoodPicker.tsx`, `src/components/BandCustomizer.tsx`, and `src/components/ColorInfluence.tsx` with Create-specific compact presentation options where needed:

- Show detected/selected moods first and place the complete mood library behind an explicit “Adjust moods” disclosure on Create.
- Keep automatic detection and the four-mood limit intact.
- Group the vocals question with band behavior so users understand why it affects the visual.
- Present color influence and detailed band controls as optional refinements, collapsed by default with useful summaries of the current setting.
- Maintain 44px mobile targets, readable labels, keyboard access, focus states, and reduced-motion behavior.
- Avoid changing these components’ current appearance in other dialogs unless the shared change is an accessibility fix.

### 5. Make the preview and final review meaningful

In `src/routes/create.tsx`:

- Replace the generic unrevealed dot with a compact, low-cost Aurascope/Aura preview driven by the already-computed palette and current band choices.
- Show a concise review summary beside it: track, artist/identity, selected moods, detected key/energy when available, and optional-customization status.
- Keep the Aura name unrevealed until generation; do not expose or change generation output early.
- Make cover art clearly optional and visually subordinate to the track and Aura settings.
- Keep the default result as a draft and do not add publishing behavior to this page.

### 6. Polish copy, spacing, and state handling

- Tighten the top introduction on mobile so the upload action appears sooner.
- Increase readability of instructional text and replace decorative all-caps copy where it is too small.
- Make empty, analyzing, ready, uploading, compression, failure, and guest-replacement states visually distinct.
- Keep guest messaging concise: one preview Aura, temporary for 72 hours, then sign up to save and build AuraLink.
- Preserve Raw Aura and Auracle feature-flag behavior, but apply the same action positioning and state clarity when those modes are enabled.

## Files

Primary updates:

- `src/routes/create.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/styles.css`

Focused supporting updates only if required by the compact Create presentation:

- `src/components/MoodPicker.tsx`
- `src/components/BandCustomizer.tsx`
- `src/components/ColorInfluence.tsx`

No database migrations, storage changes, publishing-policy changes, authentication changes, or new product routes.

## Verification

- Verify signed-in `/create` on a modern iPhone viewport: Generate remains fully visible above the navigation, all final fields can scroll clear of both bars, and safe-area spacing is correct.
- Verify signed-out mobile: no empty navigation gap, no covered footer/content, and the guest CTA/expiry message remains correct.
- Verify compact and tall mobile, tablet, and desktop layouts for text fit, focus order, touch targets, and no horizontal overflow.
- Exercise upload, remove, replace, automatic mood detection, manual mood adjustment, vocals/bands, color influence, cover selection, and Generate.
- Confirm replacing a file cannot reuse the old track’s analysis or moods, and Generate waits for current analysis.
- Verify upload/compression failure, busy state, duplicate-click prevention, and guest Aura replacement confirmation.
- Verify generated Aura data and navigation to `/generating` and the Aura detail page remain unchanged.
- Run the TypeScript check, focused tests where available, production build, and review current preview diagnostics.
