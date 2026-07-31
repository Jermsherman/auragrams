# FAQ Expansion — Full Auragram Guide

Rewrite the FAQ into a complete, honest overview of what Auragram is, what it gives artists, how customization works, and where the current limits are. All content lives in `src/lib/faq.ts`; the `/faq` page and homepage preview already render whatever sections exist there, so the page structure only needs a small addition for the mission statement.

## New FAQ structure

1. **Mission & What Auragram Is** — mission statement, the "music-first link page" framing, who it's for, how it differs from a generic link-in-bio.
2. **The Non-Static Music Link** — what makes an AuraLink alive: playable Auras, reactive visuals, per-song identity, themes, streaming buttons; why a static link page loses attention.
3. **Your Toolkit** — Create Aura, My Auras, AuraLink builder, public preview, share cards / story exports, traits & song personality profile, Auracles (where enabled).
4. **How It Works (Audio → Aura)** — upload, compression, analysis (key, energy, mood, vocals), palette generation, trait derivation, the story you write yourself.
5. **Customization** — palette and color influence, mood selection (up to 4), vibe note, band system (waveform, bass halo, radar pings, vocal core vs equator streak), per-band color/intensity/visibility, atmosphere effects, AuraLink theme (fonts, backgrounds, decorations, match-Aura-palette).
6. **Bands & What Drives Them** — plain-language mapping of each band to its audio source and frequency range.
7. **AuraLinks** — building, adding Auras and streaming links, slugs, public preview, editing later.
8. **Uploads & Music Links** — supported formats, why uploads react but Spotify/SoundCloud embeds don't, adding streaming links as buttons.
9. **Accounts, Privacy & Sharing** — guest creation of one Aura, sign-in to save, what "Anonymous" does and does not hide, AuraLinks are public by design.
10. **Limitations (be specific)** — Auras are generated from uploads only, not from links; guest previews and their audio expire after 72 hours if not saved; streaming embeds cannot drive audio-reactive motion; analysis is heuristic, not stem separation (no true vocal isolation); vocals are a manual toggle; mood detection is a suggestion; visuals are deterministic per track so re-uploading the same file yields the same Aura; performance is reduced on low-power devices and off-screen orbs pause; beta — features may change.
11. **Troubleshooting** — keep and extend the existing items.

## Page changes

- `src/lib/faq.ts`: replace `FAQ` with the sections above; keep the `FaqItem` / `FaqSection` types and `getHomepageFaqs()` (update its picked keys to questions that still exist).
- `src/routes/faq.tsx`: add a short mission statement block under the hero intro; update the meta title/description to reflect the fuller guide. Existing section nav, accordions, and FAQPage JSON-LD keep working unchanged and will pick up the new questions automatically.
- `public/llms.txt`: refresh the FAQ line to describe the expanded guide.

No database, auth, or component logic changes.
