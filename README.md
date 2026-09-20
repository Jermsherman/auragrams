# Auragram — Beta v1.0

Auragram is a music-first identity and social discovery platform for artists.
It combines the utility of a link-in-bio page with playable, expressive music experiences: artists turn uploaded songs into living visual identities called **Auras**, collect them, publish them through an **AuraLink**, and connect with listeners through public profiles and discovery.

**Live app:** https://auragrams.lovable.app

## Current phase

Auragram is in **Beta v1.0**. The complete core journey is working:

1. Upload a song and preview one Aura without an account.
2. Sign up or sign in to save the Aura and its audio.
3. Manage saved work in My Auras.
4. Build and customize a public AuraLink.
5. Share Auras, grow a profile, and discover other artists.

The product is usable end to end, while visuals, limits, discovery ranking, and experimental tools may continue to evolve during beta.

## Purpose

Streaming platforms reduce music to rows of titles, covers, and outbound links. Auragram gives each song a living identity and gives each artist a page that feels like their music.

The platform is designed to help artists:

- present releases through playable, reactive visuals;
- express their identity without needing a designer;
- replace a generic link page with a music-first AuraLink;
- connect with listeners through follows, reactions, and comments;
- understand how people engage with their public page;
- make their work easier to discover and share.

## Product vocabulary

- **Aura:** the canonical visual identity of one uploaded track, generated from its audio and chosen settings.
- **Aurascope:** the reactive orb and visual bands that render an Aura.
- **My Auras:** the signed-in artist's saved Aura collection.
- **AuraLink:** a public, customizable music page containing playable Auras and external streaming links.
- **Artist profile:** a public page with an artist's identity, Auras, and follower counts.
- **Discover:** the social browsing experience for trending, new, and followed artists' Auras.

## Features in Beta v1.0

### Aura creation

- Guest preview of one temporary Aura before signup.
- Audio-file uploads in common formats; streaming links are not used to generate Auras.
- In-browser analysis of waveform, mood, energy, musical key, brightness, dynamics, and frequency balance.
- Deterministic output: the same audio and settings produce the same base Aura.
- Audio-derived color palettes, mood-driven atmospheres, motion, glow, smoke, water, ember, and lightning effects.
- Reactive visual bands for the full mix, bass energy, rhythmic onsets, and vocal-range energy.
- Optional vocal display with a centered core pulse or equator streak.
- Per-band visibility, intensity, and palette controls.
- Collectible traits with explanations tied to the track analysis.
- A combined song personality profile with an editable vibe and an artist-written story.
- Private saved audio playback on Aura pages and AuraLinks.

### Artist workflow

- **My Auras** collection with search, sorting, editing, deletion, and AuraLink actions.
- Guest Aura claiming after sign-in, including the uploaded audio.
- Multiple artist identities on one account.
- Shareable individual Aura pages.
- Image share cards for social use where enabled.

### AuraLink

- One public, shareable music-first page per artist identity.
- Playable Auras alongside Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, and other external links.
- Custom slug, title, description, avatar, Aura ordering, and link ordering.
- Custom fonts, backgrounds, decorations, and palettes.
- Match-Aura-palette mode for a theme driven by a featured Aura.
- Public preview before sharing.
- Search and social-preview metadata for public pages.
- Branded “Create your own Aura” growth link on public AuraLinks.
- Owner insights for the last 30 days: page views, Aura plays, link clicks, and shares.

### Social and discovery

- Public artist profiles with published Auras and follower/following counts.
- Follow and unfollow artists while signed in.
- Discover tabs for **Trending**, **New**, and **Following**.
- Anonymous love reactions on public Auras.
- Signed-in comments, with deletion controls for comment authors and Aura owners.

### Mobile, privacy, and performance

- Installable PWA presentation for iPhone and Android with app icons and shortcuts.
- Mobile-first public Aura and AuraLink experiences.
- Saved audio stored privately and delivered through temporary playback URLs.
- Guest previews and their audio expire after roughly 72 hours unless claimed.
- Lower visual detail and paused off-screen motion on weaker devices to keep browsing smooth.
- Reduced-motion support.

## Beta boundaries

- Aura generation requires an uploaded audio file; Spotify, YouTube, SoundCloud, and other URLs are outbound links only.
- Audio analysis is heuristic. Mood, key, and vocal-range readings are creative estimates, not stem separation or musicological certification.
- Saved playback is a compressed mono preview, not a distribution-quality master.
- AuraLinks and published Auras are public. “Anonymous” hides the artist identity; it does not make an Aura private.
- Guest Auras are temporary until the artist signs in and saves them.
- Experimental or hidden tools are not part of the Beta v1.0 promise. Current feature flags keep Auracles, raw recording, story export, influence tools, and advanced palette editing out of the primary experience.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Product overview and guest Aura entry point |
| `/create` | Upload and create an Aura |
| `/aura/:id` | Individual playable Aura |
| `/farm` | My Auras |
| `/auralink/create` | Create or edit an AuraLink |
| `/l/:slug` | Public AuraLink |
| `/u/:username` | Public artist profile |
| `/discover` | Trending, new, and following feeds |
| `/for-artists` | Artist-focused product overview |
| `/faq` | About, mission, complete guide, limits, and troubleshooting |

## Technology

Auragram is built with React 19 and TanStack Start, styled with Tailwind CSS, and backed by Lovable Cloud for authentication, data, and private audio storage. Audio analysis and visual rendering run primarily in the browser.

## Local development

```sh
bun install
bun run dev
```

The app uses environment configuration supplied by the Lovable project. Do not commit private credentials.

## Product principles

- Music first, not dashboard first.
- One canonical Aura per song; no paid rerolls or artificial rarity.
- Premium, emotional, minimal, and social-first presentation.
- Artists control their story and identity.
- Public sharing should lead listeners back to the artist and help the network grow.
