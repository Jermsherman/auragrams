// Lightweight audio feature extraction (Web Audio only, no deps).
// Used by Detect Mood + as energy override for the Aura engine.

export type AudioFeatures = {
  rms: number;            // 0..1 loudness
  brightness: number;     // 0..1 spectral centroid normalized (Hz / (sr/2))
  bands: { bass: number; mid: number; treble: number }; // 0..1 each
  energy: number;         // 0..100 derived
  durationSec: number;
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

export async function analyzeFile(file: File): Promise<AudioFeatures | null> {
  const audio = await decode(file);
  if (!audio) return null;
  return analyzeBuffer(audio);
}

export function analyzeBuffer(audio: AudioBuffer): AudioFeatures {
  const sr = audio.sampleRate;
  const mono = toMono(audio);
  const len = mono.length;

  // RMS over whole window
  let sumSq = 0;
  for (let i = 0; i < len; i += 32) sumSq += mono[i] * mono[i];
  const rms = Math.min(1, Math.sqrt(sumSq / Math.max(1, len / 32)) * 1.6);

  // FFT-based spectral analysis on a few 4096-sample windows from the middle.
  const N = 4096;
  const numWindows = Math.min(8, Math.floor(len / N));
  const startBase = Math.max(0, Math.floor((len - numWindows * N) / 2));
  const spec = new Float32Array(N / 2);
  let used = 0;
  for (let w = 0; w < numWindows; w++) {
    const off = startBase + w * N;
    const re = new Float32Array(N), im = new Float32Array(N);
    // Hann window
    for (let i = 0; i < N; i++) {
      const h = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
      re[i] = mono[off + i] * h;
    }
    // skip silent
    let p = 0; for (let i = 0; i < N; i += 16) p += re[i] * re[i];
    if (p < 1e-5) continue;
    fft(re, im);
    for (let k = 0; k < N / 2; k++) spec[k] += Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    used++;
  }
  if (used === 0) {
    return { rms, brightness: 0.4, bands: { bass: 0.3, mid: 0.4, treble: 0.3 }, energy: Math.round(rms * 70 + 25), durationSec: audio.duration };
  }
  for (let k = 0; k < spec.length; k++) spec[k] /= used;

  const binHz = sr / N;
  let totalE = 0, centroidNum = 0;
  let bassE = 0, midE = 0, trebleE = 0;
  for (let k = 1; k < spec.length; k++) {
    const f = k * binHz;
    const e = spec[k];
    totalE += e;
    centroidNum += f * e;
    if (f < 250) bassE += e;
    else if (f < 2500) midE += e;
    else trebleE += e;
  }
  const centroid = totalE > 0 ? centroidNum / totalE : 1000;
  const brightness = Math.min(1, centroid / (sr / 4)); // 0..1
  const bandSum = bassE + midE + trebleE || 1;
  const bands = { bass: bassE / bandSum, mid: midE / bandSum, treble: trebleE / bandSum };

  // Crude energy: blend of loudness, brightness, and treble share.
  const energy = Math.max(15, Math.min(99, Math.round(
    rms * 55 + brightness * 30 + bands.treble * 25,
  )));

  return { rms, brightness, bands, energy, durationSec: audio.duration };
}
