import { clamp } from "./dsp";

export type Feel = "straight" | "swung" | "unclear";

export type TempoEstimate = {
  bpm: number | null;
  confidence: number;
  swingRatio: number | null;
  feel: Feel;
};

function interp(acf: Float64Array, lag: number): number {
  if (lag < 1 || lag >= acf.length - 1) return 0;
  const i = Math.floor(lag);
  const f = lag - i;
  return acf[i] * (1 - f) + acf[i + 1] * f;
}

/** Log-gaussian tempo prior. It pulls half-time and double-time toward the beat, centered near 120. */
function tempoPrior(bpm: number): number {
  const x = Math.log2(bpm / 120);
  const sigma = 0.62;
  return Math.exp(-0.5 * (x / sigma) ** 2);
}

function autocorrelate(env: Float32Array, minLag: number, maxLag: number): Float64Array {
  const n = env.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += env[i];
  mean /= Math.max(1, n);
  let var0 = 0;
  for (let i = 0; i < n; i++) {
    const d = env[i] - mean;
    var0 += d * d;
  }
  const acf = new Float64Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let num = 0;
    const m = n - lag;
    for (let i = 0; i < m; i++) num += (env[i] - mean) * (env[i + lag] - mean);
    acf[lag] = var0 > 0 ? (num * n) / (m * var0) : 0;
  }
  return acf;
}

/**
 * Onset-envelope autocorrelation with an octave-weighted score.
 * The previous estimator used a 50 ms grid and kept the longest lag, so 90 BPM came back near 45.
 */
export function estimateTempo(onset: Float32Array, hopSec: number): TempoEstimate {
  const empty: TempoEstimate = { bpm: null, confidence: 0, swingRatio: null, feel: "unclear" };
  if (onset.length < 16 || hopSec <= 0) return empty;

  const maxLag = Math.min(onset.length - 2, Math.floor(2.2 / hopSec));
  const minLag = Math.max(2, Math.floor(60 / 220 / hopSec));
  if (maxLag <= minLag + 2) return empty;

  const acf = autocorrelate(onset, minLag, maxLag);
  let bestBpm = 0;
  let bestScore = -Infinity;
  let bestAcf = 0;
  const scored: { bpm: number; score: number }[] = [];

  for (let bpm = 55; bpm <= 210; bpm += 0.5) {
    const lag = 60 / bpm / hopSec;
    if (lag < minLag || lag > maxLag) continue;
    const ac = Math.max(0, interp(acf, lag));
    const ac2 = Math.max(0, interp(acf, lag * 2));
    const score = (ac + 0.55 * ac2) * tempoPrior(bpm);
    scored.push({ bpm, score });
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
      bestAcf = ac;
    }
  }
  if (!Number.isFinite(bestScore) || bestScore <= 0 || bestAcf < 0.18) return empty;

  let second = 0;
  for (const row of scored) {
    const ratio = row.bpm / bestBpm;
    const near = ratio > 0.94 && ratio < 1.06;
    const octave = (ratio > 0.47 && ratio < 0.53) || (ratio > 1.9 && ratio < 2.1);
    if (near || octave) continue;
    if (row.score > second) second = row.score;
  }
  const margin = bestScore > 0 ? (bestScore - second) / bestScore : 0;
  let confidence = clamp(0.2 + bestAcf * 0.65 + Math.max(0, margin) * 0.25, 0, 0.98);
  if (bestAcf < 0.28) confidence *= 0.55;

  const times = onsetTimes(onset, hopSec);
  const fromIntervals = bpmFromIntervals(times, bestBpm);
  const refined = fromIntervals ?? refineBpm(acf, hopSec, bestBpm);
  const nearest = Math.round(refined);
  const bpm = Math.abs(refined - nearest) <= 0.4 ? nearest : Math.round(refined * 10) / 10;
  const { swingRatio, feel } = fromIntervals
    ? swingFromIntervals(times, bpm, confidence)
    : measureSwing(onset, hopSec, bpm, confidence);
  return { bpm, confidence, swingRatio, feel };
}

function onsetTimes(onset: Float32Array, hopSec: number): number[] {
  let max = 0;
  for (let i = 0; i < onset.length; i++) if (onset[i] > max) max = onset[i];
  if (max <= 0) return [];
  const copy = Array.from(onset).sort((a, b) => a - b);
  const med = copy[Math.floor(copy.length / 2)] ?? 0;
  const times: number[] = [];
  for (let i = 1; i < onset.length - 1; i++) {
    if (
      onset[i] >= onset[i - 1] &&
      onset[i] > onset[i + 1] &&
      onset[i] > Math.max(med * 2.2, max * 0.22)
    ) {
      times.push(i * hopSec);
    }
  }
  return times;
}

/** Fit a beat period to the gaps between onsets. This is finer than the FFT hop grid. */
function bpmFromIntervals(times: number[], hint: number): number | null {
  if (times.length < 6) return null;
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const d = times[i] - times[i - 1];
    if (d > 0.12 && d < 1.6) gaps.push(d);
  }
  if (gaps.length < 4) return null;
  const spans = gaps.slice();
  for (let i = 0; i < gaps.length - 1; i++) spans.push(gaps[i] + gaps[i + 1]);

  let bestBpm = hint;
  let best = -Infinity;
  const lo = Math.max(55, hint * 0.45);
  const hi = Math.min(210, hint * 2.2);
  for (let bpm = lo; bpm <= hi; bpm += 0.25) {
    const period = 60 / bpm;
    let score = 0;
    for (const d of spans) {
      const k = Math.max(1, Math.round(d / period));
      if (k > 4) continue;
      const err = Math.abs(d - k * period) / period;
      if (err < 0.07) score += (k === 1 ? 1.5 : 1) * (1 - err / 0.07);
    }
    score *= tempoPrior(bpm);
    if (score > best) {
      best = score;
      bestBpm = bpm;
    }
  }
  return best > 0 ? bestBpm : null;
}

function swingFromIntervals(
  times: number[],
  bpm: number,
  tempoConfidence: number,
): { swingRatio: number | null; feel: Feel } {
  const period = 60 / bpm;
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const d = times[i] - times[i - 1];
    if (d > period * 0.2 && d < period * 0.92) gaps.push(d);
  }
  if (gaps.length < 3) {
    return { swingRatio: null, feel: tempoConfidence >= 0.4 ? "straight" : "unclear" };
  }
  const sorted = gaps.slice().sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  const longer = gaps.filter((d) => d >= mid - 1e-6);
  const mean = longer.reduce((s, d) => s + d, 0) / longer.length;
  const ratio = Math.round((mean / period) * 100) / 100;
  let feel: Feel = "unclear";
  if (ratio >= 0.6) feel = "swung";
  else if (ratio >= 0.42 && ratio <= 0.58) feel = "straight";
  return { swingRatio: ratio, feel };
}

/** Snap to the autocorrelation peak near the chosen tempo so the octave prior does not bias the number. */
function refineBpm(acf: Float64Array, hopSec: number, bpm: number): number {
  const center = 60 / bpm / hopSec;
  let bestLag = center;
  let best = -Infinity;
  const step = 0.02;
  for (let lag = center * 0.94; lag <= center * 1.06; lag += step) {
    const v = interp(acf, lag);
    if (v > best) {
      best = v;
      bestLag = lag;
    }
  }
  const y0 = interp(acf, bestLag - step);
  const y1 = best;
  const y2 = interp(acf, bestLag + step);
  const denom = y0 - 2 * y1 + y2;
  const delta = Math.abs(denom) < 1e-9 ? 0 : (0.5 * (y0 - y2)) / denom;
  const lag = bestLag + clamp(delta, -1, 1) * step;
  if (lag <= 0) return bpm;
  return 60 / (lag * hopSec);
}

function measureSwing(
  onset: Float32Array,
  hopSec: number,
  bpm: number,
  tempoConfidence: number,
): { swingRatio: number | null; feel: Feel } {
  let max = 0;
  for (let i = 0; i < onset.length; i++) if (onset[i] > max) max = onset[i];
  if (max <= 0) return { swingRatio: null, feel: "unclear" };

  const copy = Array.from(onset).sort((a, b) => a - b);
  const med = copy[Math.floor(copy.length / 2)] ?? 0;
  const times: number[] = [];
  for (let i = 1; i < onset.length - 1; i++) {
    if (
      onset[i] >= onset[i - 1] &&
      onset[i] > onset[i + 1] &&
      onset[i] > Math.max(med * 2.2, max * 0.22)
    ) {
      times.push(i * hopSec);
    }
  }
  if (times.length < 4) {
    return { swingRatio: null, feel: tempoConfidence >= 0.45 ? "straight" : "unclear" };
  }

  const period = 60 / bpm;
  const bins = 48;
  const hist = new Float64Array(bins);
  for (const t of times) {
    const phase = (((t % period) + period) % period) / period;
    hist[Math.min(bins - 1, Math.floor(phase * bins))]++;
  }
  let primary = 0;
  for (let i = 1; i < bins; i++) if (hist[i] > hist[primary]) primary = i;
  const rotated = new Float64Array(bins);
  for (let i = 0; i < bins; i++) rotated[i] = hist[(i + primary) % bins];

  let offBin = -1;
  let offCount = 0;
  const lo = Math.floor(0.34 * bins);
  const hi = Math.floor(0.84 * bins);
  for (let i = lo; i <= hi; i++) {
    if (rotated[i] > offCount) {
      offCount = rotated[i];
      offBin = i;
    }
  }
  const primaryCount = rotated[0];
  if (offBin < 0 || offCount < primaryCount * 0.28) {
    return { swingRatio: null, feel: tempoConfidence >= 0.4 ? "straight" : "unclear" };
  }
  const ratio = Math.round(((offBin + 0.5) / bins) * 100) / 100;
  let feel: Feel = "unclear";
  if (ratio >= 0.6) feel = "swung";
  else if (ratio >= 0.42 && ratio <= 0.58) feel = "straight";
  return { swingRatio: ratio, feel };
}

export function tempoBandFromBpm(
  bpm: number | null,
  confidence: number,
): "Slow" | "Mid" | "Fast" | "Unclear" {
  if (bpm == null || confidence < 0.35) return "Unclear";
  if (bpm < 90) return "Slow";
  if (bpm < 120) return "Mid";
  return "Fast";
}
