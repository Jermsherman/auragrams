import { toEnergyPercent } from "./energy";

// Song Personality Profile — the AI interpretation layer that lives ON TOP
// of the deterministic audio pipeline. Generated once per Aura, cached on the
// row, never re-rolled. Same song, same story, forever.

export const INSIGHT_FIELDS = [
  "key",
  "bpm",
  "feel",
  "lufs",
  "lra",
  "level_span",
  "low_end",
  "width",
  "sections",
  "moment",
  "tension",
  "fingerprint",
  "vocals",
  "centroid",
] as const;

export type InsightField = (typeof INSIGHT_FIELDS)[number];

export type EmotionalDNAEntry = {
  emotion: string;
  why: string;
  evidence: InsightField[];
};

export type PersonalityTraitEntry = {
  trait: string;
  why: string;
  evidence: InsightField[];
};

export type AuraInsight = {
  auraName: string;
  /** Written by the artist, not the model. Empty until they write it. */
  story?: string;
  emotionalDNA: EmotionalDNAEntry[];
  personalityTraits: PersonalityTraitEntry[];
  visualMeaning: string;
  /** ISO string. Only set after a successful generation. */
  generatedAt?: string;
  /** Model id used, purely for diagnostics. */
  model?: string;
};

/** Runtime shape guard — an object read from the DB is trustworthy only if it
 *  actually has the six fields we render. */
export function isAuraInsight(x: unknown): x is AuraInsight {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.auraName === "string" &&
    Array.isArray(o.emotionalDNA) &&
    Array.isArray(o.personalityTraits) &&
    typeof o.visualMeaning === "string"
  );
}

/** Clamp arbitrary model output into a safe, predictable shape before we
 *  persist or render it. Length caps are enforced here, not in the model
 *  schema (per AI-SDK guidance — schema constraints crash calls). */
function evidenceOf(raw: unknown): InsightField[] | null {
  if (!Array.isArray(raw)) return null;
  const ids = raw.filter((id): id is InsightField =>
    typeof id === "string" && (INSIGHT_FIELDS as readonly string[]).includes(id),
  );
  return ids.length > 0 ? ids : null;
}

export function normalizeInsight(raw: unknown): AuraInsight | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const clamp = (s: unknown, max: number): string => {
    if (typeof s !== "string") return "";
    const t = s.trim().replace(/\s+/g, " ");
    return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : t;
  };

  const auraName = clamp(o.auraName ?? o.aura_name, 48);
  // The story is artist-written; we only ever pass through an existing one.
  const story = clamp(o.story, 420);
  const visualEvidence = evidenceOf(o.visualEvidence ?? o.visual_evidence);
  const visualMeaning = visualEvidence ? clamp(o.visualMeaning ?? o.visual_meaning, 360) : "";

  const rawDNA = (o.emotionalDNA ?? o.emotional_dna) as unknown;
  const emotionalDNA: EmotionalDNAEntry[] = Array.isArray(rawDNA)
    ? rawDNA
        .map((e) => {
          if (!e || typeof e !== "object") return null;
          const row = e as Record<string, unknown>;
          const emotion = clamp(row.emotion, 32);
          const why = clamp(row.why ?? row.reason, 180);
          const evidence = evidenceOf(row.evidence);
          if (!emotion || !why || !evidence) return null;
          return { emotion, why, evidence };
        })
        .filter((x): x is EmotionalDNAEntry => !!x)
        .slice(0, 3)
    : [];

  const rawTraits = (o.personalityTraits ?? o.personality_traits) as unknown;
  const personalityTraits: PersonalityTraitEntry[] = Array.isArray(rawTraits)
    ? rawTraits
        .map((e) => {
          if (!e || typeof e !== "object") return null;
          const row = e as Record<string, unknown>;
          const trait = clamp(row.trait ?? row.name, 24);
          const why = clamp(row.why ?? row.reason, 160);
          const evidence = evidenceOf(row.evidence);
          if (!trait || !why || !evidence) return null;
          return { trait, why, evidence };
        })
        .filter((x): x is PersonalityTraitEntry => !!x)
        .slice(0, 5)
    : [];

  if (!auraName || emotionalDNA.length === 0 || personalityTraits.length === 0) {
    return null;
  }
  return {
    auraName,
    story: story || undefined,
    emotionalDNA,
    personalityTraits,
    visualMeaning,
  };
}

/** Palette + audio-feature payload the server fn sends to the model. */
export type InsightPromptInput = {
  trackTitle: string;
  artistName?: string;
  paletteKey: string;
  paletteName?: string;
  moodTags: string[];
  musicalKey?: string;
  tempoBand?: string;
  density?: string;
  energyLevel?: number;
  motionKeywords?: string[];
  swatches?: string[];
  motion?: string;
  texture?: string;
};

export const INSIGHT_SYSTEM_PROMPT = [
  "You write a short read of a song from measured audio only.",
  "You are given numbers, units, and confidence. You do not receive a palette, a mood label, or a density.",
  "",
  "Rules:",
  "- Use only the measured fields. Do not invent a number, a key, a tempo, or a vocal.",
  "- If key.display is \"Key unclear\" or vocals.status is \"not_sure\", say that. Do not guess.",
  "- Every why and the visualMeaning must include an evidence array of field ids from the payload.",
  "- A sentence with no evidence will be deleted. Do not write it.",
  "- No astrology, no claims about the artist's life, gender, or race.",
  "- Temperature is low. Be plain.",
  "",
  "Return STRICT JSON:",
  '{"auraName":"...","emotionalDNA":[{"emotion":"...","why":"...","evidence":["bpm"]}],',
  '"personalityTraits":[{"trait":"...","why":"...","evidence":["lufs"]}],',
  '"visualMeaning":"...","visualEvidence":["key","bpm"]}',
  "",
  "Allowed evidence ids: key, bpm, feel, lufs, lra, level_span, low_end, width, sections, moment, tension, fingerprint, vocals, centroid.",
  "auraName is 2-4 words and is a label, not a measurement. Do not write a story field.",
].join("\n");

export type MeasuredInsight = {
  trackTitle: string;
  artistName?: string;
  key: string;
  keyConfidence: number | null;
  keyChanges: string[];
  bpm: number | null;
  bpmConfidence: number | null;
  feel: string | null;
  tempoLabel: string | null;
  integratedLufs: number | null;
  loudnessRangeLu: number | null;
  levelSpanLu: number | null;
  lowEndShare: number | null;
  width: string | null;
  sections: string[];
  moment: string | null;
  tensionPeak: string | null;
  fingerprint: string[];
  vocals: string;
  centroidHz: number | null;
};

export function buildInsightUserPrompt(input: InsightPromptInput | MeasuredInsight): string {
  if ("key" in input && "vocals" in input) {
    return [
      "Write the JSON. Use only these measurements. Cite their ids in evidence.",
      JSON.stringify(input, null, 2),
    ].join("\n");
  }
  return buildLegacyInsightPrompt(input);
}

function buildLegacyInsightPrompt(input: InsightPromptInput): string {
  const {
    trackTitle,
    artistName,
    paletteKey,
    paletteName,
    moodTags,
    musicalKey,
    tempoBand,
    density,
    energyLevel,
    motionKeywords,
    swatches,
    motion,
    texture,
  } = input;
  const payload = {
    trackTitle,
    artistName: artistName || undefined,
    aura: {
      paletteKey,
      paletteName: paletteName || paletteKey,
      dominantColors: swatches?.slice(0, 4) ?? [],
      motion: motion ?? undefined,
      texture: texture ?? undefined,
    },
    audio: {
      musicalKey: musicalKey ?? "unknown",
      tempoBand: tempoBand ?? "unknown",
      density: density ?? "unknown",
      energyPercent: typeof energyLevel === "number" ? toEnergyPercent(energyLevel) : undefined,
    },
    moodTags,
    motionKeywords: motionKeywords ?? [],
  };
  return [
    "Interpret this Aura. Return ONLY the JSON described in the system message.",
    "",
    "Measured audio + palette features:",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}
