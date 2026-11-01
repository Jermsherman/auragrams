import type { Feel } from "./tempo";
import { STORY_FRAGMENTS, type StoryFragment, type StoryRole } from "./storyLibrary";

export type ArcShape = "slow-burn" | "early-peak" | "plateau" | "late-drop";
export type MomentPlace = "opening" | "early" | "middle" | "late" | "ending";
export type PaletteFamily = "warm" | "cool" | "green" | "ash" | "haze" | "glint";
export type StoryVoice = "cinematic" | "intimate" | "nocturnal" | "kinetic" | "warm" | "cold";

export type StorySource = {
  contentHash: string;
  durationSec: number;
  bpm: number | null;
  bpmConfidence: number;
  feel: Feel;
  swingRatio: number | null;
  tempoLabel: "Slow" | "Mid" | "Fast" | "Unclear";
  key: {
    label: string | null;
    display: string;
    confidence: number;
    mode: "major" | "minor" | null;
    changes: { atSec: number; label: string }[];
  };
  loudness: { integratedLufs: number; levelSpanLu: number };
  energyCurve: { t: number; lufs: number }[];
  lowEnd: { shareBelow120Hz: number };
  width: { label: "mono" | "narrow" | "wide" | "unknown" };
  sections: { startSec: number; endSec: number; label: string }[];
  moment: { startSec: number; durationSec: number } | null;
  auraName: string;
  fingerprint?: { id: string; value: number }[];
};

export type StoryFacts = {
  material: string;
  tags: Set<string>;
  bpm: number | null;
  bpmKnown: boolean;
  keyLabel: string | null;
  keyKnown: boolean;
  swingPct: number | null;
  lufs: string;
  span: string;
  lowPct: number;
  widthLabel: string;
  palette: string;
  changeLabel: string | null;
  changeAt: string | null;
  momentClock: string | null;
  momentDur: number | null;
  momentPlace: MomentPlace | "none";
  sections: { label: string; start: string; end: string }[];
  voice: StoryVoice;
};

export type ComposedStory = {
  text: string;
  affirm: string;
  surprise: string | null;
  evidence: string[];
  voice: StoryVoice;
  take: number;
};

const PALETTE_FAMILY: Record<string, PaletteFamily> = {
  Crimson: "warm",
  Amber: "warm",
  Gold: "warm",
  Rose: "warm",
  Magenta: "warm",
  Chartreuse: "green",
  Verdant: "green",
  Teal: "cool",
  Cyan: "cool",
  Azure: "cool",
  Indigo: "cool",
  Violet: "cool",
  Ash: "ash",
  Haze: "haze",
  Glint: "glint",
};

export function clockLabel(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function classifyArc(curve: { t: number; lufs: number }[]): ArcShape {
  if (curve.length < 4) return "plateau";
  const third = Math.max(1, Math.floor(curve.length / 3));
  const mean = (rows: { lufs: number }[]) => rows.reduce((sum, row) => sum + row.lufs, 0) / rows.length;
  const early = mean(curve.slice(0, third));
  const mid = mean(curve.slice(third, third * 2));
  const late = mean(curve.slice(third * 2));
  const peak = curve.reduce((best, row) => (row.lufs > best.lufs ? row : best));
  const dur = Math.max(curve[curve.length - 1].t, 1);
  const pos = peak.t / dur;
  const span = Math.max(early, mid, late) - Math.min(early, mid, late);
  if (span < 2.5) return "plateau";
  if (pos <= 0.35 && early > late + 2) return "early-peak";
  if (late + 2.5 < mid && late + 1 < early) return "late-drop";
  if (late > early + 2.5 && pos >= 0.45) return "slow-burn";
  if (pos <= 0.4 && early >= late) return "early-peak";
  if (late + 2 < Math.max(early, mid)) return "late-drop";
  if (late > early + 1.5) return "slow-burn";
  return "plateau";
}

export function momentPlace(startSec: number, durationSec: number): MomentPlace {
  const dur = Math.max(durationSec, 0.001);
  const pos = startSec / dur;
  if (pos < 0.12) return "opening";
  if (pos < 0.35) return "early";
  if (pos < 0.65) return "middle";
  if (pos < 0.85) return "late";
  return "ending";
}

function paletteOf(auraName: string): { word: string; family: PaletteFamily } {
  const word = auraName.split(/\s+/)[0] || "Haze";
  return { word, family: PALETTE_FAMILY[word] ?? "haze" };
}

function loudBand(lufs: number): "quiet" | "moderate" | "loud" {
  if (lufs < -20) return "quiet";
  if (lufs < -12) return "moderate";
  return "loud";
}

function dynBand(span: number): "flat" | "moving" | "wide" {
  if (span < 4) return "flat";
  if (span < 10) return "moving";
  return "wide";
}

function lowBand(share: number): "light" | "balanced" | "heavy" {
  if (share < 0.22) return "light";
  if (share < 0.42) return "balanced";
  return "heavy";
}

function storyMaterial(source: StorySource): string {
  const print = (source.fingerprint ?? []).map((row) => `${row.id}:${row.value}`).join(",");
  return `${source.contentHash}|${print}`;
}

export function storySeed(material: string, take: number): number {
  let hash = 2166136261;
  const text = `${material}\n${take}`;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chooseVoice(tags: Set<string>, rand: () => number): StoryVoice {
  const has = (tag: string) => tags.has(tag);
  const scores: Record<StoryVoice, number> = {
    cinematic: (has("width:wide") ? 2 : 0) + (has("dyn:wide") ? 2 : 0) + (has("tempo:slow") ? 1 : 0) + (has("mode:minor") ? 1 : 0),
    intimate: (has("loud:quiet") ? 2 : 0) + (has("width:mono") || has("width:narrow") ? 2 : 0) + (has("tempo:slow") || has("tempo:mid") ? 1 : 0),
    nocturnal: (has("mode:minor") ? 2 : 0) + (has("palette:cool") || has("palette:ash") || has("palette:haze") ? 2 : 0) + (has("tempo:slow") || has("tempo:mid") ? 1 : 0),
    kinetic: (has("tempo:fast") ? 3 : 0) + (has("arc:early-peak") ? 1 : 0) + (has("feel:straight") ? 1 : 0),
    warm: (has("feel:swung") ? 2 : 0) + (has("palette:warm") || has("palette:green") ? 2 : 0) + (has("mode:major") ? 1 : 0) + (has("tempo:mid") ? 1 : 0),
    cold: (has("palette:cool") || has("palette:glint") ? 2 : 0) + (has("arc:plateau") ? 1 : 0) + (has("width:mono") ? 1 : 0) + (has("dyn:flat") ? 1 : 0),
  };
  let best = -1;
  let tied: StoryVoice[] = [];
  for (const voice of Object.keys(scores) as StoryVoice[]) {
    const score = scores[voice];
    if (score > best) {
      best = score;
      tied = [voice];
    } else if (score === best) tied.push(voice);
  }
  return tied[Math.floor(rand() * tied.length)] ?? "intimate";
}

export function factsFromAnalysis(source: StorySource, vocals: boolean | null | undefined): StoryFacts {
  const bpmKnown = source.bpm != null && source.bpmConfidence >= 0.35;
  const keyKnown = source.key.confidence >= 0.3 && !!source.key.label;
  const { word, family } = paletteOf(source.auraName);
  const arc = classifyArc(source.energyCurve);
  const place = source.moment ? momentPlace(source.moment.startSec, source.durationSec) : "none";
  const change = source.key.changes[0];
  const tags = new Set<string>();
  const tempoTag = source.tempoLabel === "Slow" ? "tempo:slow" : source.tempoLabel === "Mid" ? "tempo:mid" : source.tempoLabel === "Fast" ? "tempo:fast" : "tempo:unclear";
  tags.add(tempoTag);
  if (bpmKnown) tags.add("tempo:known");
  else tags.add("tempo:unclear");
  tags.add(source.feel === "swung" ? "feel:swung" : source.feel === "straight" ? "feel:straight" : "feel:unclear");
  if (keyKnown && source.key.mode) tags.add(source.key.mode === "major" ? "mode:major" : "mode:minor");
  else tags.add("mode:unclear");
  if (keyKnown) {
    tags.add("key:named");
    tags.add(source.key.confidence >= 0.66 ? "keyconf:firm" : "keyconf:soft");
  } else tags.add("key:hidden");
  tags.add(change ? "changes:yes" : "changes:no");
  tags.add(`arc:${arc}`);
  tags.add(place === "none" ? "moment:none" : `moment:${place}`);
  tags.add(`loud:${loudBand(source.loudness.integratedLufs)}`);
  tags.add(`dyn:${dynBand(source.loudness.levelSpanLu)}`);
  tags.add(`low:${lowBand(source.lowEnd.shareBelow120Hz)}`);
  if (source.width.label !== "unknown") tags.add(`width:${source.width.label}`);
  tags.add(`palette:${family}`);
  if (vocals === true) tags.add("vocals:yes");
  else if (vocals === false) tags.add("vocals:no");
  else tags.add("vocals:unset");

  const seedForVoice = rng(storySeed(storyMaterial(source), 0));
  const voice = chooseVoice(tags, seedForVoice);

  return {
    material: storyMaterial(source),
    tags,
    bpm: bpmKnown ? source.bpm : null,
    bpmKnown,
    keyLabel: keyKnown ? source.key.label : null,
    keyKnown,
    swingPct: source.feel === "swung" && source.swingRatio != null ? Math.round(source.swingRatio * 100) : null,
    lufs: source.loudness.integratedLufs.toFixed(1),
    span: source.loudness.levelSpanLu.toFixed(1),
    lowPct: Math.round(source.lowEnd.shareBelow120Hz * 100),
    widthLabel: source.width.label,
    palette: word,
    changeLabel: change ? change.label : null,
    changeAt: change ? clockLabel(change.atSec) : null,
    momentClock: source.moment ? clockLabel(source.moment.startSec) : null,
    momentDur: source.moment ? source.moment.durationSec : null,
    momentPlace: place,
    sections: (source.sections.length ? source.sections : [{ startSec: 0, endSec: source.durationSec, label: "Section" }]).map((section) => ({
      label: section.label,
      start: clockLabel(section.startSec),
      end: clockLabel(section.endSec),
    })),
    voice,
  };
}

function fill(template: string, facts: StoryFacts, section?: { label: string; start: string; end: string }): string | null {
  if (template.includes("{key}") && !facts.keyKnown) return null;
  if (template.includes("{bpm}") && !facts.bpmKnown) return null;
  if (template.includes("{swing}") && facts.swingPct == null) return null;
  if ((template.includes("{changeLabel}") || template.includes("{changeAt}")) && !facts.changeLabel) return null;
  if ((template.includes("{moment}") || template.includes("{dur}")) && facts.momentClock == null) return null;
  let text = template
    .replaceAll("{palette}", facts.palette)
    .replaceAll("{bpm}", facts.bpmKnown && facts.bpm != null ? String(Math.round(facts.bpm)) : "")
    .replaceAll("{key}", facts.keyLabel ?? "")
    .replaceAll("{swing}", facts.swingPct != null ? String(facts.swingPct) : "")
    .replaceAll("{lufs}", facts.lufs)
    .replaceAll("{span}", facts.span)
    .replaceAll("{lowPct}", String(facts.lowPct))
    .replaceAll("{width}", facts.widthLabel)
    .replaceAll("{changeLabel}", facts.changeLabel ?? "")
    .replaceAll("{changeAt}", facts.changeAt ?? "")
    .replaceAll("{moment}", facts.momentClock ?? "")
    .replaceAll("{dur}", facts.momentDur != null ? String(facts.momentDur) : "")
    .replaceAll("{label}", section?.label ?? "")
    .replaceAll("{start}", section?.start ?? "")
    .replaceAll("{end}", section?.end ?? "");
  if (/\{\w+\}/.test(text)) return null;
  return text;
}

function eligible(role: StoryRole, facts: StoryFacts, extra: string[] = []): StoryFragment[] {
  return STORY_FRAGMENTS.filter((fragment) => {
    if (fragment.role !== role) return false;
    if (fragment.voice && fragment.voice !== facts.voice) return false;
    const tags = extra.length ? new Set([...facts.tags, ...extra]) : facts.tags;
    return fragment.tags.every((tag) => tags.has(tag));
  });
}

function pick(rand: () => number, pool: StoryFragment[], used: Set<string>, len: "short" | "long" | "any"): StoryFragment | null {
  const fresh = pool.filter((fragment) => !used.has(fragment.id));
  const preferred = len === "any" ? fresh : fresh.filter((fragment) => fragment.len === len);
  const choices = preferred.length ? preferred : fresh;
  if (!choices.length) return null;
  const choice = choices[Math.floor(rand() * choices.length)];
  used.add(choice.id);
  return choice;
}

function say(
  rand: () => number,
  facts: StoryFacts,
  role: StoryRole,
  used: Set<string>,
  len: "short" | "long" | "any",
  must: string[] = [],
  section?: { label: string; start: string; end: string },
): string | null {
  const pool = eligible(role, facts, must).filter((fragment) => must.every((tag) => fragment.tags.includes(tag)));
  const choice = pick(rand, pool, used, len);
  if (!choice) return null;
  return fill(choice.text, facts, section);
}

function evidenceFor(facts: StoryFacts, vocals: boolean | null | undefined): string[] {
  const evidence = ["palette", "energy", "loudness", "lowEnd", "sections"];
  if (facts.bpmKnown) evidence.push("bpm", "feel");
  else evidence.push("bpm");
  evidence.push("key");
  if (facts.widthLabel !== "unknown") evidence.push("width");
  if (facts.momentClock) evidence.push("moment");
  if (vocals === true || vocals === false) evidence.push("vocals");
  return evidence;
}

export function composeFromFacts(facts: StoryFacts, take = 0, vocals: boolean | null | undefined = null): ComposedStory {
  const rand = rng(storySeed(facts.material, take));
  const used = new Set<string>();
  const rhythm = Math.floor(rand() * 3);
  const lenAt = (index: number): "short" | "long" => ((rhythm + index) % 2 === 0 ? "short" : "long");

  const tempoTag = facts.tags.has("tempo:fast") ? "tempo:fast" : facts.tags.has("tempo:slow") ? "tempo:slow" : facts.tags.has("tempo:mid") ? "tempo:mid" : "tempo:unclear";
  const opening: string[] = [];
  const open = say(rand, facts, "open", used, lenAt(0));
  const palette = say(rand, facts, "palette", used, lenAt(1));
  const tempo = say(rand, facts, "ground", used, lenAt(2), [facts.bpmKnown ? tempoTag : "tempo:unclear"]);
  const feelTag = facts.tags.has("feel:swung") ? "feel:swung" : facts.tags.has("feel:straight") ? "feel:straight" : null;
  const feel = feelTag ? say(rand, facts, "ground", used, "short", [feelTag]) : null;
  const keyLine = say(rand, facts, "ground", used, lenAt(3), [facts.keyKnown ? "key:named" : "key:hidden"]);
  if (rhythm === 2 && palette) opening.push(palette);
  if (open) opening.push(open);
  if (rhythm !== 2 && palette) opening.push(palette);
  if (keyLine) opening.push(keyLine);
  else opening.push(facts.keyKnown && facts.keyLabel ? `${facts.keyLabel}.` : "Key unclear.");
  if (tempo) opening.push(tempo);
  else opening.push(facts.bpmKnown && facts.bpm != null ? `${Math.round(facts.bpm)} BPM.` : "The tempo will not settle on a BPM.");
  if (feel && feel !== tempo && feel !== keyLine) opening.push(feel);

  const journey: string[] = [];
  facts.sections.slice(0, 4).forEach((section, index) => {
    const line =
      say(rand, facts, "section", used, lenAt(index), [`section:${section.label}`], section) ??
      say(rand, facts, "section", used, "any", ["section:any"], section);
    if (line) journey.push(line);
  });
  const arc = say(rand, facts, "arc", used, lenAt(4));
  if (arc) journey.push(arc);

  const measures: string[] = [];
  const measureTags = ["loud:quiet", "loud:moderate", "loud:loud", "dyn:flat", "dyn:moving", "dyn:wide", "low:light", "low:balanced", "low:heavy", "width:mono", "width:narrow", "width:wide"].filter((tag) => facts.tags.has(tag));
  const measureCount = rhythm === 0 ? 2 : 1;
  for (let i = 0; i < measureCount && measureTags.length; i++) {
    const tag = measureTags.splice(Math.floor(rand() * measureTags.length), 1)[0];
    const line = say(rand, facts, "measure", used, i === 0 ? "long" : "short", [tag]);
    if (line) measures.push(line);
  }
  if (facts.tags.has("changes:yes")) {
    const change = say(rand, facts, "change", used, "long", ["changes:yes"]);
    if (change) measures.push(change);
  }
  if (vocals === true || vocals === false) {
    const vocal = say(rand, facts, "vocal", used, "short", [vocals ? "vocals:yes" : "vocals:no"]);
    if (vocal) measures.push(vocal);
  }

  const close = say(rand, facts, "close", used, "long") ?? "No moment is marked.";
  const text = [opening.join(" "), [...journey, ...measures].join(" "), close].filter((part) => part.trim().length > 0).join("\n\n");
  const sentences = text.split(/(?<=[.!?])\s+/);
  return {
    text,
    affirm: sentences[0] ?? text,
    surprise: close,
    evidence: evidenceFor(facts, vocals),
    voice: facts.voice,
    take,
  };
}

export function composeRead(source: StorySource, vocals: boolean | null | undefined, take = 0): ComposedStory {
  return composeFromFacts(factsFromAnalysis(source, vocals), take, vocals);
}

export function findTake(source: StorySource, vocals: boolean | null | undefined, saved: string | undefined, limit = 12): number {
  if (!saved) return 0;
  for (let take = 0; take < limit; take++) {
    if (composeRead(source, vocals, take).text === saved) return take;
  }
  return 0;
}
