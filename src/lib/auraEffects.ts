// Atmospheric effect selection for an Aura's orb.
//
// One effect per Aura, picked deterministically from mood + energy + palette
// (+ seed as a tiebreaker) so the same Aura always renders the same way.

export type AuraEffect = "smoke" | "water" | "ember" | "lightning";

export type EffectInput = {
  moods?: string[];
  /** 0..100 */
  energy?: number;
  palette?: string;
  seed?: number;
};

export const EFFECT_LABEL: Record<AuraEffect, string> = {
  smoke: "Smoke",
  water: "Water",
  ember: "Ember",
  lightning: "Lightning",
};

export const EFFECT_DESCRIPTION: Record<AuraEffect, string> = {
  smoke: "Slow drifting wisps — low, ambient, weightless.",
  water: "Travelling ripples — soft, dreamy, fluid.",
  ember: "Rising sparks and heat shimmer — warm and driven.",
  lightning: "Rare arcs on hard transients — dark and charged.",
};

const LOWER = (s: string) => s.toLowerCase();

const WATER_WORDS = ["dreamy", "coastal", "reflective", "ethereal", "calm", "ambient", "hopeful", "heavenly", "spiritual", "chill", "float", "ocean", "aquatic"];
const EMBER_WORDS = ["warm", "energetic", "euphoric", "triumphant", "cinematic", "romantic", "intimate", "playful", "uplifting", "anthemic", "sunny"];
const LIGHTNING_WORDS = ["tense", "dark", "aggressive", "intense", "hype", "rage", "chaotic", "industrial", "hard", "electric", "seductive"];
const SMOKE_WORDS = ["melancholy", "nostalgic", "lonely", "mysterious", "bittersweet", "hazy", "somber", "moody", "sad", "smoky"];

function scoreWords(moods: string[], words: string[]) {
  let n = 0;
  for (const m of moods) {
    const lm = LOWER(m);
    for (const w of words) if (lm.includes(w)) n += 1;
  }
  return n;
}

/** Deterministic effect choice. Never random. */
export function pickAuraEffect(input: EffectInput): AuraEffect {
  const moods = (input.moods ?? []).filter(Boolean);
  const palette = LOWER(input.palette ?? "");
  const pool = [...moods, palette];
  const energy = typeof input.energy === "number" ? input.energy : 50;

  const scores: Record<AuraEffect, number> = {
    smoke: scoreWords(pool, SMOKE_WORDS),
    water: scoreWords(pool, WATER_WORDS),
    ember: scoreWords(pool, EMBER_WORDS),
    lightning: scoreWords(pool, LIGHTNING_WORDS),
  };

  // Energy bias — keeps low-energy tracks calm and high-energy tracks hot.
  if (energy < 34) {
    scores.smoke += 1.2;
    scores.water += 0.6;
  } else if (energy < 62) {
    scores.water += 1.0;
    scores.smoke += 0.3;
  } else if (energy < 82) {
    scores.ember += 1.2;
  } else {
    scores.ember += 0.9;
    scores.lightning += 1.1;
  }

  const order: AuraEffect[] = ["smoke", "water", "ember", "lightning"];
  let best: AuraEffect = order[0];
  let bestScore = -Infinity;
  for (const k of order) {
    if (scores[k] > bestScore) {
      bestScore = scores[k];
      best = k;
    }
  }

  // Tiebreak with the seed so identical scores still resolve deterministically.
  const tied = order.filter((k) => Math.abs(scores[k] - bestScore) < 0.001);
  if (tied.length > 1) {
    const seed = Math.abs(Math.floor(input.seed ?? 0));
    best = tied[seed % tied.length];
  }
  return best;
}
