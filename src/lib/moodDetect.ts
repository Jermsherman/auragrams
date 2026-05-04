// Detect Mood — heuristic suggestions over MOODS in aura.ts.
// Returns up to 4 mood labels that exist in MOOD_TRAITS.

import { MOODS } from "./aura";
import type { AudioFeatures } from "./audioFeatures";
import type { KeyDetection } from "./keyDetect";

const ALL = new Set(MOODS);
function pickExisting(arr: string[], n = 4): string[] {
  const out: string[] = [];
  for (const m of arr) {
    if (ALL.has(m) && !out.includes(m)) out.push(m);
    if (out.length >= n) break;
  }
  return out;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function suggestMoods(input: {
  features?: AudioFeatures | null;
  keyDetection?: KeyDetection | null;
  pitchHz?: number | null;
  title?: string;
  artist?: string;
  sourceType?: "upload" | "platform_link" | "raw_recording";
}): string[] {
  const { features, keyDetection, pitchHz, title, artist, sourceType } = input;
  const mode = keyDetection?.mode ?? null;

  if (features) {
    const energy = features.energy;
    const bright = features.brightness;
    const bass = features.bands.bass;
    const treble = features.bands.treble;
    const isMinor = mode === "minor";
    const isMajor = mode === "major";
    const candidates: string[] = [];

    // Raw recording bias
    if (sourceType === "raw_recording") {
      candidates.push("Raw", "Intimate");
    }

    if (energy < 45 && (isMinor || bright < 0.35)) {
      candidates.push("Melancholy", "Intimate", "Nocturnal", "Reflective");
    } else if (energy >= 70 && (isMajor || bright > 0.55)) {
      candidates.push("Euphoric", "Electric", "Glowing", "Triumphant");
    } else if (bright < 0.3 && bass > 0.45) {
      candidates.push("Dark", "Brooding", "Cinematic", "Mysterious");
    } else if (treble > 0.35 && features.rms < 0.35) {
      candidates.push("Dreamy", "Ethereal", "Weightless", "Serene");
    } else if (energy >= 50 && energy < 70 && bright > 0.4 && bright < 0.65) {
      candidates.push("Warm", "Nostalgic", "Soulful", "Romantic");
    } else if (energy >= 60) {
      candidates.push("Energetic", "Playful", "Restless", "Glowing");
    } else {
      candidates.push("Hazy", "Reflective", "Bittersweet", "Warm");
    }

    // Pitch-derived nudge for raw vocals
    if (sourceType === "raw_recording" && pitchHz) {
      if (pitchHz < 180) candidates.push("Brooding");
      else if (pitchHz > 320) candidates.push("Fragile", "Ethereal");
    }

    return pickExisting(candidates, 4);
  }

  // Fallback for platform links — deterministic from text + key
  const seed = hash(`${title ?? ""}|${artist ?? ""}`);
  const banks: string[][] = [
    ["Warm", "Nostalgic", "Romantic", "Soulful"],
    ["Dreamy", "Ethereal", "Hazy", "Weightless"],
    ["Melancholy", "Reflective", "Intimate", "Nocturnal"],
    ["Dark", "Brooding", "Cinematic", "Mysterious"],
    ["Euphoric", "Electric", "Glowing", "Playful"],
    ["Energetic", "Restless", "Triumphant", "Gritty"],
    ["Coastal", "Serene", "Hopeful", "Summer"],
    ["Bittersweet", "Wistful", "Romantic", "Golden"],
  ];
  let pickIdx = seed % banks.length;
  if (mode === "minor") pickIdx = [2, 3, 7][seed % 3];
  if (mode === "major") pickIdx = [0, 4, 6][seed % 3];
  return pickExisting(banks[pickIdx], 4);
}
