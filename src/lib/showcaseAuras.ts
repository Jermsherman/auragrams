// Curated showcase Auras for the landing hero + "What is an Aura?" explainer.
// These are hand-tuned so each one renders distinctly via the Aurascope
// `aura.colors → effectiveProfile` fallback path. No DB, no generation.

import type { AuraPalette, PaletteKey } from "./aura";

export type ShowcaseAura = {
  id: string;
  trackTitle: string;
  artistName?: string;
  palette: PaletteKey;
  paletteName: string;
  mood: string;
  moodTags: string[];
  energy: number; // 0–100
  musicalKey: string;
  vibeDescription: string;
  colors: AuraPalette;
  seed: number;
};

function p(
  primary: string,
  secondary: string,
  accent: string,
  shadow: string,
  glow: string,
  particle: string,
  swatches: string[],
): AuraPalette {
  return { primary, secondary, accent, shadow, glow, particle, swatches };
}

export const SHOWCASE_AURAS: ShowcaseAura[] = [
  {
    id: "midnight-drive",
    trackTitle: "Midnight Drive",
    palette: "nostalgic",
    paletteName: "Dusk Rose",
    mood: "Nostalgic",
    moodTags: ["Nostalgic", "Hazy", "Romantic"],
    energy: 42,
    musicalKey: "A Minor",
    vibeDescription: "A sepia-pink memory drifting under streetlights.",
    colors: p(
      "#F5B5C8",
      "#E48498",
      "#A0567E",
      "#3A1832",
      "#F5B5C8AA",
      "#FFD7E1",
      ["#F5B5C8", "#E48498", "#A0567E", "#3A1832"],
    ),
    seed: 12,
  },
  {
    id: "bloodline",
    trackTitle: "Bloodline",
    palette: "dark",
    paletteName: "Crimson Smoke",
    mood: "Brooding",
    moodTags: ["Dark", "Aggressive", "Heavy"],
    energy: 88,
    musicalKey: "F# Minor",
    vibeDescription: "Obsidian shadow with a smoldering crimson pulse.",
    colors: p(
      "#8C1E3F",
      "#3A1F4E",
      "#B22B3A",
      "#0E0A1A",
      "#B22B3A99",
      "#FF4D6D",
      ["#8C1E3F", "#3A1F4E", "#B22B3A", "#0E0A1A"],
    ),
    seed: 41,
  },
  {
    id: "cyan-hour",
    trackTitle: "Cyan Hour",
    palette: "euphoric",
    paletteName: "Neon Tide",
    mood: "Euphoric",
    moodTags: ["Electric", "Euphoric", "Kinetic"],
    energy: 91,
    musicalKey: "C Major",
    vibeDescription: "A prismatic burst of cyan and electric magenta.",
    colors: p(
      "#3DD2FF",
      "#7C8AFF",
      "#FF4FCB",
      "#0E0E1A",
      "#3DD2FFAA",
      "#FFFFFF",
      ["#3DD2FF", "#7C8AFF", "#FF4FCB", "#FFFFFF"],
    ),
    seed: 78,
  },
  {
    id: "cedar-smoke",
    trackTitle: "Cedar Smoke",
    palette: "intimate",
    paletteName: "Forest Ember",
    mood: "Intimate",
    moodTags: ["Earthy", "Acoustic", "Warm"],
    energy: 28,
    musicalKey: "G Major",
    vibeDescription: "Candlelit cedar warmth with a quiet inward glow.",
    colors: p(
      "#9C6B3F",
      "#5E4730",
      "#C0894A",
      "#2A1A14",
      "#9C6B3F88",
      "#E8C088",
      ["#9C6B3F", "#5E4730", "#C0894A", "#2A1A14"],
    ),
    seed: 23,
  },
  {
    id: "goldroad",
    trackTitle: "Goldroad",
    palette: "warm",
    paletteName: "Honey Highway",
    mood: "Warm",
    moodTags: ["Warm", "Golden", "Open"],
    energy: 55,
    musicalKey: "D Major",
    vibeDescription: "Sunlit gold rolling across an open horizon.",
    colors: p(
      "#F1C75B",
      "#E89B4A",
      "#E96D78",
      "#5A2A1A",
      "#F1C75BAA",
      "#FFE3B0",
      ["#F1C75B", "#E89B4A", "#E96D78", "#FFE3B0"],
    ),
    seed: 55,
  },
  {
    id: "sunbleach",
    trackTitle: "Sunbleach",
    palette: "energetic",
    paletteName: "Indie Pop Sparkle",
    mood: "Playful",
    moodTags: ["Bright", "Playful", "Indie"],
    energy: 72,
    musicalKey: "E Major",
    vibeDescription: "Candy-bright sparkle with a quick playful bounce.",
    colors: p(
      "#FF8FC3",
      "#5BD8E0",
      "#FFE36E",
      "#1B1E2D",
      "#FF8FC3AA",
      "#FFFFFF",
      ["#FF8FC3", "#5BD8E0", "#FFE36E", "#B57BFF"],
    ),
    seed: 64,
  },
  {
    id: "last-light",
    trackTitle: "Last Light",
    palette: "cinematic",
    paletteName: "Widescreen Ember",
    mood: "Cinematic",
    moodTags: ["Cinematic", "Epic", "Filmic"],
    energy: 64,
    musicalKey: "B Minor",
    vibeDescription: "A widescreen ember swell of orange against deep violet.",
    colors: p(
      "#C57E4A",
      "#71336A",
      "#B83A3A",
      "#2B1F3D",
      "#C57E4AAA",
      "#F2A06A",
      ["#C57E4A", "#B83A3A", "#71336A", "#2B1F3D"],
    ),
    seed: 33,
  },
  {
    id: "tide-letters",
    trackTitle: "Tide Letters",
    palette: "coastal",
    paletteName: "Lo-fi Coast",
    mood: "Coastal",
    moodTags: ["Coastal", "Lo-fi", "Calm"],
    energy: 38,
    musicalKey: "F Major",
    vibeDescription: "Soft tidal motion under a salt-air shimmer.",
    colors: p(
      "#A9DCE6",
      "#5FB6C7",
      "#E8927C",
      "#1B3A52",
      "#A9DCE6AA",
      "#FFFFFF",
      ["#A9DCE6", "#5FB6C7", "#5A86B8", "#E8927C"],
    ),
    seed: 47,
  },
  {
    id: "veil",
    trackTitle: "Veil",
    palette: "mysterious",
    paletteName: "Nocturne",
    mood: "Mysterious",
    moodTags: ["Mysterious", "Veiled", "Nocturnal"],
    energy: 60,
    musicalKey: "C# Minor",
    vibeDescription: "A veiled jade shimmer drifting through nocturnal smoke.",
    colors: p(
      "#5C2D75",
      "#2D6B85",
      "#3B8C6E",
      "#0E0B1F",
      "#5C2D7599",
      "#9BD4B5",
      ["#231742", "#5C2D75", "#2D6B85", "#3B8C6E"],
    ),
    seed: 19,
  },
  {
    id: "heavenbody",
    trackTitle: "Heavenbody",
    palette: "dreamy",
    paletteName: "Ether",
    mood: "Dreamy",
    moodTags: ["Ethereal", "Weightless", "Heavenly"],
    energy: 22,
    musicalKey: "A Major",
    vibeDescription: "A weightless lavender shimmer rising into white air.",
    colors: p(
      "#E5DEF7",
      "#C4B5F0",
      "#A9D6E5",
      "#3A3460",
      "#E5DEF7AA",
      "#FFFFFF",
      ["#E5DEF7", "#C4B5F0", "#9DB6E8", "#A9D6E5"],
    ),
    seed: 7,
  },
];

export function pickRandomShowcase(prevId?: string): ShowcaseAura {
  const pool = prevId ? SHOWCASE_AURAS.filter((s) => s.id !== prevId) : SHOWCASE_AURAS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickContrastingShowcase(toId: string): ShowcaseAura {
  // Deterministic counterpart for the explainer section.
  const idx = SHOWCASE_AURAS.findIndex((s) => s.id === toId);
  const next = (idx + Math.floor(SHOWCASE_AURAS.length / 2)) % SHOWCASE_AURAS.length;
  return SHOWCASE_AURAS[next];
}
