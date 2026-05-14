# Improve "try before signup" onboarding

Most of the guest flow already works (guests can create one Aura, it's stashed via `pendingAura` + IndexedDB, and a claim effect saves it to cloud after sign-up). This plan tightens the messaging, CTAs, and redirect target so the flow matches the brief end-to-end.

## Changes

### 1. Landing page (`src/routes/index.tsx`)
- Hero subheadline → `"Create your first Aura for free. Sign up to save it and build your music-first AuraLink."`
- Primary CTA label: `Create Aura` → `Create Your First Aura`
- Hide the secondary `Build AuraLink` CTA in the hero for unauthenticated visitors (use `useAuth`); keep it for signed-in users. Same treatment in the final CTA section.
- Tweak step 02 description to: `"Sign up to save your Aura, then build your AuraLink."`

### 2. Aura preview page (`src/routes/aura.$id.tsx`)
- For guests viewing their pending Aura, change the primary CTA label `Save this Aura` → `Save Aura & Build AuraLink`. Keep the existing `to="/auth"` link with `redirect: /aura/$id?claim=1`.
- Below the primary CTA (guest-only), add the one-line tagline: `"Sign up to save it and build your music-first AuraLink."`
- Hide the secondary `Share AuraLink` and `Story` buttons for guests (these belong to logged-in capabilities per the brief). Keep them for owners.

### 3. Claim flow redirect (`src/routes/aura.$id.tsx`, claim effect ~line 234)
After a successful `saveAuraToCloud` for the just-claimed Aura, replace:
```
nav({ to: "/aura/$id", params: { id }, search: {}, replace: true });
```
with:
```
nav({ to: "/auralink/create", replace: true });
```
This sends the freshly signed-up user straight into AuraLink setup, as required by step 6 of the brief. The Aura is already saved to My Auras, so the AuraLink builder will see it.

### 4. Create page guest banner (`src/routes/create.tsx`, ~line 470)
Update the guest banner copy to match the brief:
- `"Try one Aura free. Sign up to save it and build your music-first AuraLink."`

### 5. Nav (`src/components/Nav.tsx`)
Already correct: `My Auras` / `My AuraLink` only render for signed-in users; guests just see Create + FAQ. No change needed.

## Out of scope
- No schema changes.
- No changes to the one-pending-aura limit (already enforced via `pendingAura.ts` + the "Replace it?" confirm in `create.tsx`).
- No redesign of `AuraLinkBuilder`; it already gates on `RequireAuth`.
- Auracle multi-track mode stays hidden from guests (already enforced).

## Acceptance
1. Visitor on `/` sees `Create Your First Aura` and the new tagline; no `Build AuraLink` CTA.
2. Visitor uploads a song on `/create` → lands on `/aura/$id` with a working preview.
3. Guest CTA reads `Save Aura & Build AuraLink`; clicking goes to `/auth?mode=signup&redirect=/aura/$id?claim=1`.
4. After sign-up, the claim effect saves the Aura to cloud, clears the pending guest data, then redirects to `/auralink/create` (the AuraLink builder).
5. Trying to create a second guest Aura prompts "Replace it?" (already in place).
