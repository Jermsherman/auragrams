# Auragram Glass v2 — focused visual refinement

## Direction

Use the selected **Atmospheric Glass V2** direction: near-black depth, slow Aura-colored ambient light, restrained translucent surfaces, and precision musical-instrument detailing. Preserve Space Grotesk, Inter, the current brand palette, all routes, data, publishing/privacy behavior, secure playback, and Aura generation.

## Current design audit

- `src/styles.css` already contains the right foundation: Aura color tokens, three partial glass treatments, elevation shadows, grain, shared easing, premium surface effects, and reduced-motion rules. These will be consolidated rather than replaced.
- `src/components/Aurascope.tsx` already has the required enclosure, lens, grid, recessed orb, and large-format instrument label. The refinement will strengthen these existing layers—not turn it into a floating orb.
- `src/components/OrbVisual.tsx` already uses shared frame scheduling, viewport pausing, high/low quality paths, and separate waveform/effect canvases. Audio analysis and band behavior will remain unchanged.
- `src/routes/index.tsx` already has the correct message and section order, but its first viewport and later section spacing can be tighter and more continuous.
- `src/components/Nav.tsx` is desktop/header-oriented. Signed-in mobile navigation is the main missing mobile affordance.
- `src/routes/farm.tsx` already provides the canonical real saved-Aura loading and status data needed for a small signed-in recent shelf without fake records or backend changes.
- Publishing controls already expose Draft, Unlisted, and Public safely; only their visual treatment will change.

## Implementation

### 1. Consolidate the material and atmosphere system

Update `src/styles.css` and `src/components/AuraAtmosphere.tsx`:

- Formalize three reusable levels: **ambient glass**, **structural glass**, and **hero glass**.
- Give each level consistent edge light, opacity, contrast, elevation, blur, and a non-blur fallback.
- Add two or three oversized Aura-colored ambient fields with very slow drift and one dominant light source per screen.
- Keep the existing fine grain, but tune it to remain subtle and inexpensive.
- Add reusable safe-area, mobile-content clearance, press-depth, instrument-rim, and status-treatment utilities.
- Reduce continuous sheen and colorful borders to hero-priority surfaces only.
- Expand reduced-motion and lower-power fallbacks so decorative motion becomes static and heavy blur is reduced.

### 2. Refine the Aurascope as luxury musical hardware

Update `src/components/Aurascope.tsx` and make presentation-only adjustments in `src/components/OrbVisual.tsx`:

- Strengthen the outer chassis with a restrained machined bezel, brighter upper rim, softer lower contact shadow, and Aura-colored light leakage.
- Deepen the glass lens and recessed display so the waveform and living Aura occupy visibly separate planes.
- Refine calibration ticks, spectral grid fading, etched large-format `AURASCOPE` labeling, and controlled waveform glow.
- Improve perceived sharpness through canvas sizing/rendering polish while preserving all existing analysis bands and effect logic.
- Consolidate overlapping idle motion and ensure static/reduced-motion modes are genuinely calm.
- Preserve low-quality card/grid rendering, offscreen pausing, and the shared frame scheduler.

### 3. Tighten the homepage composition

Update `src/routes/index.tsx`:

- Make the enclosed Aurascope the dominant first-viewport object and let its active palette illuminate the nearby background.
- Tighten the visual relationship between Aurascope, headline, supporting copy, and upload action.
- Keep the full gradient only on “A Living Identity.” and the primary action.
- Restyle the upload target as structural glass with clear drag-and-drop and mobile file selection states.
- Keep “Free · No account needed to preview” visible but secondary.
- Reduce excessive vertical spacing across the remaining sections by roughly 15–20% where appropriate and add smoother atmospheric handoffs between sections.
- Preserve all existing page copy, content, SEO metadata, loading states, and upload behavior.

### 4. Add purpose-built signed-in mobile navigation

Create `src/components/MobileBottomNav.tsx` and update `src/routes/__root.tsx` and `src/components/Nav.tsx`:

- Add a persistent signed-in-only glass bar for Discover/Home, Create, My Auras, AuraLink, and Profile.
- Use 44px-or-larger targets, clear active state, restrained emphasis on Create, and bottom safe-area support.
- Add page-bottom clearance so the bar never covers content.
- Hide redundant authenticated header links on small screens while preserving the current public header and desktop navigation.
- Do not render the bar for signed-out visitors, authentication/onboarding screens, or public profile/AuraLink viewing contexts where it would distract from sharing.

### 5. Add a compact real-data Recent Auras shelf

Create `src/components/RecentAurasShelf.tsx` and a small reusable recent-Aura loading hook, then update `src/routes/index.tsx` and `src/routes/farm.tsx` only as needed:

- Show the shelf only to signed-in users on the existing home surface.
- Reuse the same local/cloud merge, hydration, and newest-first ordering already used by My Auras.
- Use horizontal snap scrolling and touch-friendly compact cards with real title, artist, Aurascope, and Draft/Unlisted/Public state.
- Keep only visible cards animated and preserve low-quality rendering for shelf Auras.
- Do not add routes, fake records, tables, migrations, or new backend calls.

### 6. Apply consistent Glass v2 hierarchy to core product surfaces

Visually update the existing surface owners without changing their behavior:

- `src/routes/create.tsx` — structural-glass upload and setup areas, clearer mobile labels and spacing.
- `src/components/AuraFarmCard.tsx` — structural collectible card treatment and quieter action hierarchy.
- `src/components/AuraStatusControl.tsx` — hero glass for the important publishing control; neutral lock, restrained link, and subtle globe treatments.
- Shared dialog/card primitives and their existing consumers — consistent hero/structural material, readable contrast, and restrained highlights.

No functional content will be removed, and no backend, auth, storage, RLS, server-function, publishing, or secure-playback code will change.

## Verification

- Run the project type-check and production build; fix only issues caused by this pass.
- Verify the homepage, Create, My Auras, Aura detail/publishing, AuraLink, Discover, dialogs, and signed-in navigation in the live preview.
- Test desktop plus modern iPhone and compact mobile viewports, including safe areas, touch targets, text fit, bottom-bar clearance, and horizontal scrolling.
- Check the Aurascope while idle and playing, with reduced motion enabled, and with multiple offscreen/onscreen Auras.
- Confirm keyboard focus, labels, loading/error/private states, and backdrop-filter fallbacks remain usable.
- Confirm there are no migrations, data changes, route changes, or publishing/privacy regressions.
