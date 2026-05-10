// Mood suggestion — weighted, seeded picker over the full MOODS pool.
// Goal: avoid "same 4 every track". Each mood gets a score from audio features,
// key/mode, and source bias. A deterministic seed jitter then picks from the
// top-scoring band, balanced across axes (energy, brightness, key/mode, density).

import { MOODS } from "./aura";
import type { AudioFeatures } from "./audioFeatures";
import type { KeyDetection } from "./keyDetect";

type Axis = "energy" | "brightness" | "mode" | "density" | "texture";

// Mood profile: which slice of the spectrum each mood lives in.
// energy: 0..1 desired energy. bright: 0..1 desired brightness.
// modeBias: -1 minor / +1 major / 0 neutral. density 0..1. soft 0..1.
// axis: which slot it primarily fills.
type MoodProfile = { energy: number; bright: number; modeBias: number; density: number; soft: number; axis: Axis; tags?: string[] };

const PROF: Record<string, MoodProfile> = {
  Warm:        { energy: 0.55, bright: 0.55, modeBias: 0.6, density: 0.55, soft: 0.55, axis: "brightness" },
  Nostalgic:   { energy: 0.40, bright: 0.45, modeBias: -0.1, density: 0.45, soft: 0.7, axis: "texture" },
  Dreamy:      { energy: 0.35, bright: 0.65, modeBias: 0.2, density: 0.30, soft: 0.85, axis: "density" },
  Euphoric:    { energy: 0.92, bright: 0.85, modeBias: 0.7, density: 0.80, soft: 0.2, axis: "energy" },
  Romantic:    { energy: 0.50, bright: 0.50, modeBias: 0.0, density: 0.55, soft: 0.7, axis: "brightness" },
  Melancholy:  { energy: 0.25, bright: 0.30, modeBias: -0.9, density: 0.35, soft: 0.7, axis: "mode" },
  Dark:        { energy: 0.55, bright: 0.20, modeBias: -0.7, density: 0.75, soft: 0.2, axis: "brightness" },
  Cinematic:   { energy: 0.70, bright: 0.40, modeBias: -0.3, density: 0.85, soft: 0.3, axis: "density" },
  Coastal:     { energy: 0.50, bright: 0.65, modeBias: 0.4, density: 0.45, soft: 0.7, axis: "texture" },
  Intimate:    { energy: 0.30, bright: 0.45, modeBias: -0.2, density: 0.40, soft: 0.85, axis: "density" },
  Mysterious:  { energy: 0.45, bright: 0.30, modeBias: -0.5, density: 0.55, soft: 0.6, axis: "mode" },
  Energetic:   { energy: 0.92, bright: 0.70, modeBias: 0.4, density: 0.75, soft: 0.1, axis: "energy" },
  Heavenly:    { energy: 0.45, bright: 0.85, modeBias: 0.7, density: 0.40, soft: 0.85, axis: "brightness" },
  Lonely:      { energy: 0.25, bright: 0.30, modeBias: -0.8, density: 0.30, soft: 0.8, axis: "mode" },
  Spiritual:   { energy: 0.45, bright: 0.65, modeBias: 0.0, density: 0.55, soft: 0.7, axis: "texture" },
  Hopeful:     { energy: 0.65, bright: 0.75, modeBias: 0.7, density: 0.55, soft: 0.6, axis: "mode" },
  Bittersweet: { energy: 0.45, bright: 0.50, modeBias: -0.3, density: 0.45, soft: 0.7, axis: "mode" },
  Tense:       { energy: 0.75, bright: 0.45, modeBias: -0.6, density: 0.65, soft: 0.15, axis: "energy" },
  Triumphant:  { energy: 0.85, bright: 0.75, modeBias: 0.8, density: 0.85, soft: 0.2, axis: "energy" },
  Playful:     { energy: 0.78, bright: 0.75, modeBias: 0.5, density: 0.60, soft: 0.4, axis: "energy" },
  Seductive:   { energy: 0.45, bright: 0.35, modeBias: -0.3, density: 0.60, soft: 0.7, axis: "texture" },
  Reflective:  { energy: 0.30, bright: 0.45, modeBias: -0.4, density: 0.40, soft: 0.8, axis: "mode" },
  Raw:         { energy: 0.55, bright: 0.45, modeBias: -0.2, density: 0.55, soft: 0.4, axis: "texture" },
  Hazy:        { energy: 0.35, bright: 0.40, modeBias: -0.1, density: 0.40, soft: 0.85, axis: "density" },
  Weightless:  { energy: 0.30, bright: 0.75, modeBias: 0.4, density: 0.25, soft: 0.9, axis: "density" },
  Brooding:    { energy: 0.45, bright: 0.20, modeBias: -0.8, density: 0.70, soft: 0.3, axis: "mode" },
  Glowing:     { energy: 0.65, bright: 0.80, modeBias: 0.6, density: 0.60, soft: 0.5, axis: "brightness" },
  Restless:    { energy: 0.80, bright: 0.60, modeBias: -0.1, density: 0.65, soft: 0.2, axis: "energy" },
  Blissful:    { energy: 0.65, bright: 0.85, modeBias: 0.7, density: 0.55, soft: 0.7, axis: "brightness" },
  Midnight:    { energy: 0.40, bright: 0.25, modeBias: -0.6, density: 0.55, soft: 0.6, axis: "mode" },
  Summer:      { energy: 0.70, bright: 0.80, modeBias: 0.7, density: 0.60, soft: 0.5, axis: "brightness" },
  Winter:      { energy: 0.40, bright: 0.65, modeBias: -0.2, density: 0.40, soft: 0.7, axis: "texture" },
  Golden:      { energy: 0.55, bright: 0.70, modeBias: 0.6, density: 0.55, soft: 0.6, axis: "brightness" },
  Electric:    { energy: 0.92, bright: 0.85, modeBias: 0.4, density: 0.75, soft: 0.1, axis: "energy" },
  Oceanic:     { energy: 0.45, bright: 0.55, modeBias: 0.2, density: 0.50, soft: 0.75, axis: "texture" },
  Fragile:     { energy: 0.25, bright: 0.65, modeBias: -0.2, density: 0.25, soft: 0.95, axis: "density" },
  Velvet:      { energy: 0.40, bright: 0.40, modeBias: -0.2, density: 0.60, soft: 0.85, axis: "texture" },
  Chaotic:     { energy: 0.92, bright: 0.55, modeBias: -0.3, density: 0.80, soft: 0.05, axis: "energy" },
  Gentle:      { energy: 0.30, bright: 0.55, modeBias: 0.3, density: 0.35, soft: 0.95, axis: "density" },
  Transcendent:{ energy: 0.60, bright: 0.85, modeBias: 0.5, density: 0.55, soft: 0.7, axis: "brightness" },
  Soulful:     { energy: 0.55, bright: 0.55, modeBias: 0.2, density: 0.65, soft: 0.6, axis: "texture" },
  Anxious:     { energy: 0.75, bright: 0.45, modeBias: -0.7, density: 0.55, soft: 0.15, axis: "mode" },
  Uplifting:   { energy: 0.78, bright: 0.80, modeBias: 0.8, density: 0.60, soft: 0.5, axis: "mode" },
  Haunted:     { energy: 0.30, bright: 0.30, modeBias: -0.7, density: 0.45, soft: 0.6, axis: "mode" },
  Tender:      { energy: 0.40, bright: 0.60, modeBias: 0.2, density: 0.40, soft: 0.95, axis: "density" },
  Radiant:     { energy: 0.80, bright: 0.90, modeBias: 0.7, density: 0.70, soft: 0.4, axis: "brightness" },
  Stormy:      { energy: 0.70, bright: 0.40, modeBias: -0.5, density: 0.80, soft: 0.2, axis: "density" },
  Serene:      { energy: 0.30, bright: 0.65, modeBias: 0.3, density: 0.30, soft: 0.95, axis: "density" },
  Gritty:      { energy: 0.65, bright: 0.40, modeBias: -0.2, density: 0.65, soft: 0.15, axis: "texture" },
  Hypnotic:    { energy: 0.55, bright: 0.50, modeBias: -0.1, density: 0.65, soft: 0.5, axis: "texture" },
  Wistful:     { energy: 0.35, bright: 0.45, modeBias: -0.4, density: 0.40, soft: 0.85, axis: "mode" },
  Ethereal:    { energy: 0.35, bright: 0.85, modeBias: 0.3, density: 0.25, soft: 0.95, axis: "density" },
  Passionate:  { energy: 0.80, bright: 0.55, modeBias: -0.1, density: 0.75, soft: 0.25, axis: "energy" },
  Nocturnal:   { energy: 0.40, bright: 0.30, modeBias: -0.5, density: 0.50, soft: 0.7, axis: "mode" },
};

// contradictions — never pair these unless audio strongly supports
const CONTRADICT: Array<[string, string]> = [
  ["Serene", "Chaotic"], ["Serene", "Aggressive"], ["Gentle", "Chaotic"],
  ["Tender", "Gritty"], ["Weightless", "Heavy"], ["Bright", "Dark"],
  ["Euphoric", "Melancholy"], ["Blissful", "Brooding"], ["Radiant", "Haunted"],
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function gauss(actual: number, target: number, width = 0.25) {
  const d = (actual - target) / width;
  return Math.exp(-d * d);
}

const ALL = new Set(MOODS);

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
  const modeNum = mode === "major" ? 1 : mode === "minor" ? -1 : 0;

  // Derive feature targets. Without features, fall back to neutral midpoints
  // and rely on the seed jitter for variety.
  const energy = features ? features.energy / 100 : 0.55;
  const bright = features ? features.brightness : 0.5;
  const density = features ? features.densityScore : 0.5;
  const soft = features ? features.softnessScore : 0.6;
  const aggression = features ? features.aggressionScore : 0.3;

  // Deterministic but varied seed.
  const seed = hash(`${title ?? ""}|${artist ?? ""}|${Math.round(energy * 100)}|${Math.round(bright * 100)}|${keyDetection?.key ?? ""}|${sourceType ?? ""}`);

  const rawScore = (mood: string): number => {
    const p = PROF[mood];
    if (!p) return 0;
    let s = 0;
    s += gauss(energy, p.energy, 0.28) * 1.0;
    s += gauss(bright, p.bright, 0.30) * 0.9;
    s += gauss(density, p.density, 0.30) * 0.7;
    s += gauss(soft, p.soft, 0.35) * 0.5;
    // mode alignment
    s += (1 - Math.abs(modeNum - p.modeBias) * 0.5) * 0.6;
    // raw recording bias
    if (sourceType === "raw_recording") {
      if (mood === "Raw" || mood === "Intimate" || mood === "Reflective" || mood === "Tender" || mood === "Fragile") s += 0.6;
      if (mood === "Euphoric" || mood === "Triumphant" || mood === "Electric") s -= 0.4;
    }
    // pitch nudge for raw vocals
    if (sourceType === "raw_recording" && pitchHz) {
      if (pitchHz < 180 && (mood === "Brooding" || mood === "Velvet")) s += 0.3;
      if (pitchHz > 320 && (mood === "Fragile" || mood === "Ethereal")) s += 0.3;
    }
    // aggression coupling
    if (aggression > 0.6 && (mood === "Gritty" || mood === "Stormy" || mood === "Tense" || mood === "Chaotic")) s += 0.3;
    if (aggression < 0.25 && (mood === "Serene" || mood === "Tender" || mood === "Weightless")) s += 0.25;
    // deterministic jitter so tracks differ
    const j = ((hash(mood + ":" + seed) >>> 0) / 0xffffffff - 0.5) * 0.5;
    return s + j;
  };

  // Score every mood we know about.
  const scored = Object.keys(PROF)
    .filter((m) => ALL.has(m))
    .map((m) => ({ mood: m, score: rawScore(m), axis: PROF[m].axis }))
    .sort((a, b) => b.score - a.score);

  // Pick 1 best per axis where possible, then top up.
  const axes: Axis[] = ["energy", "brightness", "mode", "density", "texture"];
  const picked: string[] = [];
  const usedAxes = new Set<Axis>();

  const conflicts = (m: string) => {
    for (const [a, b] of CONTRADICT) {
      if ((m === a && picked.includes(b)) || (m === b && picked.includes(a))) {
        // allow only if both score very high and audio is genuinely chaotic
        if (aggression < 0.7) return true;
      }
    }
    return false;
  };

  for (const axis of axes) {
    const cand = scored.find((s) => s.axis === axis && !picked.includes(s.mood) && !conflicts(s.mood));
    if (cand) { picked.push(cand.mood); usedAxes.add(axis); }
    if (picked.length >= 4) break;
  }
  // top up to 3-4
  for (const s of scored) {
    if (picked.length >= 4) break;
    if (picked.includes(s.mood)) continue;
    if (conflicts(s.mood)) continue;
    picked.push(s.mood);
  }

  // Always trim to 4 and at least 2.
  return picked.slice(0, 4);
}
