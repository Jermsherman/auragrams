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
  return {
    label: homeLabel,
    tonic: home.tonic,
    mode: home.mode,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    pitched: true,
    display: homeLabel,
    changes: filtered,
  };
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
