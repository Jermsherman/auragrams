# From MVP to Millions: What's Holding Auragram Back

## The honest answer first

The core creation loop works (upload → Aura → AuraLink → share). What's missing is not more polish — it's the **growth and retention machinery** that Linktree and Spotify each have and Auragram doesn't yet. Five gaps, in priority order:

## Gap 1 — No distribution loop (biggest blocker)
Today an AuraLink is a dead end: a fan visits, clicks out to Spotify, and Auragram gains nothing.
- Every public AuraLink and Aura page needs a visible, branded "Create your own Aura" footer CTA (Linktree's entire growth engine).
- Public pages should carry SEO-optimized metadata per artist so "artist name + auragram" ranks.
- Sharing should generate assets that watermark back to Auragram (story cards already exist — extend to every share surface).

## Gap 2 — No reason to come back
A user makes an Aura once and leaves. Retention needs:
- **Analytics for artists**: views, plays, link clicks on their AuraLink (this is the #1 reason creators upgrade on Linktree).
- **Audience capture**: follower/email signup on AuraLink pages so artists own their audience.
- Re-enable flagged features selectively (Influence, Story Export) as retention hooks.

## Gap 3 — No monetization
No payment integration exists. Path: Pro tier (custom themes, analytics, remove branding, more Auras), free tier stays generous. Lovable's built-in Stripe/Paddle handles this.

## Gap 4 — Discoverability is closed
There's no way to find other artists. A lightweight public discovery surface (featured AuraLinks, trending Auras) turns the product from a tool into a network — the actual bridge between Linktree (static links) and Spotify (discovery).

## Gap 5 — Platform trust at scale
Custom domains for AuraLinks, faster public-page loads (SSR/caching), and reliability work that matters once traffic is real.

## Proposed phased roadmap

**Phase A — Growth loop (do first):**
1. "Made with Auragram" viral footer + CTA on all public pages
2. Per-AuraLink SEO/OG metadata polish
3. View/play/click analytics for artists (DB table + dashboard card)

**Phase B — Retention:**
4. Follower/email capture on AuraLink pages
5. Simple audience list in the app

**Phase C — Monetization:**
6. Enable Stripe payments, Pro tier gates (themes, analytics depth, branding removal)

**Phase D — Network:**
7. Public discovery/trending page
8. Custom domains for Pro users

## What I recommend doing now
Phase A only — it's small, high-leverage, and everything later depends on the loop existing. Say the word and I'll detail Phase A into a build plan, or adjust the phasing.

## Technical notes
- Analytics: new `page_events` table (page_id, event_type, timestamp), write on public page view/play/click, aggregate in a dashboard view; RLS owner-read only.
- Viral footer: already have the `Created with Auragram` link in `AuraLinkView.tsx` — upgrade it to a real CTA.
- Payments: Lovable built-in Stripe; Pro flag on profiles table (never client-checked).
