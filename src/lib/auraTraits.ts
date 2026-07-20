// Deterministic "Trait Sheet" for an Aura — a collectible-style summary
// computed purely from measured audio features + palette personality.
//
// Design tenets (see .lovable/plan.md):
//   • Same song → same sheet, for anyone, forever. No randomness, no rerolls.
//   • Serial is derived from the *music*, not the aura row id.
//   • Palette is a signature, not a rarity — we don't claim rarity we haven't
//     measured against a population.
//   • Rarity is descriptive of the *sound*, not of luck.
//
// One track produces one canonical trait sheet. Never a pack, never a re-roll.

import {
  getPersonality,
  dominantHueFamilies,
  type AuraPalette,
  type MotionKind,
  type TextureKind,
  type PaletteKey,
} from "@/lib/aura";

export type TraitInput = {
  id: string;
  palette: PaletteKey;
  colors?: AuraPalette;
  energy?: number;
  energyLevel?: number;
  musicalKey?: string;
  tempoBand?: string;
  density?: string;
  tonic?: string;
  mode?: "major" | "minor";
  detectedKey?: string;
  paletteName?: string;
  auraName?: string;
};

export type TraitTier = "Common" | "Uncommon" | "Rare" | "Radiant" | "Mythic";

export type Trait = {
  id: string;
  /** short evocative label — "Hue", "Cadence", "Grain"… */
  label: string;
  /** human value shown on the tile — "Ember & Jade", "Tide", "Charged · 74" */
  value: string;
  /** 0..1 uncommonness of *this measurement*, not of a random roll. */
  rarity: number;
  /** 1-sentence explainer, templated with the actual measured value. */
  detail: string;
};

export type AuraTraits = {
  traits: Trait[];
  rarityScore: number;
  tier: TraitTier;
  tierColor: string;
  serial: string;
  signature: string;
};

// ---------- rarity tables (uncommonness of the sonic feature) ----------

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

// ---------- deterministic hashing ----------

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Serial is derived from measurable properties of the *music*, so the same
 *  song always yields the same serial regardless of who uploaded it. */
function toSerial(t: TraitInput): string {
  const energy = Math.round((t.energy ?? t.energyLevel ?? 50) / 10);
  const tonic = t.tonic ?? t.detectedKey ?? t.musicalKey ?? "";
  const mode = t.mode ?? "";
  const band = (t.tempoBand ?? "").toLowerCase();
  const density = (t.density ?? "").toLowerCase();
  const colorKey = (t.colors ?? [])
    .slice(0, 3)
    .map((c) => (typeof c === "string" ? c.toLowerCase() : ""))
    .join("|");
  const key = `s|${t.palette}|${tonic}|${mode}|${band}|${density}|${energy}|${colorKey}`;
  const h = hash32(key);
  return `#${String(h % 999983).padStart(6, "0")}`;
}

// ---------- individual traits ----------

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Uncommonness curve: 0 at the population mean (~55), rising toward the
 *  edges, but *labeled* descriptively so "quiet" and "loud" get different
 *  names — no fake symmetry. */
function chargeTrait(energy: number): { value: string; rarity: number; detail: string } {
  const e = Math.max(0, Math.min(100, Math.round(energy)));
  const distance = Math.abs(e - 55) / 55; // 0..~0.82
  const rarity = Math.min(0.85, Math.pow(distance, 1.2) + 0.12);
  let name: string;
  let feel: string;
  if (e <= 20) {
    name = "Still";
    feel = "quiet and unhurried — room for every breath.";
  } else if (e <= 45) {
    name = "Warm";
    feel = "low-simmer energy that keeps you in the pocket.";
  } else if (e <= 70) {
    name = "Charged";
    feel = "confident momentum — the middle where songs land.";
  } else if (e <= 88) {
    name = "Blazing";
    feel = "high transient intensity, driving hard.";
  } else {
    name = "Volatile";
    feel = "peaks near the ceiling — this track burns.";
  }
  return {
    value: `${name} · ${e}`,
    rarity,
    detail: `Charge ${e}/100 — ${feel}`,
  };
}

function weightTrait(density?: string): { value: string; rarity: number; detail: string } {
  const d = (density ?? "").toLowerCase();
  if (d.includes("sparse") || d.includes("air"))
    return {
      value: "Sparse",
      rarity: 0.6,
      detail: "Wide gaps between elements — a lot of space to breathe.",
    };
  if (d.includes("overgrown") || d.includes("full"))
    return {
      value: "Overgrown",
      rarity: 0.85,
      detail: "Every band of the spectrum is speaking — dense to the edges.",
    };
  if (d.includes("dense") || d.includes("thick"))
    return {
      value: "Dense",
      rarity: 0.45,
      detail: "A packed spectrum — layered, close, filled in.",
    };
  return {
    value: "Balanced",
    rarity: 0.2,
    detail: "Mid-range fullness — nothing crowded, nothing hollow.",
  };
}

function pulseTrait(band?: string): { value: string; rarity: number; detail: string } {
  const b = (band ?? "").toLowerCase();
  if (b.startsWith("slow") || b === "ballad")
    return { value: "Ballad", rarity: 0.35, detail: "Long, patient phrasing — under head-nod tempo." };
  if (b.startsWith("fast") || b === "frenzy")
    return { value: "Frenzy", rarity: 0.75, detail: "Racing pulse — up in the run-out register." };
  if (b.startsWith("mid") || b === "groove")
    return { value: "Groove", rarity: 0.2, detail: "Mid-body tempo — the head-nod range songs live in." };
  return { value: "Drive", rarity: 0.3, detail: "Steady forward momentum without breaking into a run." };
}

function rootTrait(t: TraitInput): { value: string; rarity: number; detail: string } {
  const tonic = t.tonic ?? t.detectedKey ?? t.musicalKey ?? "";
  const mode = t.mode ?? "";
  if (!tonic)
    return {
      value: "Untuned",
      rarity: 0.7,
      detail: "No clear tonal center detected — likely percussive or noise-forward.",
    };
  const label = mode ? `${tonic} ${mode}` : tonic;
  const isSharpFlat = /[#♯♭b]/.test(tonic);
  const isMinor = mode === "minor";
  let rarity = 0.25;
  if (isSharpFlat) rarity += 0.2;
  if (isMinor) rarity += 0.1;
  const mood =
    isMinor && isSharpFlat
      ? "sharp-key minor — tense, off-center, tends melancholic."
      : isMinor
        ? "minor key — leans introspective."
        : isSharpFlat
          ? "sharp/flat major — bright but slightly off the common center."
          : "natural major — the most-used tonal center in popular music.";
  return {
    value: label,
    rarity: Math.min(0.85, rarity),
    detail: `Root ${label} — ${mood}`,
  };
}

function hueTrait(colors: AuraPalette | undefined): {
  value: string;
  detail: string;
} {
  if (!colors) return { value: "Uncharted", detail: "No dominant hue family recovered." };
  const fams = dominantHueFamilies(colors);
  const primary = fams[0] ?? "neutral";
  if (fams.length >= 2) {
    const sec = fams[1];
    return {
      value: `${cap(primary)} & ${cap(sec)}`,
      detail: `A two-hue split — the aura pulls between ${primary} and ${sec} instead of settling on one.`,
    };
  }
  return {
    value: cap(primary),
    detail: `A single dominant family — ${primary} runs through the whole aura.`,
  };
}

function tierFromScore(score: number): { tier: TraitTier; color: string } {
  if (score >= 0.7) return { tier: "Mythic", color: "#f5c15a" };
  if (score >= 0.56) return { tier: "Radiant", color: "#c48bff" };
  if (score >= 0.42) return { tier: "Rare", color: "#5cc7ff" };
  if (score >= 0.28) return { tier: "Uncommon", color: "#7be0a3" };
  return { tier: "Common", color: "#a8afbd" };
}

// ---------- main ----------

export function computeAuraTraits(track: TraitInput): AuraTraits {
  const p = getPersonality(track.palette);
  const motion = p.motion;
  const texture = p.texture;

  const hue = hueTrait(track.colors);
  const charge = chargeTrait(track.energy ?? track.energyLevel ?? 50);
  const weight = weightTrait(track.density);
  const pulse = pulseTrait(track.tempoBand);
  const root = rootTrait(track);

  // Ordered for reveal: signature identity first, then motion/grain, then
  // measured intensities, then musical root.
  const traits: Trait[] = [
    {
      id: "hue",
      label: "Hue",
      value: hue.value,
      // Hue is a signature — we don't claim rarity for palette taste. Use a
      // neutral value so it doesn't skew the tier score.
      rarity: 0.25,
      detail: hue.detail,
    },
    {
      id: "cadence",
      label: "Cadence",
      value: cap(motion),
      rarity: MOTION_RARITY[motion],
      detail: `${cap(motion)} — how this aura moves. Read off the palette's inner behavior.`,
    },
    {
      id: "grain",
      label: "Grain",
      value: cap(texture),
      rarity: TEXTURE_RARITY[texture],
      detail: `${cap(texture)} — how light sits on the surface of the aura.`,
    },
    {
      id: "charge",
      label: "Charge",
      value: charge.value,
      rarity: charge.rarity,
      detail: charge.detail,
    },
    {
      id: "weight",
      label: "Weight",
      value: weight.value,
      rarity: weight.rarity,
      detail: weight.detail,
    },
    {
      id: "pulse",
      label: "Pulse",
      value: pulse.value,
      rarity: pulse.rarity,
      detail: pulse.detail,
    },
    {
      id: "root",
      label: "Root",
      value: root.value,
      rarity: root.rarity,
      detail: root.detail,
    },
  ];

  // Tier = blend of mean rarity + the top-two outliers, so a single genuine
  // outlier can lift the sheet without letting seven mid values drag it down.
  const mean = traits.reduce((a, t) => a + t.rarity, 0) / traits.length;
  const sorted = [...traits].map((t) => t.rarity).sort((a, b) => b - a);
  const topTwo = (sorted[0] + sorted[1]) / 2;
  const rarityScore = Math.min(0.99, mean * 0.6 + topTwo * 0.4);
  const { tier, color } = tierFromScore(rarityScore);

  return {
    traits,
    rarityScore,
    tier,
    tierColor: color,
    serial: toSerial(track),
    signature: track.paletteName || track.auraName || "Untitled Aura",
  };
}
