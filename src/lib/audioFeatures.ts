// Lightweight audio feature extraction (Web Audio only, no deps).
// Single-pass FFT over a few mid-track windows, plus envelope/transient stats.

export type AudioBands = { bass: number; mid: number; treble: number };

export type AudioFeatures = {
  // legacy core (kept for back-compat with mood detection)
  rms: number;            // 0..1 loudness
  brightness: number;     // 0..1 spectral centroid normalized
  bands: AudioBands;      // 0..1 each (sums to ~1)
  energy: number;         // 0..100
  durationSec: number;

  // extended ----------------------------------------------------------
  loudness: number;            // alias of rms, 0..1
  peakLevel: number;           // 0..1 absolute max
  dynamicRange: number;        // 0..1 peak − rms
  bassEnergy: number;          // 0..1
  midEnergy: number;           // 0..1
  trebleEnergy: number;        // 0..1
  lowEndDensity: number;       // 0..1 (bass band fullness)
  midrangeDensity: number;     // 0..1
  highFrequencySparkle: number;// 0..1
  transientIntensity: number;  // 0..1 attack/onset density
  rhythmIntensity: number;     // 0..1 envelope autocorr peak
  zeroCrossingRate: number;    // 0..1
  estimatedTempo: number | null;

  // composite scores --------------------------------------------------
  densityScore: number;        // 0..1 fullness
  energyScore: number;         // 0..100 (== energy)
  warmthScore: number;         // 0..1
  darknessScore: number;       // 0..1
  softnessScore: number;       // 0..1
  aggressionScore: number;     // 0..1
};

async function decode(file: File): Promise<AudioBuffer | null> {
  if (typeof window === "undefined") return null;
  const Ctx = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  try {
    const buf = await file.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf.slice(0));
    return audio;
  } finally {
    void ctx.close();
  }
}

function toMono(audio: AudioBuffer): Float32Array {
  const ch = audio.numberOfChannels, len = audio.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < ch; c++) {
    const data = audio.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += data[i] / ch;
  }
  return mono;
}

// In-place radix-2 FFT (Cooley–Tukey).
function fft(re: Float32Array, im: Float32Array) {
  const N = re.length;
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wlr = Math.cos(ang), wli = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let wr = 1, wi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const nwr = wr * wlr - wi * wli, nwi = wr * wli + wi * wlr;
        wr = nwr; wi = nwi;
      }
    }
  }
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export async function analyzeFile(file: File, preDecoded?: AudioBuffer | null): Promise<AudioFeatures | null> {
  const audio = preDecoded ?? (await decode(file));
  if (!audio) return null;
  return analyzeBuffer(audio);
}

export function analyzeBuffer(audio: AudioBuffer): AudioFeatures {
  const sr = audio.sampleRate;
  const mono = toMono(audio);
  const len = mono.length;

  // ---- Time-domain stats ----
  let sumSq = 0;
  let peak = 0;
  let zc = 0;
  let prev = 0;
  const stride = 32;
  for (let i = 0; i < len; i += stride) {
    const v = mono[i];
    sumSq += v * v;
    const av = v < 0 ? -v : v;
    if (av > peak) peak = av;
    if ((v >= 0) !== (prev >= 0)) zc++;
    prev = v;
  }
  const samples = Math.max(1, Math.floor(len / stride));
  const rms = Math.min(1, Math.sqrt(sumSq / samples) * 1.6);
  const peakLevel = clamp01(peak);
  const dynamicRange = clamp01(peakLevel - rms);
  const zeroCrossingRate = clamp01(zc / samples * 2);

  // ---- Envelope (RMS over ~50ms hops) for transients/rhythm ----
  const hop = Math.max(256, Math.floor(sr * 0.05));
  const envCount = Math.floor(len / hop);
  const env = new Float32Array(envCount);
  for (let h = 0; h < envCount; h++) {
    let s = 0;
    const base = h * hop;
    for (let i = 0; i < hop; i += 4) {
      const v = mono[base + i];
      s += v * v;
    }
    env[h] = Math.sqrt(s / Math.max(1, hop / 4));
  }
  // transients: avg positive delta normalized
  let dSum = 0;
  let dCount = 0;
  let envMax = 1e-6;
  for (let i = 1; i < envCount; i++) {
    if (env[i] > envMax) envMax = env[i];
    const d = env[i] - env[i - 1];
    if (d > 0) { dSum += d; dCount++; }
  }
  const transientIntensity = clamp01((dSum / Math.max(1, dCount)) / envMax * 4);

  // rhythm: autocorrelation peak in 0.25s..2s lag range
  let rhythmIntensity = 0;
  let estimatedTempo: number | null = null;
  if (envCount > 20) {
    const minLag = Math.max(2, Math.floor(0.25 / 0.05));
    const maxLag = Math.min(envCount - 1, Math.floor(2.0 / 0.05));
    let mean = 0;
    for (let i = 0; i < envCount; i++) mean += env[i];
    mean /= envCount;
    let bestR = 0;
    let bestLag = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let num = 0, den = 0;
      for (let i = 0; i + lag < envCount; i++) {
        const a = env[i] - mean, b = env[i + lag] - mean;
        num += a * b;
        den += a * a;
      }
      const r = den > 0 ? num / den : 0;
      if (r > bestR) { bestR = r; bestLag = lag; }
    }
    rhythmIntensity = clamp01(bestR);
    if (bestLag > 0 && rhythmIntensity > 0.2) {
      estimatedTempo = Math.round(60 / (bestLag * 0.05));
    }
  }

  // ---- Frequency-domain ----
  const N = 4096;
  const numWindows = Math.min(8, Math.floor(len / N));
  const startBase = Math.max(0, Math.floor((len - numWindows * N) / 2));
  const spec = new Float32Array(N / 2);
  let used = 0;
  for (let w = 0; w < numWindows; w++) {
    const off = startBase + w * N;
    const re = new Float32Array(N), im = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const han = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
      re[i] = mono[off + i] * han;
    }
    let p = 0; for (let i = 0; i < N; i += 16) p += re[i] * re[i];
    if (p < 1e-5) continue;
    fft(re, im);
    for (let k = 0; k < N / 2; k++) spec[k] += Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    used++;
  }

  let brightness = 0.4;
  let bands: AudioBands = { bass: 0.33, mid: 0.34, treble: 0.33 };
  let lowEndDensity = 0, midrangeDensity = 0, highFrequencySparkle = 0;
  if (used > 0) {
    for (let k = 0; k < spec.length; k++) spec[k] /= used;
    const binHz = sr / N;
    let totalE = 0, centroidNum = 0;
    let bassE = 0, midE = 0, trebleE = 0;
    let bassBins = 0, midBins = 0, trebleBins = 0;
    let specMax = 1e-6;
    for (let k = 1; k < spec.length; k++) {
      if (spec[k] > specMax) specMax = spec[k];
      const f = k * binHz;
      const e = spec[k];
      totalE += e;
      centroidNum += f * e;
      if (f < 250) { bassE += e; bassBins++; }
      else if (f < 2500) { midE += e; midBins++; }
      else { trebleE += e; trebleBins++; }
    }
    const centroid = totalE > 0 ? centroidNum / totalE : 1000;
    brightness = Math.min(1, centroid / (sr / 4));
    const bandSum = bassE + midE + trebleE || 1;
    bands = { bass: bassE / bandSum, mid: midE / bandSum, treble: trebleE / bandSum };
    lowEndDensity = clamp01((bassE / Math.max(1, bassBins)) / specMax * 2);
    midrangeDensity = clamp01((midE / Math.max(1, midBins)) / specMax * 2);
    highFrequencySparkle = clamp01((trebleE / Math.max(1, trebleBins)) / specMax * 2);
  }

  const energy = Math.max(15, Math.min(99, Math.round(
    rms * 50 + brightness * 25 + bands.treble * 15 + transientIntensity * 10,
  )));

  // composite scores
  const densityScore = clamp01(
    lowEndDensity * 0.35 + midrangeDensity * 0.45 + highFrequencySparkle * 0.2 + rms * 0.15,
  );
  const warmthScore = clamp01(bands.mid * 1.1 + (1 - brightness) * 0.4 - bands.treble * 0.3);
  const darknessScore = clamp01((1 - brightness) * 0.7 + (1 - rms) * 0.3 + bands.bass * 0.2);
  const softnessScore = clamp01(1 - transientIntensity * 0.7 - rms * 0.3);
  const aggressionScore = clamp01(transientIntensity * 0.6 + rms * 0.3 + bands.bass * 0.2);

  return {
    rms, brightness, bands, energy, durationSec: audio.duration,
    loudness: rms,
    peakLevel,
    dynamicRange,
    bassEnergy: bands.bass,
    midEnergy: bands.mid,
    trebleEnergy: bands.treble,
    lowEndDensity,
    midrangeDensity,
    highFrequencySparkle,
    transientIntensity,
    rhythmIntensity,
    zeroCrossingRate,
    estimatedTempo,
    densityScore,
    energyScore: energy,
    warmthScore,
    darknessScore,
    softnessScore,
    aggressionScore,
  };
}
