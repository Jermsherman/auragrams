import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STORY_FRAGMENTS } from "./storyLibrary";
import {
  composeFromFacts,
  composeRead,
  factsFromAnalysis,
  type StorySource,
} from "./story";

const KEY_NAME = /\b[A-G](#|b)? (major|minor)\b/;
const VOCAL_WORD = /\b(vocals?|voices?|singer|sung|singing|lyrics?|choir|rap)\b/i;

function source(patch: Partial<StorySource> & { contentHash: string }): StorySource {
  const base: StorySource = {
    contentHash: patch.contentHash,
    durationSec: 96,
    bpm: 120,
    bpmConfidence: 0.9,
    feel: "straight",
    swingRatio: null,
    tempoLabel: "Fast",
    key: { label: "C major", display: "C major", confidence: 0.8, mode: "major", changes: [] },
    loudness: { integratedLufs: -14, levelSpanLu: 6 },
    energyCurve: Array.from({ length: 12 }, (_, i) => ({ t: i * 8, lufs: -18 })),
    lowEnd: { shareBelow120Hz: 0.3 },
    width: { label: "narrow" },
    sections: [
      { startSec: 0, endSec: 24, label: "Intro" },
      { startSec: 24, endSec: 48, label: "Build" },
      { startSec: 48, endSec: 96, label: "Drop" },
    ],
    moment: { startSec: 48, durationSec: 8 },
    auraName: "Azure Pulse",
    fingerprint: [{ id: "lufs", value: -14 }],
  };
  return {
    ...base,
    ...patch,
    key: { ...base.key, ...patch.key },
    loudness: { ...base.loudness, ...patch.loudness },
    lowEnd: { ...base.lowEnd, ...patch.lowEnd },
    width: { ...base.width, ...patch.width },
  };
}

function curve(shape: "rise" | "fall" | "flat" | "early"): { t: number; lufs: number }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const t = i * 8;
    const lufs = shape === "flat" ? -16 : shape === "rise" ? -24 + i : shape === "fall" ? -10 - i * 0.8 : i < 3 ? -8 : -20;
    return { t, lufs };
  });
}

function sentences(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function trigrams(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const grams = new Set<string>();
  for (let i = 0; i < words.length - 2; i++) grams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  return grams;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const gram of a) if (b.has(gram)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

describe("measured read", () => {
  it("keeps a few hundred tagged fragments, each unique", () => {
    assert.ok(STORY_FRAGMENTS.length >= 300, `library ${STORY_FRAGMENTS.length}`);
    const texts = new Set(STORY_FRAGMENTS.map((fragment) => fragment.text));
    assert.equal(texts.size, STORY_FRAGMENTS.length);
    for (const fragment of STORY_FRAGMENTS) {
      assert.ok(fragment.text.length > 8, fragment.id);
      if (fragment.text.includes("{key}")) assert.ok(fragment.tags.includes("key:named"), fragment.id);
      if (fragment.text.includes("{bpm}")) assert.ok(fragment.tags.includes("tempo:known"), fragment.id);
      if (fragment.role !== "vocal") assert.equal(VOCAL_WORD.test(fragment.text), false, fragment.text);
    }
  });

  it("does not name a key below 0.30 confidence and does not invent vocals", () => {
    const hidden = source({
      contentHash: "a".repeat(64),
      key: { label: "F# minor", display: "F# minor", confidence: 0.22, mode: "minor", changes: [] },
      auraName: "Haze Drift",
    });
    const story = composeRead(hidden, null, 0);
    assert.equal(KEY_NAME.test(story.text), false, story.text);
    assert.match(story.text, /key (remains |stays )?unclear|Key unclear|unnamed|veiled/i);
    assert.equal(VOCAL_WORD.test(story.text), false, story.text);

    const quietPulse = source({
      contentHash: "b".repeat(64),
      bpm: 137,
      bpmConfidence: 0.1,
      tempoLabel: "Unclear",
      feel: "unclear",
    });
    const unclearTempo = composeRead(quietPulse, null, 0);
    assert.equal(/\b137\b/.test(unclearTempo.text), false, unclearTempo.text);

    const reported = composeRead(hidden, true, 0);
    assert.match(reported.text, /artist/i);
    assert.match(reported.text, /vocal/i);
    const instrumental = composeRead(hidden, false, 0);
    assert.match(instrumental.text, /no vocals/i);
  });

  it("is deterministic, and another take keeps the facts while changing the prose", () => {
    const track = source({ contentHash: "c".repeat(64), bpm: 96, tempoLabel: "Mid", auraName: "Amber Drift" });
    const first = composeRead(track, null, 0);
    const again = composeRead(track, null, 0);
    const next = composeRead(track, null, 1);
    assert.equal(first.text, again.text);
    assert.notEqual(first.text, next.text);
    assert.match(first.text, /96 BPM/);
    assert.match(next.text, /96 BPM/);
    assert.equal(first.voice, next.voice);
    const otherSong = composeRead(source({ contentHash: "d".repeat(64), bpm: 96, tempoLabel: "Mid", auraName: "Amber Drift" }), null, 0);
    assert.notEqual(first.text, otherSong.text);
  });

  it("varies the prose across different measured songs", () => {
    const shapes = ["rise", "fall", "flat", "early"] as const;
    const tempos = [
      { bpm: 72, tempoLabel: "Slow" as const, feel: "straight" as const },
      { bpm: 100, tempoLabel: "Mid" as const, feel: "swung" as const, swingRatio: 0.66 },
      { bpm: 140, tempoLabel: "Fast" as const, feel: "straight" as const },
      { bpm: 88, tempoLabel: "Slow" as const, feel: "unclear" as const },
    ];
    const keys = [
      { label: "A minor", display: "A minor", confidence: 0.9, mode: "minor" as const, changes: [] },
      { label: "E major", display: "E major", confidence: 0.84, mode: "major" as const, changes: [] },
      { label: "D minor", display: "D minor", confidence: 0.4, mode: "minor" as const, changes: [{ atSec: 40, label: "F major" }] },
      { label: "F# minor", display: "F# minor", confidence: 0.12, mode: "minor" as const, changes: [] },
    ];
    const names = ["Crimson Pulse", "Verdant Hush", "Indigo Drift", "Azure Glint", "Gold Swing", "Ash Hush"];
    const widths = ["wide", "mono", "narrow", "unknown"] as const;
    const stories: string[] = [];
    for (let i = 0; i < 24; i++) {
      const tempo = tempos[i % tempos.length];
      const key = keys[i % keys.length];
      const intro = 8 + i;
      const build = intro + 16 + (i % 7);
      const drop = build + 18 + (i % 5);
      const story = composeRead(
        source({
          contentHash: `${i.toString(16).padStart(2, "0")}${"e".repeat(62)}`,
          ...tempo,
          bpm: tempo.bpm + i,
          key,
          auraName: names[i % names.length],
          durationSec: drop + 20,
          width: { label: widths[i % widths.length] },
          loudness: { integratedLufs: -27 + i * 0.6, levelSpanLu: 1.5 + i * 0.7 },
          lowEnd: { shareBelow120Hz: 0.08 + i * 0.03 },
          energyCurve: curve(shapes[i % shapes.length]),
          moment: { startSec: 4 + i * 3, durationSec: 8 },
          sections:
            i % 3 === 0
              ? [{ startSec: 0, endSec: drop, label: "Section" }]
              : [
                  { startSec: 0, endSec: intro, label: "Intro" },
                  { startSec: intro, endSec: build, label: "Build" },
                  { startSec: build, endSec: drop, label: "Drop" },
                ],
          fingerprint: [{ id: "i", value: i }],
        }),
        null,
        0,
      );
      const lines = sentences(story.text);
      assert.equal(new Set(lines).size, lines.length, `repeated sentence inside story ${i}: ${story.text}`);
      stories.push(story.text);
      if (key.confidence < 0.3) assert.equal(KEY_NAME.test(story.text), false, story.text);
      else assert.match(story.text, new RegExp(key.label.replace("#", "\\#")));
    }
    const all = stories.flatMap(sentences);
    const unique = new Set(all);
    const ratio = unique.size / all.length;
    assert.ok(ratio >= 0.75, `distinct-sentence ratio ${ratio.toFixed(3)} (${unique.size}/${all.length})`);
    const grams = stories.map(trigrams);
    let overlap = 0;
    let pairs = 0;
    for (let i = 0; i < grams.length; i++) {
      for (let j = i + 1; j < grams.length; j++) {
        overlap += jaccard(grams[i], grams[j]);
        pairs++;
      }
    }
    const mean = overlap / pairs;
    assert.ok(mean <= 0.28, `mean trigram overlap ${mean.toFixed(3)}`);
    const facts = factsFromAnalysis(source({ contentHash: "f".repeat(64) }), null);
    const direct = composeFromFacts(facts, 0, null);
    assert.ok(direct.text.length > 80);
    assert.ok(direct.evidence.includes("key"));
    assert.ok(direct.evidence.includes("loudness"));
  });
});
