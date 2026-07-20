// Derived "Trait Sheet" for an Aura — collectible-style summary computed
// deterministically from a Track. No new audio DSP; everything comes from
// fields already persisted (energy, moods, key, tempoBand, density, colors,
// motion/texture via mood personality) plus the Aura seed.
//
// Framing: this is a *visual reveal* system, not an NFT. No mint, no chain,
// no re-rolls — one track produces one canonical trait sheet forever.

import type { Track } from "@/lib/tracks";
import {
  getPersonality,
  dominantHueFamilies,
  type AuraPalette,
  type MotionKind,
  type TextureKind,
  type HueFamilyKey,
} from "@/lib/aura";

export type TraitTier = "Common" | "Uncommon" | "Rare" | "Radiant" | "Mythic";

export type Trait = {
  /** short id for keys/analytics */
  id: string;
  /** display label ("Motion", "Palette", "Energy") */
  label: string;
  /** display value ("Tide", "Ember & Jade", "Charged 74") */
  value: string;
  /** 0..1 rarity — higher = rarer */
  rarity: number;
  /** longer explainer for tap/hover */
  detail: string;
};

export type AuraTraits = {
  traits: Trait[];
  rarityScore: number; // 0..1 average of trait rarities (weighted)
  tier: TraitTier;
  tierColor: string; // hex for tier ribbon
  serial: string; // e.g. "#042317"
  signature: string; // "Ember Tide" — reuse of paletteName / auraName
};

// ------------- rarity tables -------------

const MOTION_RARITY: Record<MotionKind, number> = {
  breathe: 0.15,
  pulse: 0.25,
  drift: 0.3,
  tide: 0.55,
  shimmer: 0.7,
  smoke: 0.85,
};

const TEXTURE_RARITY: Record<TextureKind, number> = {
  grain: 0.15,
  smooth: 0.25,
  silk: 0.4,
  mist: 0.55,
  smoke: 0.75,
  ripple: 0.85,
};

const HUE_FAMILY_RARITY: Partial<Record<HueFamilyKey, number>> = {
  blue: 0.2,
  indigo: 0.25,
  violet: 0.3,
  rose: 0.35,
  ember: 0.4,
  amber: 0.4,
  jade: 0.45,
  green: 0.35,
  teal: 0.5,
  cyan: 0.55,
  magenta: 0.65,
  gold: 0.65,
  chartreuse: 0.8,
  red: 0.6,
  onyx: 0.75,
  pearl: 0.8,
  neutral: 0.5,
};

// ------------- helpers -------------

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function toSerial(id: string): string {
  const h = hash32(`serial|${id}`);
  return `#${String(h % 999983).padStart(6, "0")}`;
}

function energyTier(energy: number): { label: string; rarity: number } {
  if (energy <= 20) return { label: `Still · ${energy}`, rarity: 0.8 };
  if (energy <= 50) return { label: `Warm · ${energy}`, rarity: 0.3 };
  if (energy <= 80) return { label: `Charged · ${energy}`, rarity: 0.15 };
  return { label: `Volatile · ${energy}`, rarity: 0.85 };
}

function densityFrom(track: Track): { label: string; rarity: number } {
  const d = (track.density || "").toLowerCase();
  if (d.includes("sparse") || d.includes("air")) return { label: "Sparse", rarity: 0.6 };
  if (d.includes("dense") || d.includes("thick")) return { label: "Dense", rarity: 0.45 };
  if (d.includes("overgrown") || d.includes("full")) return { label: "Overgrown", rarity: 0.85 };
  return { label: "Balanced", rarity: 0.2 };
}

function tempoBand(track: Track): { label: string; rarity: number } {
  const t = (track.tempoBand || "").toLowerCase();
  if (t.startsWith("slow") || t === "ballad") return { label: "Ballad", rarity: 0.35 };
  if (t.startsWith("fast") || t === "frenzy") return { label: "Frenzy", rarity: 0.75 };
  if (t.startsWith("mid") || t === "groove") return { label: "Groove", rarity: 0.2 };
  return { label: "Drive", rarity: 0.3 };
}

function paletteFamilyTrait(colors: AuraPalette | undefined): {
  label: string;
  rarity: number;
  families: HueFamilyKey[];
} {
  if (!colors) return { label: "Uncharted", rarity: 0.9, families: [] };
  const fams = dominantHueFamilies(colors);
  const primary = fams[0] ?? "neutral";
  const primaryRarity = HUE_FAMILY_RARITY[primary] ?? 0.5;
  if (fams.length >= 2) {
    const label = `${cap(primary)} & ${cap(fams[1])}`;
    // splits are always rarer than either single family
    const combined = Math.min(0.95, Math.max(primaryRarity, HUE_FAMILY_RARITY[fams[1]] ?? 0.5) + 0.2);
    return { label, rarity: combined, families: fams };
  }
  return { label: cap(primary), rarity: primaryRarity, families: fams };
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function keySignature(track: Track): { label: string; rarity: number } {
  const tonic = track.tonic ?? track.detectedKey ?? track.musicalKey ?? "";
  const mode = track.mode ?? "";
  if (!tonic) return { label: "Untuned", rarity: 0.7 };
  const label = mode ? `${tonic} ${mode}` : tonic;
  // Sharp/flat keys are less common than C/G/D/A/F majors
  const isSharpFlat = /[#♯♭b]/.test(tonic);
  const isMinor = mode === "minor";
  let rarity = 0.25;
  if (isSharpFlat) rarity += 0.2;
  if (isMinor) rarity += 0.1;
  return { label, rarity: Math.min(0.85, rarity) };
}

function tierFromScore(score: number): { tier: TraitTier; color: string } {
  if (score >= 0.72) return { tier: "Mythic", color: "#f5c15a" };
  if (score >= 0.58) return { tier: "Radiant", color: "#c48bff" };
  if (score >= 0.44) return { tier: "Rare", color: "#5cc7ff" };
  if (score >= 0.3) return { tier: "Uncommon", color: "#7be0a3" };
  return { tier: "Common", color: "#a8afbd" };
}

// ------------- main -------------

export function computeAuraTraits(track: Track): AuraTraits {
  const p = getPersonality(track.palette);
  const motion = p.motion;
  const texture = p.texture;

  const pal = paletteFamilyTrait(track.colors);
  const energy = energyTier(track.energy ?? 50);
  const density = densityFrom(track);
  const tempo = tempoBand(track);
  const key = keySignature(track);

  const traits: Trait[] = [
    {
      id: "palette",
      label: "Palette",
      value: pal.label,
      rarity: pal.rarity,
      detail:
        pal.families.length >= 2
          ? "A two-hue split — the aura pulls between two color families instead of one."
          : "The dominant color family this aura settled into.",
    },
    {
      id: "motion",
      label: "Motion",
      value: cap(motion),
      rarity: MOTION_RARITY[motion],
      detail: `How the orb moves. "${cap(motion)}" is how this track breathes.`,
    },
    {
      id: "texture",
      label: "Texture",
      value: cap(texture),
      rarity: TEXTURE_RARITY[texture],
      detail: `The surface of the aura — how light sits on it.`,
    },
    {
      id: "energy",
      label: "Energy",
      value: energy.label,
      rarity: energy.rarity,
      detail: "Detected loudness and transient intensity blended together.",
    },
    {
      id: "density",
      label: "Density",
      value: density.label,
      rarity: density.rarity,
      detail: "How full the frequency spectrum is — sparse tracks feel open, dense tracks feel packed.",
    },
    {
      id: "tempo",
      label: "Tempo",
      value: tempo.label,
      rarity: tempo.rarity,
      detail: "The rhythmic register the analyzer locked onto.",
    },
    {
      id: "key",
      label: "Key",
      value: key.label,
      rarity: key.rarity,
      detail: "The musical key detected from the audio.",
    },
  ];

  // Weight rare traits a little heavier so a single mythic drag lifts the tier
  const weighted = traits.reduce((acc, t) => acc + Math.pow(t.rarity, 0.9), 0) / traits.length;
  const rarityScore = Math.min(0.99, weighted);
  const { tier, color } = tierFromScore(rarityScore);

  return {
    traits,
    rarityScore,
    tier,
    tierColor: color,
    serial: toSerial(track.id),
    signature: track.paletteName || track.auraName || "Untitled Aura",
  };
}
