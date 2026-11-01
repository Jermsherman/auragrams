// First-party DSP. No Essentia (AGPL) and no Meyda — the FFT below is enough.

export type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlr = Math.cos(ang);
    const wli = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wr = 1;
      let wi = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + half] * wr - im[i + k + half] * wi;
        const vi = re[i + k + half] * wi + im[i + k + half] * wr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + half] = ur - vr;
        im[i + k + half] = ui - vi;
        const nwr = wr * wlr - wi * wli;
        wi = wr * wli + wi * wlr;
        wr = nwr;
      }
    }
  }
}

export function mixMono(channels: Float32Array[]): Float32Array {
  const len = channels[0]?.length ?? 0;
  const mono = new Float32Array(len);
  if (channels.length === 0) return mono;
  const scale = 1 / channels.length;
  for (const ch of channels) {
    for (let i = 0; i < len; i++) mono[i] += ch[i] * scale;
  }
  return mono;
}

/** Boxcar downsample. Analysis FFTs run near 22 kHz; loudness stays at the file rate. */
export function downsample(
  mono: Float32Array,
  sampleRate: number,
  target = 22050,
): {
  data: Float32Array;
  sampleRate: number;
} {
  if (sampleRate <= target * 1.05) return { data: mono, sampleRate };
  const factor = Math.max(2, Math.round(sampleRate / target));
  const n = Math.floor(mono.length / factor);
  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const base = i * factor;
    for (let k = 0; k < factor; k++) s += mono[base + k];
    data[i] = s / factor;
  }
  return { data, sampleRate: sampleRate / factor };
}

export function highShelf(sampleRate: number, f0: number, dbGain: number, q: number): Biquad {
  const a = 10 ** (dbGain / 40);
  const w0 = (2 * Math.PI * f0) / sampleRate;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * q);
  const sqrtA = Math.sqrt(a);
  const b0 = a * (a + 1 + (a - 1) * cos + 2 * sqrtA * alpha);
  const b1 = -2 * a * (a - 1 + (a + 1) * cos);
  const b2 = a * (a + 1 + (a - 1) * cos - 2 * sqrtA * alpha);
  const a0 = a + 1 - (a - 1) * cos + 2 * sqrtA * alpha;
  const a1 = 2 * (a - 1 - (a + 1) * cos);
  const a2 = a + 1 - (a - 1) * cos - 2 * sqrtA * alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

export function highPass(sampleRate: number, f0: number, q: number): Biquad {
  const w0 = (2 * Math.PI * f0) / sampleRate;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const alpha = sin / (2 * q);
  const b0 = (1 + cos) / 2;
  const b1 = -(1 + cos);
  const b2 = (1 + cos) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

export function applyBiquad(x: Float32Array, c: Biquad): Float32Array {
  const y = new Float32Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xn = x[i];
    const yn = c.b0 * xn + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    y[i] = yn;
    x2 = x1;
    x1 = xn;
    y2 = y1;
    y1 = yn;
  }
  return y;
}

/** K-weighting from BS.1770: high shelf then RLB high-pass, designed at this sample rate. */
export function kWeight(x: Float32Array, sampleRate: number): Float32Array {
  const shelf = highShelf(sampleRate, 1681.974450955533, 3.999843853973347, 0.7071752369554196);
  const hp = highPass(sampleRate, 38.13547087602444, 0.5003270373238773);
  return applyBiquad(applyBiquad(x, shelf), hp);
}

const HASH_SAMPLES = 1_500_000;

/**
 * SHA-256 of the mono mix, quantized to int16.
 * Long files are strided by a pure function of length, so the same PCM always hashes the same.
 */
export async function hashMono(mono: Float32Array): Promise<string> {
  const stride = Math.max(1, Math.floor(mono.length / HASH_SAMPLES));
  const n = Math.ceil(mono.length / stride);
  const bytes = new Uint8Array(n * 2);
  const view = new DataView(bytes.buffer);
  let j = 0;
  for (let i = 0; i < mono.length; i += stride) {
    const s = mono[i];
    const q = s < -1 ? -1 : s > 1 ? 1 : s;
    view.setInt16(j, Math.round(q * 32767), true);
    j += 2;
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function seedFromContentHash(hex: string): number {
  const n = Number.parseInt(hex.slice(0, 8), 16);
  if (!Number.isFinite(n)) return 0;
  return n % 360;
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = clamp(p, 0, 1) * (sortedAsc.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] * (hi - idx) + sortedAsc[hi] * (idx - lo);
}
