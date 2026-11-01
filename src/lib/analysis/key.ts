import { clamp } from "./dsp";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

// Krumhansl–Schmuckler profiles. Index 0 is the tonic.
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export type KeyWindow = {
  t: number;
  label: string | null;
  tonic: string | null;
  mode: "major" | "minor" | null;
  confidence: number;
  pitched: boolean;
  chroma: number[];
};

export type KeySummary = {
  label: string | null;
  tonic: string | null;
  mode: "major" | "minor" | null;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low" | "none";
  pitched: boolean;
  display: string;
  changes: { atSec: number; label: string; confidence: number }[];
};

function correlate(a: number[], b: number[]): number {
  const n = a.length;
  let sa = 0;
  let sb = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i];
    sb += b[i];
  }
  const ma = sa / n;
  const mb = sb / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return num / Math.sqrt(da * db || 1);
}

function rotate(profile: number[], tonic: number): number[] {
  const out = new Array<number>(12);
  for (let i = 0; i < 12; i++) out[i] = profile[(i - tonic + 12) % 12];
  return out;
}

export function confidenceLabel(c: number): KeySummary["confidenceLabel"] {
  if (c >= 0.66) return "high";
  if (c >= 0.45) return "medium";
  if (c >= 0.3) return "low";
  return "none";
}

export function matchKey(chromaIn: number[]): {
  label: string;
  tonic: string;
  mode: "major" | "minor";
  confidence: number;
  score: number;
  peakiness: number;
} | null {
  const max = Math.max(...chromaIn);
  if (max <= 0) return null;
  const chroma = chromaIn.map((v) => v / max);
  const mean = chroma.reduce((s, v) => s + v, 0) / 12;
  const peakiness = mean > 0 ? Math.max(...chroma) / mean : 0;

  let best = { score: -Infinity, tonic: 0, mode: "major" as "major" | "minor" };
  let runner = -Infinity;
  for (const mode of ["major", "minor"] as const) {
    const profile = mode === "major" ? MAJOR : MINOR;
    for (let t = 0; t < 12; t++) {
      const s = correlate(chroma, rotate(profile, t));
      if (s > best.score) {
        runner = best.score;
        best = { score: s, tonic: t, mode };
      } else if (s > runner) runner = s;
    }
  }
  const margin = best.score - (Number.isFinite(runner) ? runner : 0);
  const confidence = clamp(best.score * 0.45 + margin * 2.4, 0, 1);
  const tonic = NOTES[best.tonic];
  return {
    label: `${tonic} ${best.mode}`,
    tonic,
    mode: best.mode,
    confidence,
    score: best.score,
    peakiness,
  };
}

export type SecondChroma = {
  t: number;
  chroma: number[];
  flatness: number;
  peakiness: number;
};

const FLATNESS_MAX = 0.28;
const PEAKINESS_MIN = 2.05;
const SHOW_CONFIDENCE = 0.3;

export function isPitched(flatness: number, peakiness: number, score: number): boolean {
  // Flatness near 1 is noise (unpitched drums). A chord progression spreads
  // chroma across many pitch classes without becoming noise, so peakiness is
  // only a tie-break when the spectrum is already somewhat flat.
  if (flatness > 0.42) return false;
  if (flatness > FLATNESS_MAX && peakiness < PEAKINESS_MIN && score < 0.55) return false;
  if (score < 0.3 && flatness > 0.2) return false;
  return true;
}

const TRIAD_MAJOR = [0, 4, 7];
const TRIAD_MINOR = [0, 3, 7];

function triadFit(chroma: number[], root: number, mode: "major" | "minor"): number {
  const ivs = mode === "major" ? TRIAD_MAJOR : TRIAD_MINOR;
  let triad = 0;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += chroma[i];
  if (sum <= 0) return 0;
  for (const iv of ivs) triad += chroma[(root + iv) % 12];
  return triad / sum;
}

function bestTriad(chroma: number[]): { root: number; mode: "major" | "minor"; fit: number } | null {
  let best: { root: number; mode: "major" | "minor"; fit: number } | null = null;
  let second = 0;
  for (let root = 0; root < 12; root++) {
    for (const mode of ["major", "minor"] as const) {
      const fit = triadFit(chroma, root, mode);
      if (!best || fit > best.fit) {
        second = best?.fit ?? 0;
        best = { root, mode, fit };
      } else if (fit > second) second = fit;
    }
  }
  // A real chord puts about half its energy on the triad. A weak or split
  // second is not evidence of a cadence.
  if (!best || best.fit < 0.42 || best.fit - second < 0.03) return null;
  return best;
}

function leadingRatio(chroma: number[], tonic: number): number {
  const raised = chroma[(tonic + 11) % 12];
  const flat = chroma[(tonic + 10) % 12];
  return raised / (raised + flat + 1e-12);
}

/**
 * A loud submediant (F) or relative major (C) can outscore A minor on a
 * Krumhansl profile. A dominant that resolves to the tonic, and the leading
 * tone that dominant carries, point at the real key. A candidate whose own
 * tonic triad barely appears is penalized against the tonic that does.
 */
export function disambiguateKey(seconds: SecondChroma[], summary: KeySummary): KeySummary {
  if (!summary.pitched || !summary.label || !summary.tonic || !summary.mode) return summary;
  const homeMode = summary.mode;
  const parallel = `${summary.tonic} ${homeMode === "major" ? "minor" : "major"}`;
  summary = {
    ...summary,
    changes: summary.changes.filter((change) => change.label !== parallel),
  };
  const homeIndex = NOTES.indexOf(summary.tonic as (typeof NOTES)[number]);
  if (homeIndex < 0) return summary;

  const global = new Array(12).fill(0);
  const rootHits = new Array(12).fill(0);
  const modeHits = new Array(24).fill(0);
  const resolutions = new Array(12).fill(0);
  let counted = 0;
  let prev: { root: number; mode: "major" | "minor"; t: number } | null = null;
  for (const sec of seconds) {
    for (let i = 0; i < 12; i++) global[i] += sec.chroma[i];
    const triad = bestTriad(sec.chroma);
    if (!triad) continue;
    counted++;
    rootHits[triad.root] += 1;
    modeHits[triad.root + (triad.mode === "minor" ? 12 : 0)] += 1;
    if (
      prev &&
      sec.t > prev.t &&
      sec.t - prev.t <= 2 &&
      prev.mode === "major" &&
      triad.root === (prev.root + 5) % 12
    ) {
      resolutions[triad.root] += 1;
    }
    prev = { root: triad.root, mode: triad.mode, t: sec.t };
  }
  if (counted < 2) return summary;

  const bestRootShare = Math.max(...rootHits) / counted;
  const scoreOf = (tonic: number, mode: "major" | "minor") => {
    const profile = correlate(global, rotate(mode === "major" ? MAJOR : MINOR, tonic));
    const lead = mode === "minor" ? leadingRatio(global, tonic) : 0;
    const modeShare = modeHits[tonic + (mode === "minor" ? 12 : 0)] / counted;
    const otherShare = modeHits[tonic + (mode === "minor" ? 0 : 12)] / counted;
    const rootShare = rootHits[tonic] / counted;
    // The leading tone supports the minor key when that minor triad is actually
    // there. A major tonic that merely contains a leading tone stays major.
    const leadBonus = mode === "minor" && lead >= 0.15 && modeShare >= otherShare ? 0.08 + 0.22 * lead : 0;
    const rarePenalty = rootShare < bestRootShare * 0.35 ? 0.28 : 0;
    const missingTriad = modeShare < 0.05 && otherShare >= 0.08 ? 0.3 : 0;
    const score =
      profile +
      Math.min(0.45, resolutions[tonic] * 0.14) +
      leadBonus +
      modeShare * 0.12 -
      rarePenalty -
      missingTriad;
    return { score, lead, resolutions: resolutions[tonic] as number, profile };
  };

  const home = scoreOf(homeIndex, homeMode);
  let best: { tonic: number; mode: "major" | "minor"; score: number; lead: number; resolutions: number; profile: number } = {
    tonic: homeIndex,
    mode: homeMode,
    ...home,
  };

  for (let tonic = 0; tonic < 12; tonic++) {
    if (resolutions[tonic] < 1) continue;
    if (rootHits[tonic] / counted < 0.08) continue;
    for (const mode of ["major", "minor"] as const) {
      if (tonic === homeIndex && mode === homeMode) continue;
      const row = scoreOf(tonic, mode);
      if (row.profile < 0.35) continue;
      if (row.score > best.score + 0.06) best = { tonic, mode, ...row };
    }
  }

  if (best.tonic === homeIndex && best.mode === homeMode) return summary;
  const confidence = clamp(
    0.38 +
      Math.min(0.24, best.resolutions * 0.06) +
      best.lead * 0.2 +
      Math.max(0, best.score - home.score) * 0.1,
    0,
    0.9,
  );
  if (confidence < SHOW_CONFIDENCE) return summary;

  const tonic = NOTES[best.tonic];
  const label = `${tonic} ${best.mode}`;
  const newParallel = `${tonic} ${best.mode === "major" ? "minor" : "major"}`;
  return {
    ...summary,
    label,
    tonic,
    mode: best.mode,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    display: label,
    changes: summary.changes.filter(
      (change) => change.label !== label && change.label !== summary.label && change.label !== newParallel,
    ),
  };
}

export function summarizeKey(seconds: SecondChroma[], windowSec = 8, hopSec = 2): KeySummary {
  const unclear: KeySummary = {
    label: null,
    tonic: null,
    mode: null,
    confidence: 0,
    confidenceLabel: "none",
    pitched: false,
    display: "Key unclear",
    changes: [],
  };
  if (seconds.length === 0) return unclear;

  const windows: KeyWindow[] = [];
  const lastT = seconds[seconds.length - 1].t;
  for (let start = 0; start <= Math.max(0, lastT - windowSec + 1); start += hopSec) {
    const chroma = new Array(12).fill(0);
    let flat = 0;
    let n = 0;
    let peak = 0;
    for (const sec of seconds) {
      if (sec.t < start || sec.t >= start + windowSec) continue;
      for (let i = 0; i < 12; i++) chroma[i] += sec.chroma[i];
      flat += sec.flatness;
      peak += sec.peakiness;
      n++;
    }
    if (n === 0) continue;
    const match = matchKey(chroma);
    if (!match) continue;
    const pitched = isPitched(flat / n, peak / n, match.score);
    const confidence = pitched ? match.confidence : Math.min(match.confidence, 0.2);
    windows.push({
      t: start,
      label: pitched && confidence >= SHOW_CONFIDENCE ? match.label : null,
      tonic: match.tonic,
      mode: match.mode,
      confidence,
      pitched,
      chroma,
    });
  }
  if (windows.length === 0) return unclear;

  const pitchedWindows = windows.filter(
    (w) => w.pitched && w.label && w.confidence >= SHOW_CONFIDENCE,
  );
  if (pitchedWindows.length === 0) return unclear;

  // Home key is the label that wins the most confident time. Ties keep the earlier key.
  const weight = new Map<
    string,
    { w: number; first: number; conf: number; tonic: string; mode: "major" | "minor" }
  >();
  for (const w of pitchedWindows) {
    const label = w.label as string;
    const prev = weight.get(label);
    if (!prev) {
      weight.set(label, {
        w: w.confidence,
        first: w.t,
        conf: w.confidence,
        tonic: w.tonic as string,
        mode: w.mode as "major" | "minor",
      });
    } else {
      prev.w += w.confidence;
      prev.conf = Math.max(prev.conf, w.confidence);
    }
  }
  let homeLabel = "";
  let homeW = -1;
  let homeFirst = Infinity;
  for (const [label, row] of weight) {
    if (row.w > homeW + 0.05 || (Math.abs(row.w - homeW) <= 0.05 && row.first < homeFirst)) {
      homeLabel = label;
      homeW = row.w;
      homeFirst = row.first;
    }
  }
  const home = weight.get(homeLabel);
  if (!home) return unclear;

  // A change needs two agreeing windows so one mixed window cannot invent a modulation.
  const changes: KeySummary["changes"] = [];
  let stable = homeLabel;
  let runLabel: string | null = null;
  let runStart = 0;
  let runCount = 0;
  let runConf = 0;
  const flush = () => {
    if (runLabel && runCount >= 2 && runLabel !== stable && runConf >= SHOW_CONFIDENCE) {
      changes.push({ atSec: runStart, label: runLabel, confidence: runConf / runCount });
      stable = runLabel;
    }
  };
  for (const w of windows) {
    const label = w.pitched && w.label && w.confidence >= SHOW_CONFIDENCE ? w.label : null;
    if (label && label === runLabel) {
      runCount++;
      runConf += w.confidence;
    } else {
      flush();
      runLabel = label;
      runStart = w.t;
      runCount = label ? 1 : 0;
      runConf = w.confidence;
    }
  }
  flush();

  // Drop a change that only restates the home key, and the opening key itself.
  const filtered = changes.filter((c) => c.label !== homeLabel);

  const confidence = clamp(home.conf, 0, 1);
  return disambiguateKey(seconds, {
    label: homeLabel,
    tonic: home.tonic,
    mode: home.mode,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    pitched: true,
    display: homeLabel,
    changes: filtered,
  });
}

export function homeProfile(tonic: string, mode: "major" | "minor"): number[] {
  const idx = NOTES.indexOf(tonic as (typeof NOTES)[number]);
  return rotate(mode === "major" ? MAJOR : MINOR, idx < 0 ? 0 : idx);
}

export function tensionFromChroma(chroma: number[], profile: number[]): number {
  const match = correlate(chroma, profile);
  return clamp((0.9 - match) / 0.9, 0, 1);
}

export { NOTES };
