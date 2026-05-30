// Browser-only musical key detection via chroma + Krumhansl-Schmuckler profiles.
// No external deps. Uses Web Audio API + Goertzel algorithm.

const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

// Krumhansl-Schmuckler key profiles
const MAJOR = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
const MINOR = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];

function correlate(a: number[], b: number[]): number {
  const n = a.length;
  let sa=0,sb=0; for (let i=0;i<n;i++){sa+=a[i];sb+=b[i];}
  const ma=sa/n, mb=sb/n;
  let num=0,da=0,db=0;
  for (let i=0;i<n;i++){const x=a[i]-ma,y=b[i]-mb;num+=x*y;da+=x*x;db+=y*y;}
  return num/Math.sqrt(da*db||1);
}

function goertzelPower(samples: Float32Array, sr: number, freq: number): number {
  const N = samples.length;
  const k = Math.round((N * freq) / sr);
  const w = (2 * Math.PI * k) / N;
  const coeff = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < N; i++) {
    const s0 = samples[i] + coeff * s1 - s2;
    s2 = s1; s1 = s0;
  }
  return s1*s1 + s2*s2 - coeff*s1*s2;
}

export type KeyDetection = {
  key: string;          // "E minor"
  tonic: string;
  mode: "major" | "minor";
  confidence: number;   // 0..1 (winner / runner-up margin)
};

export async function detectKey(file: File, preDecoded?: AudioBuffer | null): Promise<KeyDetection | null> {
  if (typeof window === "undefined") return null;
  try {
    let audio: AudioBuffer | null = preDecoded ?? null;
    if (!audio) {
      const { decodeOnce } = await import("./audioDecode");
      audio = await decodeOnce(file);
    }
    if (!audio) return null;

    // Mono mix
    const ch = audio.numberOfChannels;
    const len = audio.length;
    const mono = new Float32Array(len);
    for (let c = 0; c < ch; c++) {
      const data = audio.getChannelData(c);
      for (let i = 0; i < len; i++) mono[i] += data[i] / ch;
    }
    const sr = audio.sampleRate;

    // Take ~30s window from the middle for stability
    const winSec = 30;
    const winLen = Math.min(len, Math.floor(winSec * sr));
    const start = Math.max(0, Math.floor((len - winLen) / 2));
    const win = mono.subarray(start, start + winLen);

    // Chunk into 2s segments and accumulate chroma (skip very quiet chunks)
    const chunkLen = Math.floor(2 * sr);
    const chroma = new Array(12).fill(0);
    let chunks = 0;
    for (let off = 0; off + chunkLen <= win.length; off += chunkLen) {
      const seg = win.subarray(off, off + chunkLen);
      // RMS gate
      let rms = 0;
      for (let i = 0; i < seg.length; i += 64) rms += seg[i] * seg[i];
      if (Math.sqrt(rms / (seg.length / 64)) < 0.005) continue;

      for (let p = 0; p < 12; p++) {
        // sum power across octaves 2..6 (≈65Hz..2kHz)
        let energy = 0;
        for (let o = 2; o <= 6; o++) {
          const freq = 440 * Math.pow(2, (p - 9 + 12 * (o - 4)) / 12);
          if (freq < 40 || freq > sr / 2 - 50) continue;
          energy += Math.max(0, goertzelPower(seg as Float32Array, sr, freq));
        }
        chroma[p] += energy;
      }
      chunks++;
    }
    if (chunks === 0) return null;
    // Normalize
    const max = Math.max(...chroma);
    if (max <= 0) return null;
    for (let i = 0; i < 12; i++) chroma[i] /= max;

    // Correlate with each rotation of major/minor profiles
    let best = { score: -Infinity, tonic: 0, mode: "major" as "major"|"minor" };
    let runnerUp = -Infinity;
    for (let t = 0; t < 12; t++) {
      const rot = MAJOR.slice(-t).concat(MAJOR.slice(0, MAJOR.length - t));
      const s = correlate(chroma, rot);
      if (s > best.score) { runnerUp = best.score; best = { score: s, tonic: t, mode: "major" }; }
      else if (s > runnerUp) runnerUp = s;
    }
    for (let t = 0; t < 12; t++) {
      const rot = MINOR.slice(-t).concat(MINOR.slice(0, MINOR.length - t));
      const s = correlate(chroma, rot);
      if (s > best.score) { runnerUp = best.score; best = { score: s, tonic: t, mode: "minor" }; }
      else if (s > runnerUp) runnerUp = s;
    }
    const tonic = NOTES[best.tonic];
    const margin = best.score - runnerUp;
    const confidence = Math.max(0, Math.min(1, margin * 4)); // crude scaling
    if (best.score < 0.3 || confidence < 0.05) return null;
    return { key: `${tonic} ${best.mode}`, tonic, mode: best.mode, confidence };
  } catch (e) {
    console.warn("[keyDetect] failed", e);
    return null;
  }
}

// ---------- Pitch center (YIN-lite autocorrelation) ----------

export type PitchCenter = { note: string; hz: number };

function hzToNote(hz: number): string {
  const A4 = 440;
  const semis = Math.round(12 * Math.log2(hz / A4)) + 57; // MIDI 69 = A4 → semis 57 from C0
  const octave = Math.floor(semis / 12);
  const name = NOTES[((semis % 12) + 12) % 12];
  return `${name}${octave}`;
}

function autocorrPitch(samples: Float32Array, sr: number): number | null {
  const minHz = 70, maxHz = 600;
  const minLag = Math.floor(sr / maxHz), maxLag = Math.floor(sr / minHz);
  // RMS gate
  let rms = 0; for (let i = 0; i < samples.length; i += 16) rms += samples[i] * samples[i];
  if (Math.sqrt(rms / (samples.length / 16)) < 0.005) return null;

  let bestLag = -1, bestVal = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const n = samples.length - lag;
    for (let i = 0; i < n; i += 2) sum += samples[i] * samples[i + lag];
    if (sum > bestVal) { bestVal = sum; bestLag = lag; }
  }
  if (bestLag < 0 || bestVal <= 0) return null;
  return sr / bestLag;
}

export async function detectPitchCenter(file: File, preDecoded?: AudioBuffer | null): Promise<PitchCenter | null> {
  if (typeof window === "undefined") return null;
  try {
    let audio: AudioBuffer | null = preDecoded ?? null;
    if (!audio) {
      const { decodeOnce } = await import("./audioDecode");
      audio = await decodeOnce(file);
    }
    if (!audio) return null;

    const ch = audio.numberOfChannels, len = audio.length;
    const mono = new Float32Array(len);
    for (let c = 0; c < ch; c++) {
      const data = audio.getChannelData(c);
      for (let i = 0; i < len; i++) mono[i] += data[i] / ch;
    }
    const sr = audio.sampleRate;
    const winLen = Math.floor(sr * 1.0); // 1s windows
    const totalWindows = Math.min(8, Math.floor(len / winLen));
    if (totalWindows === 0) return null;

    const startBase = Math.max(0, Math.floor((len - totalWindows * winLen) / 2));
    const pitches: number[] = [];
    for (let w = 0; w < totalWindows; w++) {
      const seg = mono.subarray(startBase + w * winLen, startBase + (w + 1) * winLen);
      const p = autocorrPitch(seg, sr);
      if (p && p > 60 && p < 800) pitches.push(p);
    }
    if (pitches.length === 0) return null;
    pitches.sort((a, b) => a - b);
    const median = pitches[Math.floor(pitches.length / 2)];
    return { note: hzToNote(median), hz: median };
  } catch (e) {
    console.warn("[detectPitchCenter] failed", e);
    return null;
  }
}
