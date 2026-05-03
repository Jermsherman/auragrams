// Mood + palette + aura generation system. Pure functions, no side effects.

export type PaletteKey =
  | "warm-nostalgic"
  | "dark-cinematic"
  | "bright-euphoric"
  | "coastal-dreamy"
  | "melancholy-romantic";

export type Palette = {
  key: PaletteKey;
  label: string;
  /** 4 stops as oklch() strings, ordered for the conic gradient */
  stops: [string, string, string, string];
  /** soft hex-ish swatches for UI dots (oklch ok) */
  swatches: [string, string, string, string];
  /** hue rotation hint in degrees applied to the base orb gradient */
  hueShift: number;
  /** glow tint */
  glow: string;
};

export const PALETTES: Record<PaletteKey, Palette> = {
  "warm-nostalgic": {
    key: "warm-nostalgic",
    label: "Warm · Nostalgic",
    stops: [
      "oklch(0.6 0.22 295)",
      "oklch(0.74 0.2 0)",
      "oklch(0.82 0.16 60)",
      "oklch(0.78 0.14 40)",
    ],
    swatches: [
      "oklch(0.6 0.22 295)",
      "oklch(0.74 0.2 0)",
      "oklch(0.82 0.16 60)",
      "oklch(0.86 0.1 50)",
    ],
    hueShift: 0,
    glow: "oklch(0.74 0.2 10 / 0.55)",
  },
  "dark-cinematic": {
    key: "dark-cinematic",
    label: "Dark · Cinematic",
    stops: [
      "oklch(0.25 0.08 290)",
      "oklch(0.4 0.18 295)",
      "oklch(0.42 0.18 260)",
      "oklch(0.5 0.22 25)",
    ],
    swatches: [
      "oklch(0.18 0.04 290)",
      "oklch(0.4 0.18 295)",
      "oklch(0.42 0.18 260)",
      "oklch(0.5 0.22 25)",
    ],
    hueShift: -10,
    glow: "oklch(0.45 0.2 295 / 0.55)",
  },
  "bright-euphoric": {
    key: "bright-euphoric",
    label: "Bright · Euphoric",
    stops: [
      "oklch(0.7 0.18 250)",
      "oklch(0.82 0.16 200)",
      "oklch(0.78 0.18 350)",
      "oklch(0.95 0.04 300)",
    ],
    swatches: [
      "oklch(0.7 0.18 250)",
      "oklch(0.82 0.16 200)",
      "oklch(0.78 0.18 350)",
      "oklch(0.97 0.02 300)",
    ],
    hueShift: 30,
    glow: "oklch(0.78 0.18 220 / 0.55)",
  },
  "coastal-dreamy": {
    key: "coastal-dreamy",
    label: "Coastal · Dreamy",
    stops: [
      "oklch(0.7 0.12 200)",
      "oklch(0.65 0.14 240)",
      "oklch(0.78 0.1 290)",
      "oklch(0.84 0.08 350)",
    ],
    swatches: [
      "oklch(0.7 0.14 195)",
      "oklch(0.65 0.14 240)",
      "oklch(0.78 0.1 290)",
      "oklch(0.86 0.08 350)",
    ],
    hueShift: 60,
    glow: "oklch(0.7 0.14 220 / 0.55)",
  },
  "melancholy-romantic": {
    key: "melancholy-romantic",
    label: "Melancholy · Romantic",
    stops: [
      "oklch(0.4 0.18 305)",
      "oklch(0.6 0.18 0)",
      "oklch(0.5 0.16 20)",
      "oklch(0.78 0.1 70)",
    ],
    swatches: [
      "oklch(0.4 0.18 305)",
      "oklch(0.6 0.18 0)",
      "oklch(0.5 0.16 20)",
      "oklch(0.82 0.1 70)",
    ],
    hueShift: -20,
    glow: "oklch(0.55 0.2 0 / 0.55)",
  },
};

export const MOODS = [
  "Warm",
  "Dark",
  "Nostalgic",
  "Euphoric",
  "Chill",
  "Cinematic",
  "Romantic",
  "Energetic",
  "Melancholy",
  "Dreamy",
  "Coastal",
  "Night Drive",
] as const;
export type Mood = (typeof MOODS)[number];

const MOOD_TO_PALETTE: Record<Mood, PaletteKey> = {
  Warm: "warm-nostalgic",
  Nostalgic: "warm-nostalgic",
  "Night Drive": "warm-nostalgic",
  Dark: "dark-cinematic",
  Cinematic: "dark-cinematic",
  Euphoric: "bright-euphoric",
  Energetic: "bright-euphoric",
  Chill: "coastal-dreamy",
  Coastal: "coastal-dreamy",
  Dreamy: "coastal-dreamy",
  Melancholy: "melancholy-romantic",
  Romantic: "melancholy-romantic",
};

export function paletteFromMoods(moods: string[]): PaletteKey {
  for (const m of moods) {
    const key = MOOD_TO_PALETTE[m as Mood];
    if (key) return key;
  }
  return "warm-nostalgic";
}

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
];

export function auraNameFor(seed: string, moods: string[]): string {
  const h = hash(seed + "|" + moods.join(","));
  // Bias toward a mood word when present.
  if (moods.length > 0 && (h & 1)) {
    const m = moods[(h >>> 1) % moods.length];
    return `${m} ${pick(NOUNS, h >>> 4)}`;
  }
  return `${pick(ADJECTIVES, h)} ${pick(NOUNS, h >>> 5)}`;
}

const HIGH_ENERGY = new Set(["Euphoric", "Energetic", "Cinematic"]);
const LOW_ENERGY = new Set(["Chill", "Melancholy", "Dreamy", "Romantic", "Nostalgic"]);

export function energyFor(seed: string, moods: string[]): number {
  const base = 35 + (hash(seed) % 60); // 35..94
  let bias = 0;
  for (const m of moods) {
    if (HIGH_ENERGY.has(m)) bias += 8;
    if (LOW_ENERGY.has(m)) bias -= 6;
  }
  return Math.max(20, Math.min(98, Math.round(base + bias)));
}

export function descriptionFor(moods: string[], paletteKey: PaletteKey): string {
  const palette = PALETTES[paletteKey];
  const m = moods.length ? moods.slice(0, 3).map((s) => s.toLowerCase()) : ["mellow"];
  const moodLine =
    m.length === 1
      ? m[0]
      : m.length === 2
        ? `${m[0]} and ${m[1]}`
        : `${m[0]}, ${m[1]} and ${m[2]}`;
  const flavor: Record<PaletteKey, string> = {
    "warm-nostalgic": "warm coastal tones with a nostalgic glow",
    "dark-cinematic": "deep cinematic shadows and slow-burning motion",
    "bright-euphoric": "bright euphoric light and rising momentum",
    "coastal-dreamy": "soft dreamy hues drifting like late afternoon water",
    "melancholy-romantic": "tender melancholy and a quiet romantic pulse",
  };
  return `A ${moodLine} aura — ${flavor[palette.key]}. Made to be felt, not explained.`;
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
  const palette = paletteFromMoods(input.moods);
  const seedKey = input.id || `${input.artist}-${input.title}`;
  return {
    palette,
    auraName: auraNameFor(seedKey, input.moods),
    energy: energyFor(seedKey, input.moods),
    description: descriptionFor(input.moods, palette),
  };
}
