# Auragram MVP Launch

Build Phase 1 of a web app called **Auragram**.

## Product summary

Auragram is a visual music-sharing platform for artists.

The core idea is simple:

- An artist uploads a song

- The app generates a unique animated “aura” / orb for that track

- The artist gets a clean shareable page where people can play the song and vibe with the visual

This should feel like:

**Linktree for artists x cinematic music visualizer**

NOT a DAW, NOT a music production tool, and NOT a complex dashboard.

The experience should be:

**minimal, premium, emotional, dark, cinematic, easy, and social-first.**

---

## Phase 1 goal

Create a clean MVP with these core features only:

1. Landing page

2. Upload flow

3. Aura generation/loading experience

4. Single track experience page

5. Share link action

6. Mobile-friendly responsive design

Do NOT overbuild.

Keep it simple, polished, and believable.

---

## Brand / visual direction

Use a premium dark UI with:

- black / near-black background

- subtle deep purple tones

- gradient accents: purple, pink, orange, blue

- soft glow effects

- lots of breathing room

- clean modern sans-serif typography

- minimal UI

- subtle glassmorphism only where needed

The product should feel:

- premium

- artistic

- slightly mysterious

- smooth

- modern

- not like generic AI slop

- not like a corporate dashboard

Important brand message:

**“Your song deserves more than a link.”**

Other supporting messaging:

- “Give your music a living identity.”

- “Upload → Generate → Share”

- “See your sound.”

---

## App structure

### 1. Landing page

Create a strong single-page landing section at `/`

Include:

- top nav with Auragram logo text on left

- CTA button on right: “Create Your Auragram”

- hero section with headline:

  **Your song deserves more than a link.**

- subheadline:

  **Auragram turns every track into a living visual aura you can share instantly.**

- small text below CTA:

  **Upload → Generate → Share**

- a large glowing orb visual on the hero section

- a short “How it works” 3-step section:

  1. Upload your track

  2. Generate the aura

  3. Share anywhere

- a small section below that with 3 feature cards:

  - Living Visuals

  - Instant Sharing

  - Story-Ready Direction (can say “coming soon”)

- final CTA section

The landing page should feel elegant and not too long.

Keep it visually strong.

---

### 2. Upload page

Create a page at `/create`

This should be a very simple upload experience.

Include:

- heading: **Offer your sound**

- subtext: **Upload your track and begin the transformation.**

- drag-and-drop upload area

- support for audio files like .mp3 and .wav

- once a file is selected, show file name and a continue button

- style the upload area beautifully with glow and subtle visual energy

Do not ask the user for a lot of info.

Only ask for:

- track title

- artist name

- audio file upload

Optional:

- cover image upload can be present as “optional”

Primary CTA:

**Generate Aura**

---

### 3. Aura generation state

After clicking Generate Aura, show a transition/loading screen.

This screen should feel ceremonial and premium.

Include:

- a dark background

- a faint forming orb in the center

- subtle pulsing / particle animation

- loading copy that rotates through messages like:

  - “Analyzing your sound…”

  - “Mapping motion, color, and energy…”

  - “Creating your aura…”

- this does not need real AI generation yet

- simulate generation for 2–4 seconds, then route to the final experience page

---

### 4. Track experience page

Create a page at something like `/aura/:id`

This is the most important screen.

Layout should be minimal and centered.

Include:

- small Auragram logo top left

- share button top right

- large animated orb centered on the page

- track title below the orb

- artist name below title

- audio player controls:

  - play / pause

  - progress bar

- the orb should react subtly when the song plays

Interaction goals:

- when music is paused, the orb slowly “breathes”

- when music plays, the orb reacts with subtle movement

- use a simple audio reactive visualization if possible using the Web Audio API or a believable simulated pulsing response tied to playback

- the orb should feel alive, not chaotic

Important:

This page should feel like a beautiful music presentation page, not a dashboard.

No unnecessary stats in Phase 1.

Optional microcopy:

- “Give your music a living identity.”

- “Made to be shared.”

---

### 5. Share behavior

For Phase 1, create a simple share action.

When user clicks Share:

- open a modal or dropdown

- include:

  - Copy link

  - Native share if supported

- show a success state like:

  **Link copied**

The shareable page should be the same track experience page.

---

## Functional requirements

### Audio

- Use a standard HTML audio player under the hood

- Provide custom styled UI controls

- Support uploaded audio playback in the experience page

### Orb visualization

Build a central orb that feels premium and organic.

The orb should:

- be circular / spherical

- use animated gradients or energy lines

- gently pulse while idle

- react more when song is playing

- feel like a “living aura”

A simple implementation is okay for Phase 1:

- CSS animation

- canvas

- SVG

- lightweight JS animation

- or Web Audio API driven motion if easy

No need for perfect audio analysis yet.

It just needs to feel compelling and believable.

### Data persistence

For Phase 1, local state or mock persistence is fine.

If easy, use browser local storage so uploaded track info persists during testing.

---

## Pages / routes

Please create these routes:

- `/` → landing page

- `/create` → upload flow

- `/aura/:id` → single track aura experience page

---

## UI component guidance

### Buttons

- rounded

- premium gradient for primary CTA

- subtle glow on hover

### Cards / containers

- dark glassy panels

- soft borders

- subtle blur if useful

### Typography

- bold, modern hero typography

- clean body text

- no dense paragraphs

### Spacing

- generous whitespace

- clean visual hierarchy

---

## Mobile responsiveness

This app must look good on mobile first.

Especially for the track page:

- orb should be large and centered

- controls should be thumb-friendly

- header should stay clean

- spacing should remain premium

The mobile version is very important because artists will share this in social and many users will open it on their phone.

---

## Non-goals for Phase 1

Do NOT add:

- artist dashboards

- analytics

- profile pages with many tracks

- NFTs / crypto language

- complicated editing controls

- detailed sound metrics

- over-complicated customization

- social feed features

Stay focused on:

**upload → generate → play → share**

---

## Build quality

Make the app feel like a real startup product MVP.

It should be polished enough to demo.

Prioritize:

1. visual quality

2. simplicity

3. responsive experience

4. believable aura experience

---

## Suggested tech approach

Use a modern frontend stack that Lovable prefers.

Use clean component structure.

Use Tailwind or a similar utility-first system for styling if appropriate.

---

## Final deliverable

Return a working prototype for Phase 1 with:

- landing page

- upload page

- generation flow

- single aura page

- responsive UI

- attractive animated orb

- audio playback

- share/copy link behavior

The final feel should be:

**effortless, premium, emotional, and instantly shareable.**



## Incorporate the official Auragram logo

Use the uploaded Auragram logo as the official brand reference for the app.

Important:

- Incorporate the official Auragram logo into the UI and branding of the product

- Preserve the overall look and feel of the logo:

  - stylized abstract “A” symbol

  - soft premium gradient

  - clean spaced “AURAGRAM” wordmark

  - dark premium background compatibility

- Do not redesign the logo into something unrelated

- Build the UI around this logo style so the product feels brand-consistent

### Logo usage requirements

#### 1. Top navigation

- Place the Auragram logo in the top-left corner of the landing page

- Also use the logo in the top-left of the app experience pages

- Keep it clean, small-to-medium sized, and premium

#### 2. Splash / loading / generation state

- Use the logo or symbol subtly in the loading / aura generation experience

- The logo can softly glow or fade in during transitions

- Make the loading experience feel connected to the logo’s premium aesthetic

#### 3. Brand consistency

Use the logo as the basis for the app’s visual system:

- dark black / near-black backgrounds

- gradient tones inspired by the logo:

  - purple

  - pink

  - peach / warm orange

  - soft blue-violet

- use these tones in:

  - CTA buttons

  - orb glow accents

  - hover states

  - progress indicators

  - subtle borders or highlights

#### 4. Visual relationship to the aura

The orb / aura should feel visually related to the logo:

- smooth, organic, polished

- premium gradient lighting

- minimal and elegant

- not noisy or overcomplicated

The logo should feel like the brand source,

while the orb feels like the living product expression.

#### 5. Typography alignment

The UI typography should visually match the logo’s tone:

- clean

- minimal

- modern

- premium

- lots of spacing

- not playful or cartoonish

#### 6. Footer / watermark usage

- Use the logo again in the footer of the landing page

- Optionally use the small symbol as a subtle watermark on the single-track aura page or export previews

### Brand priority

The logo should make the app feel like a real polished startup product.

Do not let the branding feel generic.

Make the interface feel intentionally designed around the official Auragram logo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://auragrams.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/986a65e0-86f3-4930-ae58-fc5efbc0fe45).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
