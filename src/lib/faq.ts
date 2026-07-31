export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; items: FaqItem[] };

export const MISSION =
  "Auragram exists to give every song a living identity. Streaming turned music into text in a list — a title, a thumbnail, a link. We think a track deserves to look like it sounds. So we turn your audio into an Aura: a playable, reactive visual generated from the sound itself, and a music-first link page that moves instead of sitting still.";

export const FAQ: FaqSection[] = [
  {
    id: "mission",
    title: "Mission & What It Is",
    items: [
      {
        q: "What is Auragram?",
        a: "Auragram is a music-first identity platform for artists. You upload a song, and Auragram generates an Aura — a living visual built from that track's own sound — then lets you collect your Auras and share them on an AuraLink, a public link page built for music instead of generic buttons.",
      },
      {
        q: "What is Auragram's mission?",
        a: MISSION,
      },
      {
        q: "Who is Auragram for?",
        a: "Independent artists, producers, beatmakers, and labels who release music and share links constantly — in bios, DMs, stories, and rollout posts. If you have a song and a link to share, Auragram is built for you.",
      },
      {
        q: "How is this different from a normal link-in-bio page?",
        a: "A normal link page is a list of text buttons that looks the same for every artist and every release. An AuraLink puts a playable, reactive visual for each song on the page, colored from that song's own audio, with your streaming links alongside it. Same job, but the page actually reflects your music.",
      },
      {
        q: "What is an Aura?",
        a: "An Aura is the visual identity of a single track. It carries a palette, a mood set, an energy level, a musical key, reactive bands that move with the audio, collectible traits, and a story you write. It has its own page and can be added to your AuraLink.",
      },
      {
        q: "What is an Aurascope?",
        a: "The Aurascope is the lens that renders your Aura — the orb and its reactive bands. It is inspired by oscilloscopes and waveform displays, so what you see is driven by what the track is actually doing.",
      },
      {
        q: "What is an AuraLink?",
        a: "An AuraLink is your public, shareable music page. It can hold your saved Auras, your streaming links, your artist name and avatar, and a theme you customize. It lives at your own slug and you can update it any time.",
      },
      {
        q: "What are My Auras?",
        a: "My Auras is your private collection of every Aura you've saved. Search it, sort it, open any Aura, edit it, or add it to your AuraLink from there.",
      },
      {
        q: "Is Auragram finished?",
        a: "No — Auragram is in beta. The core loop (upload, generate, save, share) works end to end, but features, visuals, and limits will keep changing.",
      },
    ],
  },
  {
    id: "non-static-link",
    title: "The Non-Static Music Link",
    items: [
      {
        q: "What makes an AuraLink 'non-static'?",
        a: "Every Aura on the page is playable in place, and while it plays the visual reacts to the actual audio — the waveform ring moves with the mix, the halo swells on bass, pings fire on transients. Nothing on the page is a fixed image.",
      },
      {
        q: "Why does that matter?",
        a: "A static list gives someone nothing to do except leave. A page that plays and moves gives them a reason to stay for the length of a hook, which is the only thing that turns a click into a listen.",
      },
      {
        q: "Do visitors need an account to play my AuraLink?",
        a: "No. AuraLinks are public. Anyone with the link can open it, play your Auras, and tap through to your streaming platforms.",
      },
      {
        q: "Can I still include Spotify, Apple Music, and the rest?",
        a: "Yes. Streaming links sit on the page as platform buttons next to your Auras, so an AuraLink can fully replace whatever link page you use today.",
      },
      {
        q: "Where should I share my AuraLink?",
        a: "Anywhere you'd share a normal music link: Instagram and TikTok bios, stories, DMs, rollout posts, press emails, or your artist page.",
      },
    ],
  },
  {
    id: "toolkit",
    title: "Your Toolkit",
    items: [
      {
        q: "Create Aura",
        a: "Upload an audio file, choose moods, influence the colors, tell Auragram whether the track has vocals, customize the reactive bands, and generate the Aura.",
      },
      {
        q: "My Auras",
        a: "Your saved collection. Search by title, sort by newest or name, open any Aura, or push it straight to your AuraLink.",
      },
      {
        q: "AuraLink builder",
        a: "Pick which Auras appear, add streaming links, set your title, description, artist identity, slug, and theme — fonts, background, decorations, and palette.",
      },
      {
        q: "Public preview",
        a: "See your AuraLink exactly as a visitor will before you share it, so nothing goes out half-built.",
      },
      {
        q: "Share cards and story exports",
        a: "Export an Aura as an image card sized for Instagram Stories and TikTok, with the orb, song info, and traits baked in.",
      },
      {
        q: "Song personality profile and traits",
        a: "Each Aura gets a written personality profile and a set of traits derived from its audio — things like bass weight, energy, and brightness — with an explanation of where each trait came from.",
      },
      {
        q: "Auracles",
        a: "Auracles group several Auras into one collection — an album, EP, demo pack, or rollout. This is an advanced feature and may be hidden while Auragram is in beta.",
      },
    ],
  },
  {
    id: "how-it-works",
    title: "How It Works",
    items: [
      {
        q: "What happens when I upload a song?",
        a: "The file uploads, gets compressed to a lightweight version for playback, and is analyzed in your browser. Auragram reads the waveform to estimate key, energy, brightness, dynamics, and frequency balance, then uses those numbers to build the palette, the traits, and the motion of your Aura.",
      },
      {
        q: "How is the palette chosen?",
        a: "It's derived from the track's own characteristics — energy, brightness, and mood — then blended with any color influence you provide. The same file always produces the same base palette.",
      },
      {
        q: "What does Detect Mood do?",
        a: "It suggests moods from the analyzed audio features. It runs automatically after analysis, and you can accept, change, or replace the suggestions.",
      },
      {
        q: "How many moods can I choose?",
        a: "Up to four. Moods shape both the palette and the atmospheric effects around the orb.",
      },
      {
        q: "Who writes the Aura story?",
        a: "You do. Auragram generates the visual, the traits, and the personality profile, but the story in your own words is yours to write and edit at any time.",
      },
      {
        q: "Is my audio analyzed on a server?",
        a: "The audio analysis that drives your Aura runs in your browser. Your file is stored privately so it can play back later on your Aura page and AuraLink.",
      },
    ],
  },
  {
    id: "customization",
    title: "Customization",
    items: [
      {
        q: "Can I choose my own colors?",
        a: "Yes. Color Influence lets you suggest a single color, build a palette, describe a color vibe in words, or let Auragram decide.",
      },
      {
        q: "Can I change an Aura after creating it?",
        a: "Yes. You can edit the palette, moods, vibe note, story, and public identity from the Aura's page.",
      },
      {
        q: "What is the vibe note?",
        a: "One short quoted line that captures the feel of the track. It appears on the Aura profile and can be regenerated or rewritten.",
      },
      {
        q: "Can I customize the reactive bands?",
        a: "Yes. Each band can be shown or hidden, set to match your Aura palette or a specific swatch, and dialed to subtle, normal, or bold intensity.",
      },
      {
        q: "Core pulse or equator streak — what's the difference?",
        a: "That's the shape of the vocal band. Core pulse renders it as a circle pulsing in the center of the orb; equator streak renders it as a line running across the sphere. Pick whichever fits the track.",
      },
      {
        q: "What are the atmospheric effects?",
        a: "Mood-driven layers around the orb — smoke, water, ember, or lightning — chosen from the mood set so two Auras with different feels don't look alike.",
      },
      {
        q: "How much can I customize my AuraLink?",
        a: "Font, background, decorations, ordering of Auras and links, artist name, avatar, description, and slug. There's also a match-Aura-palette toggle that pulls the page colors from your featured Aura.",
      },
    ],
  },
  {
    id: "bands",
    title: "Bands & What Drives Them",
    items: [
      {
        q: "What is the waveform ring driven by?",
        a: "The full mix. It traces the overall amplitude of the track in real time, so it moves with everything at once.",
      },
      {
        q: "What is the bass halo driven by?",
        a: "Low-frequency energy below roughly 200 Hz — kick and sub. It swells outward on heavy low end.",
      },
      {
        q: "What are the radar pings driven by?",
        a: "Onsets, detected as sudden jumps in the spectrum. They fire on hits and transients rather than on sustained sound, so they track rhythm.",
      },
      {
        q: "What is the vocal band driven by?",
        a: "Mid-range energy, roughly 200 Hz to 4 kHz, where most vocals sit. It only renders if you mark the track as having vocals.",
      },
      {
        q: "Why does the beat band look different from the vocal band?",
        a: "They're intentionally separate. The beat pings react to transient onsets across the spectrum; the vocal band reacts to sustained mid-range energy. Different sources, different motion.",
      },
    ],
  },
  {
    id: "auralinks",
    title: "Building AuraLinks",
    items: [
      {
        q: "How do I create an AuraLink?",
        a: "Go to Build AuraLink, choose the Auras you want to feature, add your streaming links, set your title and theme, then publish.",
      },
      {
        q: "Can I make one with only streaming links?",
        a: "Yes. Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, and other links work on their own if you don't want to feature Auras yet.",
      },
      {
        q: "Can I edit it after publishing?",
        a: "Yes. Links, Auras, title, description, theme, and identity can all be changed later, and the URL stays the same.",
      },
      {
        q: "Can I choose my own URL?",
        a: "Yes, you pick a slug. Some short and reserved words are unavailable because they're used by the app itself.",
      },
      {
        q: "How many AuraLinks can I have?",
        a: "The MVP is built around one AuraLink per artist identity. If you manage multiple artist profiles, each can have its own.",
      },
    ],
  },
  {
    id: "uploads",
    title: "Uploads & Music Links",
    items: [
      {
        q: "What file types can I upload?",
        a: "Common audio formats: MP3, WAV, M4A, AAC, OGG, WEBM, and FLAC.",
      },
      {
        q: "Can I create an Aura from a Spotify or SoundCloud link?",
        a: "No. Auras are generated from uploaded audio only, because the visuals need the actual waveform. Streaming links are added separately as buttons on your AuraLink.",
      },
      {
        q: "Why can't streaming embeds react like uploads?",
        a: "Platform players don't expose raw audio data to outside sites. There is no way to read the waveform out of a Spotify or SoundCloud embed, so those can't drive reactive motion.",
      },
      {
        q: "Does my uploaded audio stay available?",
        a: "Yes, once you've saved the Aura to your account. Saved audio is stored privately and streams back on your Aura page and AuraLink.",
      },
      {
        q: "Does uploading compress my track?",
        a: "Playback uses a compressed, mono version to keep pages fast and storage light. It's for previewing your Aura, not for distribution-quality listening.",
      },
    ],
  },
  {
    id: "accounts",
    title: "Accounts, Privacy & Sharing",
    items: [
      {
        q: "Do I need an account to try it?",
        a: "No. You can create and preview one Aura as a guest. You need an account to save it, build an AuraLink, or create more.",
      },
      {
        q: "What happens to my guest Aura when I sign up?",
        a: "It's claimed into your account with its audio intact, and you're taken straight to AuraLink setup.",
      },
      {
        q: "What does the Anonymous option actually do?",
        a: "It hides your public artist name or username from the Aura. It does not make the Aura private — the Aura itself is still publicly viewable by anyone with the link.",
      },
      {
        q: "Are AuraLinks private?",
        a: "No. AuraLinks are public and shareable by design. Don't put anything on one you wouldn't want seen.",
      },
      {
        q: "Can I have more than one artist profile?",
        a: "Yes. One account can manage multiple artist identities and you choose which one each Aura uses.",
      },
      {
        q: "Can I delete an Aura?",
        a: "Yes. Open it from My Auras and choose Delete. That removes it from your collection and from any AuraLink featuring it.",
      },
    ],
  },
  {
    id: "limitations",
    title: "Limitations",
    items: [
      {
        q: "Auras come from uploads only",
        a: "You cannot generate an Aura from a streaming link, a YouTube URL, or an embed. An audio file is required.",
      },
      {
        q: "Guest previews expire",
        a: "An Aura created without an account — and its uploaded audio — is temporary and is cleared roughly 72 hours after creation. Sign in and save to keep it.",
      },
      {
        q: "There is no stem separation",
        a: "Auragram does not isolate vocals, drums, or instruments. The vocal band is a mid-range energy reading, so instruments in that range will also move it.",
      },
      {
        q: "Vocals are a manual toggle",
        a: "You tell Auragram whether the track has vocals. It is not auto-detected, so setting it wrong will show or hide the vocal band incorrectly.",
      },
      {
        q: "Mood and key detection are estimates",
        a: "Key, energy, and mood are heuristic readings of the waveform, not the output of a trained musicologist. Treat them as strong suggestions and override them freely.",
      },
      {
        q: "Auras are deterministic",
        a: "The same file with the same settings always produces the same base Aura. Re-uploading a track won't roll a different look — change the moods or color influence instead.",
      },
      {
        q: "Playback audio is compressed",
        a: "Stored playback is mono and compressed. It's a preview, not a master, and it will not represent your mix at full fidelity.",
      },
      {
        q: "Visuals scale down on weaker devices",
        a: "On low-power devices, in grids, and for off-screen orbs, effects are reduced or paused to keep the page smooth. Full-quality motion is reserved for the focused Aura.",
      },
      {
        q: "Some features are hidden in beta",
        a: "Auracles, lore, and social features like following and commenting are either off or limited while the MVP focuses on Create, My Auras, AuraLink, and public sharing.",
      },
      {
        q: "No analytics yet",
        a: "AuraLinks don't currently report click or play counts. Use your streaming platform's own dashboards in the meantime.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    items: [
      {
        q: "My audio file will not upload. What should I do?",
        a: "Make sure it's a valid audio file (MP3, WAV, M4A, AAC, OGG, WEBM, or FLAC) and that your connection is stable. Larger files take longer — the progress bar keeps ticking until it's done.",
      },
      {
        q: "My Aura is not reacting strongly enough. Why?",
        a: "Check that the bands you want are enabled and set to bold intensity. Quiet or heavily compressed masters produce less movement, and off-screen orbs pause until you scroll them into view.",
      },
      {
        q: "The vocal band isn't showing",
        a: "It only renders when the track is marked as having vocals and the vocal band is enabled. Check both on the Aura's settings.",
      },
      {
        q: "My uploaded audio disappeared",
        a: "That usually means the Aura was created as a guest and passed its 72-hour window. Guest previews are temporary — sign in and save to make them permanent.",
      },
      {
        q: "My SoundCloud or Spotify link is not playing",
        a: "Make sure the link is public and valid. Some tracks block embedding, in which case Auragram shows an Open on Platform button instead.",
      },
      {
        q: "My AuraLink slug is taken",
        a: "Either someone else has it, or it's on the reserved list used by the app's own pages. Try adding your artist name or a release name to it.",
      },
    ],
  },
];

export function getHomepageFaqs(): FaqItem[] {
  const keys: { section: string; q: string }[] = [
    { section: "mission", q: "What is an Aura?" },
    { section: "mission", q: "What is an AuraLink?" },
    { section: "non-static-link", q: "What makes an AuraLink 'non-static'?" },
    { section: "uploads", q: "Can I create an Aura from a Spotify or SoundCloud link?" },
  ];
  return keys
    .map(({ section, q }) => FAQ.find((s) => s.id === section)?.items.find((it) => it.q === q))
    .filter((x): x is FaqItem => Boolean(x));
}
