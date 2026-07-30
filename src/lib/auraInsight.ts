// Song Personality Profile — the AI interpretation layer that lives ON TOP
// of the deterministic audio pipeline. Generated once per Aura, cached on the
// row, never re-rolled. Same song, same story, forever.

export type EmotionalDNAEntry = {
  emotion: string;
  why: string;
};

export type PersonalityTraitEntry = {
  trait: string;
  why: string;
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
  const visualMeaning = clamp(o.visualMeaning ?? o.visual_meaning, 360);

  const rawDNA = (o.emotionalDNA ?? o.emotional_dna) as unknown;
  const emotionalDNA: EmotionalDNAEntry[] = Array.isArray(rawDNA)
    ? rawDNA
        .map((e) => {
          if (!e || typeof e !== "object") return null;
          const row = e as Record<string, unknown>;
          const emotion = clamp(row.emotion, 32);
          const why = clamp(row.why ?? row.reason, 180);
          if (!emotion || !why) return null;
          return { emotion, why };
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
          if (!trait || !why) return null;
          return { trait, why };
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
  "You are Auragram's Aura Interpreter. You listen to a song's measured audio identity",
  "and write a short, cinematic 'song personality profile' as if the song were a person.",
  "",
  "Voice rules:",
  "- Emotional and specific. Never generic. NEVER use bare adjectives like",
  "  'energetic', 'sad', 'catchy', 'upbeat', 'chill', 'fire', 'banger' without expanding",
  "  them into a real image or feeling.",
  "- No hype language, no astrology, no 'this song is a vibe'.",
  "- Never make claims about the artist as a person, their gender, race, or life.",
  "- Write about the song, not the listener's identity.",
  "- Every sentence must be grounded in the measured audio features you were given.",
  "- Keep it human. Short sentences. Concrete images. One good detail beats three vague ones.",
  "",
  "Return STRICT JSON only, with this exact shape:",
  '{"auraName":"...","emotionalDNA":[{"emotion":"...","why":"..."}],',
  '"personalityTraits":[{"trait":"...","why":"..."}],"visualMeaning":"..."}',
  "",
  "Field requirements:",
  "- auraName: 2-4 words, cinematic title (e.g. 'Midnight Confession', 'Golden Memories',",
  "  'Neon Heartbreak'). Not the track title. Never a single generic word.",
  "- Do NOT write a story field. The artist writes the Aura Story themselves.",
  "- emotionalDNA: 2-3 entries. Each 'emotion' is one word or short phrase; each 'why'",
  "  is a single sentence explaining that emotion in human language (not 'sad' — 'a",
  "  quiet ache that isn't asking to be fixed').",
  "- personalityTraits: 3-5 entries. Each 'trait' is an archetype noun (Dreamer, Rebel,",
  "  Storyteller, Romantic, Fighter, Wanderer, Confidant, Believer...); 'why' is one",
  "  sentence tied to the audio features.",
  "- visualMeaning: 2-3 sentences tying the orb's palette, motion, and texture to the",
  "  emotional read. Reference the actual palette name / motion / texture you were given.",
].join("\n");

export function buildInsightUserPrompt(input: InsightPromptInput): string {
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
      energyPercent: typeof energyLevel === "number"
        ? Math.round(energyLevel <= 1 ? energyLevel * 100 : energyLevel)
        : undefined,
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
