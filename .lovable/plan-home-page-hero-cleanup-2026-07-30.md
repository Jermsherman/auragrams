# Home page hero cleanup

Strip the hero back to just the animated Aura orb, headline, and upload action.

## Remove from the hero (`src/routes/index.tsx`)

- The left/right carousel arrow buttons over the orb.
- The "Hear it react" / "Stop the demo" button and the synthesized demo playback wiring it drives.
- The whole block under the orb: "Generated From", track title, Mood / Energy / Key line, the dot indicators, and "Show another".

The orb keeps its slow auto-rotation through the showcase Auras, so the hero still cycles visuals — it just no longer shows any labels or controls.

## Remove at the bottom of the page

- The final section's duplicate heading "Give your music a living identity." The top-of-page H1 stays exactly as it is; the CTA buttons under that heading stay too.

## Technical notes

- Only `src/routes/index.tsx` changes. Removing the demo also drops the `demoTone` import, the analyser/demo refs, and the `isPlaying` / `audioAnalysisData` props on the hero `Aurascope`.
- `src/lib/demoTone.ts` and `src/lib/showcaseAuras.ts` stay in the codebase; showcase data is still used for the rotating orb and the "What is an Aura?" section.
- Unused icon imports (`Play`, `Pause`, `ChevronLeft`, `ChevronRight`, `RefreshCw`) get cleaned up.
