export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; items: FaqItem[] };

export const FAQ: FaqSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      {
        q: "What is Auragram?",
        a: "Auragram is a music-sharing platform that turns songs, sounds, and music links into living visual identities called Auras.",
      },
      {
        q: "What is an Aura?",
        a: "An Aura is the visual identity created for one song, sound, demo, or music link. It can include motion, color, mood, key, energy, and a shareable page.",
      },
      {
        q: "What is an Aurascope?",
        a: "The Aurascope is the visual lens that displays your Aura. It is inspired by sound waves and oscilloscopes, so your music feels alive visually.",
      },
      {
        q: "What is an AuraLink?",
        a: "An AuraLink is a shareable music-first link page. It can include streaming links, saved Auras, or both.",
      },
      {
        q: "What is the Farm?",
        a: "Your Farm is where your saved Auras live. Think of it as your personal collection of sonic identities.",
      },
      {
        q: "What is an Auracle?",
        a: "An Auracle is a curated group of Auras, like an album, EP, playlist, demo pack, or rollout collection.",
      },
    ],
  },
  {
    id: "creating-auras",
    title: "Creating Auras",
    items: [
      {
        q: "How do I create an Aura?",
        a: "Go to Create Aura, then upload an audio file, paste a music link, or record a Raw Aura if available. Choose moods, optionally influence the colors, then generate your Aura.",
      },
      {
        q: "How many moods can I choose?",
        a: "You can choose up to 4 moods. Auragram blends those moods with your track's sound, key, energy, and color influence to create the Aura Profile.",
      },
      {
        q: "What does Detect Mood do?",
        a: "Detect Mood suggests moods based on the available audio features, key, energy, and tone. You can accept the suggestions or change them manually.",
      },
      {
        q: "What does Influence Aura mean?",
        a: "Influence Aura lets you guide the mood, colors, vibe note, and public identity of an existing Aura. It is not a technical editor — it is a way to shape the creative direction.",
      },
      {
        q: "Can I choose my own colors?",
        a: "Yes. Use Color Influence to suggest one color, build a palette, describe a color vibe, or let Auragram surprise you.",
      },
    ],
  },
  {
    id: "auralinks",
    title: "AuraLinks",
    items: [
      {
        q: "How do I create an AuraLink?",
        a: "Go to Build AuraLink. You can create a page using streaming links, saved Auras from your Farm, or a mix of both.",
      },
      {
        q: "Is AuraLink like Linktree?",
        a: "AuraLink serves a similar purpose, but it is built specifically for artists and music. It can include streaming links, Auras, and visual music experiences.",
      },
      {
        q: "Where can I share an AuraLink?",
        a: "You can share AuraLinks in Instagram bios, TikTok bios, DMs, stories, rollout posts, artist pages, or anywhere you would normally share a music link.",
      },
      {
        q: "Can I make an AuraLink with only streaming links?",
        a: "Yes. You can create an AuraLink using Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, and other music links.",
      },
      {
        q: "Can I make an AuraLink with my Auras?",
        a: "Yes. You can select Auras from your Farm and add them to an AuraLink.",
      },
    ],
  },
  {
    id: "farm",
    title: "Farm",
    items: [
      {
        q: "How do I save an Aura?",
        a: "After generating an Aura, click Save to Farm. It will appear in your Aura Farm.",
      },
      {
        q: "Can I delete an Aura?",
        a: "Yes. Open the Aura or find it in your Farm, then choose Delete. Deleting removes it from your Farm.",
      },
      {
        q: "Can I organize songs into projects?",
        a: "Yes. Use Auracles to group multiple Auras into a project like an album, EP, playlist, or rollout.",
      },
    ],
  },
  {
    id: "uploads",
    title: "Uploads & Music Links",
    items: [
      {
        q: "Why did my uploaded audio disappear after a while?",
        a: "In early MVP mode, uploaded files may use temporary browser storage. If the app is not connected to permanent storage yet, you may need to reupload after refreshing or returning later.",
      },
      {
        q: "How do I make uploaded audio last permanently?",
        a: "Auragram needs cloud storage to save uploaded audio permanently. Once connected, uploaded tracks stay attached to their Auras across sessions and devices.",
      },
      {
        q: "Why do Spotify or SoundCloud links not react like uploaded files?",
        a: "Streaming platforms use embedded players and do not expose raw audio data to Auragram. Uploaded files can drive real audio-reactive visuals, while platform links use mood and identity-based motion.",
      },
      {
        q: "Can I paste a Spotify, SoundCloud, YouTube, or Apple Music link?",
        a: "Yes. Auragram can detect major music platforms and show an embedded player or a polished platform button when embedding is not available.",
      },
      {
        q: "What file types can I upload?",
        a: "Auragram supports common audio formats including MP3, WAV, M4A, AAC, OGG, and WEBM.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & Accounts",
    items: [
      {
        q: "Do I need an account?",
        a: "You can browse without an account, but you need an account to create, save, publish, and manage Auras or AuraLinks.",
      },
      {
        q: "Can I post anonymously?",
        a: "Yes. Anonymous AuraLinks hide your public artist name or username, but the Aura still belongs privately to your account.",
      },
      {
        q: "Can I have more than one artist profile?",
        a: "Yes. A user can manage multiple artist profiles and choose which identity to use for each Aura.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    items: [
      {
        q: "My audio file will not upload. What should I do?",
        a: "Make sure it's a valid audio file (MP3, WAV, M4A, AAC, OGG, WEBM, or FLAC) and that your connection is stable. Larger files take longer to upload — the progress bar keeps ticking until it's done.",
      },
      {
        q: "My Aura is not reacting strongly enough. Why?",
        a: "Uploaded audio reacts best because Auragram can analyze the waveform. Platform links use simulated motion because the raw audio is not accessible.",
      },
      {
        q: "My SoundCloud or Spotify link is not playing. What should I check?",
        a: "Make sure the link is public and valid. Some platforms or tracks may block embedding, so Auragram may show an Open on Platform button instead.",
      },
      {
        q: "Can I change an Aura after I create it?",
        a: "Yes. Use Influence Aura to adjust moods, color direction, vibe note, or public identity.",
      },
      {
        q: "Can I change my AuraLink later?",
        a: "Yes. You can update the links, Auras, title, description, and theme of an AuraLink.",
      },
    ],
  },
];

export function getHomepageFaqs(): FaqItem[] {
  const keys: { section: string; q: string }[] = [
    { section: "getting-started", q: "What is an Aura?" },
    { section: "getting-started", q: "What is an AuraLink?" },
    { section: "uploads", q: "Can I paste a Spotify, SoundCloud, YouTube, or Apple Music link?" },
    { section: "uploads", q: "Why did my uploaded audio disappear after a while?" },
  ];
  return keys
    .map(({ section, q }) => FAQ.find((s) => s.id === section)?.items.find((it) => it.q === q))
    .filter((x): x is FaqItem => Boolean(x));
}
