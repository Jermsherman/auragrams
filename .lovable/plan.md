## Goal

Reframe Auragram as: **"A music-first link page for artists where each song can become a playable visual aura."** Simplify navigation to four areas, allow guests to try Aura creation once before sign-up, and de-emphasize advanced concepts in the UI without removing them from code.

## Scope (UI + light flow changes only)

Core engine, data model, Supabase schema, Auracle/Aurascope/influence/lore code stay intact. Changes are routing, navigation labels, copy, gating, and one new "guest preview" handoff.

## 1. Navigation simplification (`src/components/Nav.tsx`)

Reduce nav to four primary destinations + auth:

1. **Create Aura** → `/create` (CTA button, visible to everyone)
2. **My Auras** → `/farm` (label changed from "Farm"; only when signed in)
3. **My AuraLink** → `/auralink` (label changed from "AuraLink"; only when signed in)
4. **Public Preview** → opens the user's own AuraLink slug in a new tab when one exists; otherwise links to `/auralink` builder. Hidden when signed out.

Keep FAQ link as secondary. Remove no other items. Internal route name `/farm` stays.

## 2. Guest Aura creation (one Aura before sign-up)

Today `/create` is wrapped in `<RequireAuth>`. Change so guests can use it once.

**`src/routes/create.tsx`**
- Remove the `RequireAuth` wrapper from the route component.
- Inside `CreatePage`, when `!user`:
  - Hide `IdentitySelector` (default identity to "anonymous" internally for preview).
  - Skip cloud upload + `saveAuraToCloud` in `submit()`.
  - Persist the in-progress Aura to a new `pendingAura` slot in `localStorage` (id, generated aura fields, audio as object URL + the `File` kept in `setSessionAudio`, moods, color influence, title).
  - Disable the "Auracle" mode tab for guests (Auracle stays in code, hidden from MVP UI).
  - After generation, navigate to `/generating?id=…` then `/aura/$id` as today — the aura renders from localStorage/session like a normal aura.
- Add a soft banner above the form for guests: *"Try one Aura free. Sign up to save it to My Auras and add it to your AuraLink."*

**`src/routes/aura.$id.tsx`**
- When the viewer is unauthenticated AND this aura matches the `pendingAura` in localStorage, show a prominent "Save this Aura" CTA that routes to `/auth?mode=signup&redirect=/aura/<id>?claim=1`.
- After successful auth + redirect back with `?claim=1`, run a one-shot effect: upload audio (if a File is still in session), `saveAuraToCloud` with the user's profile, clear `pendingAura`, toast "Saved to My Auras."
- If the session File is gone (page reload lost it), fall back to saving metadata only and toast that they may need to re-upload audio.

**Guest limit**: only one `pendingAura` may exist at a time. A second guest creation overwrites the first with a confirm dialog ("Replace your unsaved Aura?").

## 3. Rename "Farm" → "My Auras" in user-facing copy

Code identifiers stay (`farm.ts`, `/farm`, `getSavedAuras`, `AuraFarmCard`, etc.).

Update visible strings in:
- `src/components/Nav.tsx` (already covered above)
- `src/routes/farm.tsx`: page `<title>`, head meta, H1 ("My Auras"), description copy, empty state.
- `src/routes/index.tsx`: replace "Farm" mentions in hero copy, "How it works" step 02, the "Aura Farm" feature card, and the workflow caption ("Create Aura → Save to My Auras → Build AuraLink → Share").
- `src/components/AddToAuraLinkDialog.tsx` and any toast/empty-state strings that say "Farm" — swap to "My Auras".
- `src/routes/auralink.tsx` head meta if it references Farm.

Keep route path `/farm` (no redirect needed) so existing links work.

## 4. Reframe homepage (`src/routes/index.tsx`)

- Headline stays visually similar; subheadline becomes: *"A music-first link page for artists. Each song becomes a playable visual Aura you can share anywhere."*
- Primary CTA: **Create Aura** (guests welcome) → `/create`. Secondary CTA: **Build AuraLink** → `/auralink` (gated as today).
- "How it works" reduced to 4 steps reflecting the canonical flow:
  1. Create profile (sign up)
  2. Add a song
  3. Generate its Aura
  4. Add to AuraLink & share
- Remove "Build Auracles" step from the public homepage. AuraLink Spotlight section stays.
- Drop the "Auracle" mention from the feature trio; replace with a "My Auras" card.

## 5. De-emphasize advanced concepts in MVP UI

No file deletions. Hide entry points only.

- **Auracle**: hide the Auracle tab in `/create` mode switcher (keep behind a feature flag constant `MVP_HIDE_AURACLE = true` at top of `create.tsx`). Hide Auracles tab on `/farm` page (Tabs collapsed to single "Auras" view) when flag on. `AuracleCard`, `auracle.$id`, `auracle.create` routes still exist and remain reachable by direct URL.
- **Aurascope / aura lore / influence**: keep `/aura/$id` clean — primary actions are Play, Add to AuraLink, Share. Keep "Influence" as a smaller secondary link rather than a prominent button. No code removal.
- **Public artist feed / fan / collecting / comments**: confirm none of these are surfaced in primary nav; nothing to change in this pass beyond the nav cleanup.

## 6. Aura page CTA tweak

`src/routes/aura.$id.tsx`: when owner, ensure the **Add to AuraLink** button is the primary CTA (already exists). When viewer is the guest creator (pre-auth), the primary CTA becomes **Save to My Auras** (sign-up flow from §2).

## 7. Out of scope

- No schema changes.
- No removal of Auracle/Aurascope code.
- No visual redesign — colors, fonts, components unchanged.
- No changes to `/l/$slug` public renderer.
- No migration of existing localStorage data.

## Acceptance criteria

- Nav shows Create Aura, My Auras, My AuraLink, Public Preview, FAQ.
- A signed-out visitor can create one Aura end-to-end and see its `/aura/$id` page.
- That guest sees a "Save this Aura" CTA → sign up → returns to the same Aura, which is now saved to their cloud My Auras.
- "Farm" no longer appears in user-visible copy; route `/farm` still works.
- Auracle tab is hidden in `/create` and `/farm`; direct URLs still resolve.
- Homepage messaging matches the new product framing.
- Existing signed-in flows (create, save, build AuraLink, publish, share) continue to work.
