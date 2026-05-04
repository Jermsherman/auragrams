# Add FAQ / How It Works help system

## New files

- **`src/lib/faq.ts`** — Source of truth for FAQ content. Exports `FAQ` (7 sections × items per spec) and a `getHomepageFaqs()` helper that returns the 4 preview questions.
- **`src/routes/faq.tsx`** — `/faq` route. Premium dark layout matching the rest of Auragram (Nav + Footer, `mx-auto max-w-3xl`, gradient title, glass cards). Renders each section with the shadcn `Accordion` component (`type="multiple"`, collapsible). Section headings use the existing `font-display` + `text-aura-gradient` style. Includes head() metadata: title "How to Use Auragram — Auragram", matching og:title/og:description.
- **`src/components/FaqPreview.tsx`** — Small component used on the homepage. Renders heading "Questions before you create?", an Accordion with the 4 preview FAQs from `getHomepageFaqs()`, and a "View Full FAQ" link (`<Link to="/faq">`).
- **`src/components/HelpLink.tsx`** — Tiny inline `<Link to="/faq" hash="...">` styled as muted "Need help? Read the FAQ" pill, reused on Create / AuraLink / Farm pages.

## Edits

- **`src/components/Nav.tsx`** — Add a `FAQ` link between AuraLink and Farm (visible on sm+, hidden on xs to avoid mobile crowding — mobile users get it via the footer). Always visible (not gated on auth).
- **`src/components/Footer.tsx`** — Replace the current single-line footer with a small grid: Logo + tagline on the left, a "Help" column with links to FAQ, Create Aura, Build AuraLink, Farm on the right. Keep the dark/glassy aesthetic.
- **`src/routes/index.tsx`** — Insert `<FaqPreview />` between the "Aura Farm / AuraLinks" highlight grid section and the "FINAL CTA" section.
- **`src/routes/create.tsx`** — Add a small "Need help? Read the FAQ" `HelpLink` near the page intro/header (links to `/faq#creating-auras`).
- **`src/routes/auralink.create.tsx`** — Add "What is an AuraLink?" `HelpLink` under the page subtitle (links to `/faq#auralinks`).
- **`src/routes/farm.tsx`** — Add "What is the Farm?" `HelpLink` near the page header (links to `/faq#farm`).

No new routes besides `/faq`. Hash anchors here are appropriate (in-page TOC of a single help page), per the route-architecture rules.

## Styling notes

- Reuse `glass`, `glass-strong`, `text-aura-gradient`, `font-display` utility classes already in `src/styles.css`.
- Accordion items: dark glass card per section, no heavy borders, generous spacing, short answers — keep it scannable.
- Mobile-first: `max-w-3xl`, `px-5 sm:px-8`, comfortable line-height; section anchors via `id={section.id}` so `/faq#auralinks` jumps correctly.

## Acceptance criteria mapping

1. `/faq` exists — new route file.
2. Accordion sections — shadcn Accordion, one per section in `FAQ`.
3. Homepage FAQ preview — `FaqPreview` injected into `index.tsx`.
4. Covers Aura, Aurascope, Farm, AuraLink, Auracle, uploads, platform links, anonymous posting, troubleshooting — all included in `src/lib/faq.ts`.
5. Artist-friendly tone — content uses the exact copy from the spec.
6. Discoverability — Nav link, Footer links, contextual HelpLinks on Create / AuraLink / Farm.
