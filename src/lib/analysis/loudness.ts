import { kWeight, percentile } from "./dsp";

export type LoudnessResult = {
  integratedLufs: number;
  loudnessRangeLu: number;
  samplePeakDbfs: number;
  crestDb: number;
  /** 95th − 10th percentile of the 1-second curve. Keeps a quiet intro, unlike gated LRA. */
  levelSpanLu: number;
  /** One K-weighted loudness per second, including quiet seconds. No 15% floor. */
  curve: { t: number; lufs: number; power: number }[];
  peak: { t: number; lufs: number };
};

function lufsFromPower(power: number): number {
  if (power <= 1e-12) return -70;
  return -0.691 + 10 * Math.log10(power);
}

function powerFromLufs(lufs: number): number {
  return 10 ** ((lufs + 0.691) / 10);
}

function meanPowerLufs(values: number[]): number {
  if (values.length === 0) return -70;
  let p = 0;
  for (const l of values) p += powerFromLufs(l);
  return lufsFromPower(p / values.length);
}

function channelBlockPower(channels: Float32Array[], start: number, end: number): number {
  const n = Math.max(1, end - start);
  let sum = 0;
  for (const ch of channels) {
    let ms = 0;
    const last = Math.min(end, ch.length);
    for (let i = start; i < last; i++) ms += ch[i] * ch[i];
    sum += ms / n;
  }
  return sum;
}

/**
 * Integrated LUFS (BS.1770 gating) and loudness range (EBU Tech 3342, 3 s / 1 s).
 * Peak is the sample peak, not an oversampled true peak.
 */
export function measureLoudness(channels: Float32Array[], sampleRate: number): LoudnessResult {
  const filtered = channels.map((ch) => kWeight(ch, sampleRate));
  const len = filtered[0]?.length ?? 0;
  const block = Math.max(1, Math.round(0.4 * sampleRate));
  const hop = Math.max(1, Math.round(0.1 * sampleRate));
  const blocks: number[] = [];
  if (len < block) {
    blocks.push(lufsFromPower(channelBlockPower(filtered, 0, len)));
  } else {
    for (let i = 0; i + block <= len; i += hop) {
      blocks.push(lufsFromPower(channelBlockPower(filtered, i, i + block)));
    }
  }
  const absolute = blocks.filter((l) => l > -70);
  const absIntegrated = meanPowerLufs(absolute.length ? absolute : blocks);
  const relativeCut = absIntegrated - 10;
  const relative = (absolute.length ? absolute : blocks).filter((l) => l > relativeCut);
  const integratedLufs = meanPowerLufs(relative.length ? relative : absolute);

  const stBlock = Math.max(1, Math.round(3 * sampleRate));
  const stHop = Math.max(1, Math.round(sampleRate));
  const shortTerm: number[] = [];
  if (len >= stBlock) {
    for (let i = 0; i + stBlock <= len; i += stHop) {
      shortTerm.push(lufsFromPower(channelBlockPower(filtered, i, i + stBlock)));
    }
  }
  const stAbs = shortTerm.filter((l) => l > -70);
  const stRef = meanPowerLufs(stAbs.length ? stAbs : shortTerm);
  const stGated = (stAbs.length ? stAbs : shortTerm).filter((l) => l >= stRef - 20);
  const sorted = [...(stGated.length ? stGated : stAbs)].sort((a, b) => a - b);
  const loudnessRangeLu =
    sorted.length >= 2 ? Math.max(0, percentile(sorted, 0.95) - percentile(sorted, 0.1)) : 0;

  let peak = 0;
  let sumSq = 0;
  let count = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const a = ch[i] < 0 ? -ch[i] : ch[i];
      if (a > peak) peak = a;
      sumSq += ch[i] * ch[i];
      count++;
    }
  }
  const samplePeakDbfs = peak > 0 ? 20 * Math.log10(peak) : -120;
  const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -120;
  const crestDb = samplePeakDbfs - rmsDb;

  const sec = Math.max(1, Math.round(sampleRate));
  const curve: LoudnessResult["curve"] = [];
  for (let i = 0, t = 0; i < len; i += sec, t++) {
    const power = channelBlockPower(filtered, i, Math.min(len, i + sec));
    curve.push({ t, lufs: Math.max(-70, lufsFromPower(power)), power });
  }
  if (curve.length === 0) curve.push({ t: 0, lufs: -70, power: 0 });
  let peakPoint = curve[0];
  for (const row of curve) if (row.lufs > peakPoint.lufs) peakPoint = row;
  const audible = curve
    .map((row) => row.lufs)
    .filter((l) => l > -70)
    .sort((a, b) => a - b);
  const levelSpanLu =
    audible.length >= 2 ? percentile(audible, 0.95) - percentile(audible, 0.1) : 0;

  return {
    integratedLufs: Math.round(integratedLufs * 10) / 10,
    loudnessRangeLu: Math.round(loudnessRangeLu * 10) / 10,
    samplePeakDbfs: Math.round(samplePeakDbfs * 10) / 10,
    crestDb: Math.round(crestDb * 10) / 10,
    levelSpanLu: Math.round(levelSpanLu * 10) / 10,
    curve,
    peak: { t: peakPoint.t, lufs: Math.round(peakPoint.lufs * 10) / 10 },
  };
}
