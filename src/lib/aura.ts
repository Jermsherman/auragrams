// Mood + personality + aura generation system. Pure functions, no side effects.
//
// v2: each mood is a full "AuraPersonality" — palette, motion, texture,
// particles, atmosphere — so every track feels like its own organism.

export type MoodKey =
  | "warm"
  | "nostalgic"
  | "dreamy"
  | "euphoric"
  | "romantic"
  | "melancholy"
  | "dark"
  | "cinematic"
  | "coastal"
  | "intimate"
  | "mysterious"
  | "energetic";

/** Backwards-compatible alias used by existing track records. */
export type PaletteKey = MoodKey;

export type ShapeKind = "round" | "oval" | "soft-blob" | "tall" | "wide";
export type MotionKind = "breathe" | "pulse" | "tide" | "shimmer" | "drift" | "smoke";
export type TextureKind = "smooth" | "grain" | "silk" | "mist" | "smoke" | "ripple";
export type ParticleKind = "dust" | "smoke" | "shimmer" | "mist" | "embers" | "tide";

export type AuraPersonality = {
  key: MoodKey;
  label: string;
  /** 5 oklch stops, ordered for the conic shell */
  stops: [string, string, string, string, string];
  swatches: string[];
  /** halo tint */
  glow: string;
  /** ambient atmosphere tint behind the orb */
  atmosphere: string;
  shape: ShapeKind;
  motion: MotionKind;
  texture: TextureKind;
  particle: ParticleKind;
  /** clamped 6 – 28 */
  particleCount: number;
  /** motion multiplier 0.4 – 1.6 */
  speed: number;
  hueShift: number;
  /** poetic phrase pools used for descriptions */
  phrases: {
    tone: string[];
    color: string[];
    edge: string[];
    motion: string[];
  };
};

export const PERSONALITIES: Record<MoodKey, AuraPersonality> = {
  warm: {
    key: "warm",
    label: "Warm",
    stops: [
      "oklch(0.78 0.16 50)",
      "oklch(0.74 0.2 20)",
      "oklch(0.7 0.2 350)",
      "oklch(0.6 0.2 305)",
      "oklch(0.84 0.14 70)",
    ],
    swatches: [
      "oklch(0.84 0.14 70)",
      "oklch(0.78 0.16 40)",
      "oklch(0.72 0.2 10)",
      "oklch(0.6 0.2 310)",
    ],
    glow: "oklch(0.78 0.18 30 / 0.6)",
    atmosphere: "oklch(0.5 0.18 25 / 0.35)",
    shape: "round",
    motion: "breathe",
    texture: "grain",
    particle: "dust",
    particleCount: 14,
    speed: 0.8,
    hueShift: 0,
    phrases: {
      tone: ["warm", "sun-soaked", "amber"],
      color: ["sunset tones", "peach and rose", "honeyed pink light"],
      edge: ["glowing edges", "a soft amber halo", "burnished light"],
      motion: ["a slow breathing pulse", "gentle ripples", "lazy summer drift"],
    },
  },
  nostalgic: {
    key: "nostalgic",
    label: "Nostalgic",
    stops: [
      "oklch(0.7 0.16 40)",
      "oklch(0.62 0.18 350)",
      "oklch(0.55 0.18 310)",
      "oklch(0.7 0.14 60)",
      "oklch(0.78 0.12 30)",
    ],
    swatches: [
      "oklch(0.78 0.12 30)",
      "oklch(0.7 0.16 40)",
      "oklch(0.6 0.18 350)",
      "oklch(0.5 0.16 305)",
    ],
    glow: "oklch(0.65 0.18 20 / 0.5)",
    atmosphere: "oklch(0.4 0.14 20 / 0.3)",
    shape: "oval",
    motion: "drift",
    texture: "grain",
    particle: "dust",
    particleCount: 12,
    speed: 0.6,
    hueShift: -8,
    phrases: {
      tone: ["nostalgic", "faded", "wistful"],
      color: ["dusty peach and plum", "sepia-tinted rose", "old-photograph warmth"],
      edge: ["a soft grainy halo", "faded edges", "a quiet golden rim"],
      motion: ["a slow drift", "memory-like floating", "barely-moving warmth"],
    },
  },
  dreamy: {
    key: "dreamy",
    label: "Dreamy",
    stops: [
      "oklch(0.86 0.08 290)",
      "oklch(0.78 0.12 250)",
      "oklch(0.82 0.1 200)",
      "oklch(0.92 0.04 270)",
      "oklch(0.74 0.14 280)",
    ],
    swatches: [
      "oklch(0.92 0.04 270)",
      "oklch(0.84 0.1 285)",
      "oklch(0.78 0.12 250)",
      "oklch(0.82 0.1 200)",
    ],
    glow: "oklch(0.85 0.1 270 / 0.55)",
    atmosphere: "oklch(0.55 0.12 270 / 0.3)",
    shape: "soft-blob",
    motion: "shimmer",
    texture: "mist",
    particle: "shimmer",
    particleCount: 22,
    speed: 1.0,
    hueShift: 20,
    phrases: {
      tone: ["weightless", "ethereal", "floating"],
      color: ["lavender and cyan light", "pale violet shimmer", "cloud-soft pastels"],
      edge: ["a shimmering veil", "an airy blurred halo", "a soft glassy rim"],
      motion: ["airy floating drift", "weightless shimmer", "an upward gentle lift"],
    },
  },
  euphoric: {
    key: "euphoric",
    label: "Euphoric",
    stops: [
      "oklch(0.82 0.18 200)",
      "oklch(0.78 0.2 320)",
      "oklch(0.85 0.16 100)",
      "oklch(0.75 0.2 250)",
      "oklch(0.94 0.06 300)",
    ],
    swatches: [
      "oklch(0.85 0.16 100)",
      "oklch(0.82 0.18 200)",
      "oklch(0.78 0.2 320)",
      "oklch(0.75 0.2 250)",
    ],
    glow: "oklch(0.82 0.2 220 / 0.65)",
    atmosphere: "oklch(0.6 0.2 320 / 0.35)",
    shape: "round",
    motion: "pulse",
    texture: "smooth",
    particle: "shimmer",
    particleCount: 26,
    speed: 1.5,
    hueShift: 30,
    phrases: {
      tone: ["euphoric", "exhilarated", "luminous"],
      color: ["electric magenta and cyan", "rising prismatic light", "bright neon bloom"],
      edge: ["a radiant burst", "a glowing aura that throbs with the beat", "blinding edges"],
      motion: ["a fast pulsing bloom", "rising rhythmic surges", "high-energy bursts"],
    },
  },
  romantic: {
    key: "romantic",
    label: "Romantic",
    stops: [
      "oklch(0.7 0.18 0)",
      "oklch(0.62 0.18 320)",
      "oklch(0.78 0.14 30)",
      "oklch(0.55 0.18 350)",
      "oklch(0.84 0.1 40)",
    ],
    swatches: [
      "oklch(0.84 0.1 40)",
      "oklch(0.78 0.14 20)",
      "oklch(0.7 0.18 0)",
      "oklch(0.55 0.18 340)",
    ],
    glow: "oklch(0.7 0.18 5 / 0.55)",
    atmosphere: "oklch(0.45 0.18 0 / 0.32)",
    shape: "oval",
    motion: "breathe",
    texture: "silk",
    particle: "dust",
    particleCount: 14,
    speed: 0.7,
    hueShift: -4,
    phrases: {
      tone: ["romantic", "tender", "intimate"],
      color: ["rose, plum and amber", "silken pinks", "warm candlelit hues"],
      edge: ["a soft haze", "silken glowing edges", "a velvet-lit halo"],
      motion: ["silky waves", "a slow heartbeat", "warm rolling breath"],
    },
  },
  melancholy: {
    key: "melancholy",
    label: "Melancholy",
    stops: [
      "oklch(0.5 0.14 270)",
      "oklch(0.4 0.16 305)",
      "oklch(0.55 0.16 220)",
      "oklch(0.62 0.14 250)",
      "oklch(0.7 0.1 280)",
    ],
    swatches: [
      "oklch(0.62 0.14 250)",
      "oklch(0.5 0.16 270)",
      "oklch(0.4 0.16 305)",
      "oklch(0.35 0.12 250)",
    ],
    glow: "oklch(0.5 0.16 280 / 0.5)",
    atmosphere: "oklch(0.3 0.12 270 / 0.35)",
    shape: "tall",
    motion: "drift",
    texture: "mist",
    particle: "mist",
    particleCount: 10,
    speed: 0.5,
    hueShift: -15,
    phrases: {
      tone: ["melancholy", "quiet", "blue-hour"],
      color: ["deep blue and faded violet", "rain-lit indigo", "muted twilight"],
      edge: ["a dim foggy halo", "softened edges", "a weary glow"],
      motion: ["a slow downward drift", "barely-moving stillness", "a long sigh"],
    },
  },
  dark: {
    key: "dark",
    label: "Dark",
    stops: [
      "oklch(0.22 0.06 290)",
      "oklch(0.32 0.16 295)",
      "oklch(0.38 0.18 260)",
      "oklch(0.45 0.2 25)",
      "oklch(0.18 0.05 290)",
    ],
    swatches: [
      "oklch(0.18 0.05 290)",
      "oklch(0.32 0.16 295)",
      "oklch(0.42 0.18 260)",
      "oklch(0.5 0.22 25)",
    ],
    glow: "oklch(0.42 0.2 295 / 0.6)",
    atmosphere: "oklch(0.18 0.08 290 / 0.5)",
    shape: "round",
    motion: "smoke",
    texture: "smoke",
    particle: "smoke",
    particleCount: 18,
    speed: 0.7,
    hueShift: -12,
    phrases: {
      tone: ["deep", "shadowed", "midnight"],
      color: ["indigo and crimson shadow", "near-black with violet undertone", "obsidian glow"],
      edge: ["a smoldering halo", "a heavy dark rim", "a smoky crown"],
      motion: ["a heavy pulse", "slow smoky churn", "low cinematic surge"],
    },
  },
  cinematic: {
    key: "cinematic",
    label: "Cinematic",
    stops: [
      "oklch(0.3 0.12 290)",
      "oklch(0.55 0.22 25)",
      "oklch(0.45 0.2 320)",
      "oklch(0.38 0.18 260)",
      "oklch(0.6 0.18 40)",
    ],
    swatches: [
      "oklch(0.6 0.18 40)",
      "oklch(0.55 0.22 25)",
      "oklch(0.45 0.2 320)",
      "oklch(0.3 0.12 290)",
    ],
    glow: "oklch(0.55 0.22 20 / 0.6)",
    atmosphere: "oklch(0.28 0.16 295 / 0.4)",
    shape: "wide",
    motion: "pulse",
    texture: "smoke",
    particle: "embers",
    particleCount: 18,
    speed: 1.1,
    hueShift: -6,
    phrases: {
      tone: ["cinematic", "epic", "wide-screen"],
      color: ["crimson and indigo", "scorched orange against deep violet", "filmic shadow and flame"],
      edge: ["a smoldering halo", "an atmospheric rim of embers", "a widescreen glow"],
      motion: ["heavy cinematic surges", "a slow building pulse", "tidal swells of light"],
    },
  },
  coastal: {
    key: "coastal",
    label: "Coastal",
    stops: [
      "oklch(0.78 0.12 200)",
      "oklch(0.7 0.14 230)",
      "oklch(0.82 0.1 280)",
      "oklch(0.78 0.14 30)",
      "oklch(0.86 0.08 220)",
    ],
    swatches: [
      "oklch(0.86 0.08 220)",
      "oklch(0.78 0.12 200)",
      "oklch(0.7 0.14 240)",
      "oklch(0.78 0.14 25)",
    ],
    glow: "oklch(0.78 0.14 215 / 0.55)",
    atmosphere: "oklch(0.5 0.14 220 / 0.35)",
    shape: "wide",
    motion: "tide",
    texture: "ripple",
    particle: "tide",
    particleCount: 16,
    speed: 0.8,
    hueShift: 60,
    phrases: {
      tone: ["coastal", "open", "salt-air"],
      color: ["teal, ocean blue and coral", "lavender dusk on water", "horizon-line pastels"],
      edge: ["a breezy halo", "a sea-mist rim", "edges that breathe like surf"],
      motion: ["slow tidal motion", "lapping waves", "a gentle ocean sway"],
    },
  },
  intimate: {
    key: "intimate",
    label: "Intimate",
    stops: [
      "oklch(0.55 0.18 20)",
      "oklch(0.45 0.16 350)",
      "oklch(0.7 0.14 40)",
      "oklch(0.4 0.14 320)",
      "oklch(0.62 0.16 10)",
    ],
    swatches: [
      "oklch(0.7 0.14 40)",
      "oklch(0.62 0.16 10)",
      "oklch(0.5 0.18 0)",
      "oklch(0.4 0.14 320)",
    ],
    glow: "oklch(0.55 0.18 10 / 0.55)",
    atmosphere: "oklch(0.35 0.16 0 / 0.4)",
    shape: "soft-blob",
    motion: "breathe",
    texture: "silk",
    particle: "embers",
    particleCount: 10,
    speed: 0.55,
    hueShift: -2,
    phrases: {
      tone: ["intimate", "close", "candlelit"],
      color: ["plum, rose and amber ember", "warm low light", "wine-dark warmth"],
      edge: ["a soft haze", "a quiet glowing rim", "edges lit from within"],
      motion: ["a close, slow heartbeat", "barely-there breathing", "a hushed pulse"],
    },
  },
  mysterious: {
    key: "mysterious",
    label: "Mysterious",
    stops: [
      "oklch(0.32 0.14 280)",
      "oklch(0.45 0.18 200)",
      "oklch(0.4 0.18 310)",
      "oklch(0.55 0.16 160)",
      "oklch(0.25 0.1 280)",
    ],
    swatches: [
      "oklch(0.25 0.1 280)",
      "oklch(0.4 0.18 310)",
      "oklch(0.45 0.18 200)",
      "oklch(0.55 0.16 160)",
    ],
    glow: "oklch(0.45 0.18 260 / 0.55)",
    atmosphere: "oklch(0.22 0.12 280 / 0.4)",
    shape: "tall",
    motion: "smoke",
    texture: "mist",
    particle: "mist",
    particleCount: 14,
    speed: 0.6,
    hueShift: 40,
    phrases: {
      tone: ["mysterious", "veiled", "occult"],
      color: ["jade and violet shadow", "deep teal with magenta veins", "nocturnal blues"],
      edge: ["a veiled halo", "a shifting smoky rim", "a hidden glow"],
      motion: ["a slow turning churn", "veiled drifting", "an unsettled sway"],
    },
  },
  energetic: {
    key: "energetic",
    label: "Energetic",
    stops: [
      "oklch(0.78 0.2 30)",
      "oklch(0.8 0.18 110)",
      "oklch(0.72 0.22 350)",
      "oklch(0.82 0.18 60)",
      "oklch(0.7 0.22 10)",
    ],
    swatches: [
      "oklch(0.82 0.18 60)",
      "oklch(0.78 0.2 30)",
      "oklch(0.72 0.22 350)",
      "oklch(0.8 0.18 110)",
    ],
    glow: "oklch(0.8 0.2 50 / 0.65)",
    atmosphere: "oklch(0.55 0.2 40 / 0.35)",
    shape: "round",
    motion: "pulse",
    texture: "grain",
    particle: "shimmer",
    particleCount: 26,
    speed: 1.6,
    hueShift: 10,
    phrases: {
      tone: ["energetic", "kinetic", "live-wire"],
      color: ["citrus and magenta", "hot orange and electric pink", "high-voltage warmth"],
      edge: ["a crackling halo", "edges that flare with the beat", "a sharp bright rim"],
      motion: ["fast rhythmic pulses", "kinetic bursts", "a relentless heartbeat"],
    },
  },
};

/** Mood label list for the picker — capitalized human labels. */
export const MOODS = [
  "Warm",
  "Nostalgic",
  "Dreamy",
  "Euphoric",
  "Romantic",
  "Melancholy",
  "Dark",
  "Cinematic",
  "Coastal",
  "Intimate",
  "Mysterious",
  "Energetic",
] as const;
export type Mood = (typeof MOODS)[number];

const MOOD_LABEL_TO_KEY: Record<string, MoodKey> = {
  Warm: "warm",
  Nostalgic: "nostalgic",
  Dreamy: "dreamy",
  Euphoric: "euphoric",
  Romantic: "romantic",
  Melancholy: "melancholy",
  Dark: "dark",
  Cinematic: "cinematic",
  Coastal: "coastal",
  Intimate: "intimate",
  Mysterious: "mysterious",
  Energetic: "energetic",
  // legacy moods
  Chill: "coastal",
  "Night Drive": "cinematic",
};

/** Legacy palette ids → new mood keys. */
const LEGACY_PALETTE_TO_MOOD: Record<string, MoodKey> = {
  "warm-nostalgic": "warm",
  "dark-cinematic": "cinematic",
  "bright-euphoric": "euphoric",
  "coastal-dreamy": "coastal",
  "melancholy-romantic": "romantic",
};

/** Resolve any stored palette id (new or legacy) to a personality. */
export function getPersonality(key: string | undefined | null): AuraPersonality {
  if (key && key in PERSONALITIES) return PERSONALITIES[key as MoodKey];
  if (key && key in LEGACY_PALETTE_TO_MOOD)
    return PERSONALITIES[LEGACY_PALETTE_TO_MOOD[key]];
  return PERSONALITIES.warm;
}

/** Backwards-compatible name kept for older imports. */
export const PALETTES: Record<string, AuraPersonality> = new Proxy(
  PERSONALITIES as unknown as Record<string, AuraPersonality>,
  {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (prop in LEGACY_PALETTE_TO_MOOD)
        return target[LEGACY_PALETTE_TO_MOOD[prop]];
      return target.warm;
    },
  },
);

export function personalityFromMoods(moods: string[]): MoodKey {
  for (const m of moods) {
    const key = MOOD_LABEL_TO_KEY[m];
    if (key) return key;
  }
  return "warm";
}

/** Backwards-compatible name. */
export const paletteFromMoods = personalityFromMoods;

// Deterministic small hash for seeded picks.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick<T>(list: readonly T[], seed: number): T {
  return list[seed % list.length];
}

const ADJECTIVES = [
  "Coastal",
  "Velvet",
  "Glass",
  "Midnight",
  "Golden",
  "Crimson",
  "Lunar",
  "Northern",
  "Smoky",
  "Saltwater",
  "Neon",
  "Distant",
  "Quiet",
  "Faded",
  "Electric",
  "Hollow",
  "Slow",
  "Bright",
];
const NOUNS = [
  "Nostalgia",
  "Horizon",
  "Reverie",
  "Drift",
  "Tide",
  "Mirage",
  "Glow",
  "Echo",
  "Bloom",
  "Pulse",
  "Hours",
  "Shimmer",
  "Memory",
  "Mood",
  "Embers",
  "Cathedral",
  "Window",
  "Smoke",
];

export function auraNameFor(seed: string, moods: string[]): string {
  const h = hash(seed + "|" + moods.join(","));
  if (moods.length > 0 && (h & 1)) {
    const m = moods[(h >>> 1) % moods.length];
    return `${m} ${pick(NOUNS, h >>> 4)}`;
  }
  return `${pick(ADJECTIVES, h)} ${pick(NOUNS, h >>> 5)}`;
}

const HIGH_ENERGY = new Set(["Euphoric", "Energetic", "Cinematic"]);
const LOW_ENERGY = new Set(["Melancholy", "Dreamy", "Romantic", "Nostalgic", "Intimate"]);

export function energyFor(seed: string, moods: string[]): number {
  const base = 35 + (hash(seed) % 60); // 35..94
  let bias = 0;
  for (const m of moods) {
    if (HIGH_ENERGY.has(m)) bias += 8;
    if (LOW_ENERGY.has(m)) bias -= 6;
  }
  return Math.max(20, Math.min(98, Math.round(base + bias)));
}

export function descriptionFor(moods: string[], moodKey: MoodKey, seed = ""): string {
  const p = PERSONALITIES[moodKey];
  const h = hash(seed + "|" + moodKey + "|" + moods.join(","));
  const tone = pick(p.phrases.tone, h);
  const color = pick(p.phrases.color, h >>> 3);
  const edge = pick(p.phrases.edge, h >>> 6);
  const motion = pick(p.phrases.motion, h >>> 9);
  const moodWord = moods[0]?.toLowerCase() ?? p.label.toLowerCase();
  return `A ${tone} ${moodWord} aura with ${color}, ${edge}, and ${motion}.`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function generateAura(input: {
  id: string;
  title: string;
  artist: string;
  moods: string[];
}) {
  const palette = personalityFromMoods(input.moods);
  const seedKey = input.id || `${input.artist}-${input.title}`;
  return {
    palette,
    auraName: auraNameFor(seedKey, input.moods),
    energy: energyFor(seedKey, input.moods),
    description: descriptionFor(input.moods, palette, seedKey),
  };
}
