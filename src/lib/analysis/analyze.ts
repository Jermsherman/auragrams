import { clamp, downsample, fft, hashMono, mixMono } from "./dsp";
import { measureLoudness } from "./loudness";
import {
  confidenceLabel,
  disambiguateKey,
  homeProfile,
  isPitched,
  matchKey,
  summarizeKey,
  tensionFromChroma,
  type SecondChroma,
} from "./key";
import { estimateTempo, tempoBandFromBpm, type Feel } from "./tempo";
import { suggestMoodsDetailed, type MoodScore } from "../moodDetect";

export const ANALYSIS_VERSION = 2;

export type ConfidenceLabel = "high" | "medium" | "low" | "none";

export type TrackAnalysis = {
  version: typeof ANALYSIS_VERSION;
  contentHash: string;
  durationSec: number;
  sampleRate: number;
  timeline: {
    t: number;
    lufs: number;
    centroidHz: number;
    lowEndShare: number;
    onset: number;
  }[];
  bpm: number | null;
  bpmConfidence: number;
  feel: Feel;
  swingRatio: number | null;
  tempoLabel: "Slow" | "Mid" | "Fast" | "Unclear";
  key: {
    label: string | null;
    display: string;
    tonic: string | null;
    mode: "major" | "minor" | null;
    confidence: number;
    confidenceLabel: ConfidenceLabel;
    pitched: boolean;
    changes: { atSec: number; label: string; confidence: number }[];
    method: string;
  };
  loudness: {
    integratedLufs: number;
    loudnessRangeLu: number;
    samplePeakDbfs: number;
    crestDb: number;
    levelSpanLu: number;
    method: string;
  };
  energyCurve: { t: number; lufs: number }[];
  energyPeak: { t: number; lufs: number };
  lowEnd: { shareBelow120Hz: number; method: string };
  width: {
    correlation: number | null;
    sideToMidDb: number | null;
    label: "mono" | "narrow" | "wide" | "unknown";
    method: string;
  };
  vocals: {
    status: "not_sure";
    presence: { t: number; probability: number }[];
    method: string;
    note: string;
  };
  sections: { startSec: number; endSec: number; label: string; confidence: number }[];
  moment: { startSec: number; durationSec: number; reason: string } | null;
  tension: { t: number; value: number }[];
  brightnessHz: number;
  fingerprint: { id: string; text: string; value: number; norm: number; unit: string }[];
  moods: MoodScore[];
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    shadow: string;
    glow: string;
    particle: string;
    swatches: string[];
  };
  paletteBecause: string[];
  auraName: string;
  read: { affirm: string; surprise: string | null; text: string; evidence: string[] };
};

const FRAME = 2048;
const HOP = 512;

export type PcmInput = {
  sampleRate: number;
  channels: Float32Array[];
};

function emptyChroma(): number[] {
  return new Array(12).fill(0);
}

function spectralFrame(
  mono: Float32Array,
  offset: number,
  sampleRate: number,
  prevMag: Float32Array | null,
): {
  mag: Float32Array;
  flux: number;
  chroma: number[];
  flatness: number;
  centroidNum: number;
  power: number;
  lowPower: number;
} {
  const re = new Float32Array(FRAME);
  const im = new Float32Array(FRAME);
  for (let i = 0; i < FRAME; i++) {
    const s = mono[offset + i] ?? 0;
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1));
    re[i] = s * w;
  }
  fft(re, im);
  const bins = FRAME / 2;
  const mag = new Float32Array(bins);
  const chroma = emptyChroma();
  let flux = 0;
  let logSum = 0;
  let linSum = 0;
  let centroidNum = 0;
  let power = 0;
  let lowPower = 0;
  const binHz = sampleRate / FRAME;
  const toneBins = Math.max(1, bins - 1);
  for (let k = 1; k < bins; k++) {
    const m = Math.hypot(re[k], im[k]);
    mag[k] = m;
    const p = m * m;
    const hz = k * binHz;
    power += p;
    centroidNum += hz * p;
    if (hz < 120) lowPower += p;
    if (prevMag && m > prevMag[k]) flux += m - prevMag[k];
    if (hz >= 80 && hz <= 5000) {
      linSum += m;
      logSum += Math.log(m + 1e-12);
    }
  }
  // A 2048-point FFT at 22050 Hz is about 11 Hz per bin. E2 (82 Hz) then sits
  // closer to the F bin than the E bin, so a dominant root is counted as the
  // submediant and F major beats A minor. Interpolate each peak's frequency
  // before naming the pitch class. Peaks under the frame floor are noise.
  let maxMag = 0;
  for (let k = 1; k < bins; k++) if (mag[k] > maxMag) maxMag = mag[k];
  const floor = maxMag * 0.08;
  for (let k = 2; k < bins - 1; k++) {
    const m = mag[k];
    if (m < floor || m < mag[k - 1] || m < mag[k + 1]) continue;
    const hz0 = k * binHz;
    if (hz0 < 70 || hz0 > 5000) continue;
    const a = Math.log(mag[k - 1] + 1e-12);
    const b = Math.log(m + 1e-12);
    const c = Math.log(mag[k + 1] + 1e-12);
    const denom = a - 2 * b + c;
    const delta = Math.abs(denom) < 1e-12 ? 0 : clamp(0.5 * (a - c) / denom, -0.5, 0.5);
    const hz = (k + delta) * binHz;
    const midi = 69 + 12 * Math.log2(hz / 440);
    const nearest = Math.round(midi);
    const dist = Math.abs(midi - nearest);
    if (dist > 0.5) continue;
    const pc = ((nearest % 12) + 12) % 12;
    chroma[pc] += m * m * Math.cos(dist * Math.PI);
  }
  const flatness = linSum > 0 ? Math.exp(logSum / toneBins) / (linSum / toneBins) : 1;
  return { mag, flux, chroma, flatness, centroidNum, power, lowPower };
}

function widthOf(channels: Float32Array[]): TrackAnalysis["width"] {
  const method = "Pearson correlation and side/mid energy, measured before the mono sum.";
  if (channels.length < 2) {
    return { correlation: 1, sideToMidDb: -80, label: "mono", method };
  }
  const l = channels[0];
  const r = channels[1];
  const n = Math.min(l.length, r.length);
  let ll = 0;
  let rr = 0;
  let lr = 0;
  let midE = 0;
  let sideE = 0;
  for (let i = 0; i < n; i += 2) {
    const a = l[i];
    const b = r[i];
    ll += a * a;
    rr += b * b;
    lr += a * b;
    const mid = (a + b) * 0.5;
    const side = (a - b) * 0.5;
    midE += mid * mid;
    sideE += side * side;
  }
  if (ll <= 1e-12 || rr <= 1e-12) {
    return { correlation: null, sideToMidDb: null, label: "unknown", method };
  }
  const correlation = clamp(lr / Math.sqrt(ll * rr), -1, 1);
  const sideToMidDb = midE > 1e-12 ? 10 * Math.log10((sideE + 1e-12) / midE) : -80;
  let label: TrackAnalysis["width"]["label"] = "narrow";
  if (correlation > 0.95 && sideToMidDb < -20) label = "mono";
  else if (correlation < 0.45 || sideToMidDb > -6) label = "wide";
  return {
    correlation: Math.round(correlation * 100) / 100,
    sideToMidDb: Math.round(sideToMidDb * 10) / 10,
    label,
    method,
  };
}

function sectionsFrom(
  timeline: TrackAnalysis["timeline"],
  duration: number,
): TrackAnalysis["sections"] {
  if (timeline.length === 0) {
    return [{ startSec: 0, endSec: duration, label: "Section", confidence: 0.2 }];
  }
  const bounds = [0];
  for (let i = 1; i < timeline.length; i++) {
    const jump = timeline[i].lufs - timeline[i - 1].lufs;
    const prev = i > 1 ? timeline[i - 1].lufs - timeline[i - 2].lufs : 0;
    if (Math.abs(jump) >= 6 && Math.abs(jump) > Math.abs(prev)) bounds.push(timeline[i].t);
  }
  bounds.push(Math.max(duration, timeline[timeline.length - 1].t + 1));
  const unique = [...new Set(bounds)].sort((a, b) => a - b);
  const withMean: {
    startSec: number;
    endSec: number;
    label: string;
    confidence: number;
    mean: number;
  }[] = [];
  for (let i = 0; i < unique.length - 1; i++) {
    const startSec = unique[i];
    const endSec = unique[i + 1];
    if (endSec - startSec < 1 && i < unique.length - 2) continue;
    const rows = timeline.filter((row) => row.t >= startSec && row.t < endSec);
    const mean = rows.reduce((s, row) => s + row.lufs, 0) / Math.max(1, rows.length);
    withMean.push({ startSec, endSec, label: "Section", confidence: 0.45, mean });
  }
  let dropAt = -1;
  let dropJump = 0;
  for (let i = 1; i < withMean.length; i++) {
    const jump = withMean[i].mean - withMean[i - 1].mean;
    if (jump > dropJump) {
      dropJump = jump;
      dropAt = i;
    }
  }
  if (dropAt > 0 && dropJump >= 6) {
    withMean[dropAt].label = "Drop";
    withMean[dropAt].confidence = dropJump >= 12 ? 0.8 : 0.6;
    const before = withMean[dropAt - 1];
    const beforeRows = timeline.filter((row) => row.t >= before.startSec && row.t < before.endSec);
    if (beforeRows.length >= 3) {
      const rise = beforeRows[beforeRows.length - 1].lufs - beforeRows[0].lufs;
      if (rise > 3) {
        before.label = "Build";
        before.confidence = 0.55;
      }
    }
  }
  if (withMean.length > 1 && withMean[0].label === "Section") {
    const rest = withMean.slice(1).reduce((s, seg) => s + seg.mean, 0) / (withMean.length - 1);
    if (rest - withMean[0].mean > 6) {
      withMean[0].label = "Intro";
      withMean[0].confidence = 0.6;
    }
  }
  return withMean.map(({ mean: _mean, ...seg }) => seg);
}

function momentOf(
  curve: { t: number; power: number }[],
  duration: number,
): TrackAnalysis["moment"] {
  if (curve.length === 0) return null;
  const span = 8;
  let bestT = 0;
  let best = -Infinity;
  const lastStart = Math.max(0, Math.floor(duration - span));
  for (let start = 0; start <= lastStart; start++) {
    let p = 0;
    let n = 0;
    for (const row of curve) {
      if (row.t >= start && row.t < start + span) {
        p += row.power;
        n++;
      }
    }
    const mean = n ? p / n : 0;
    if (mean > best) {
      best = mean;
      bestT = start;
    }
  }
  return {
    startSec: bestT,
    durationSec: Math.min(span, duration),
    reason: "Highest 8-second average of K-weighted power.",
  };
}

export const VOCAL_NOTE =
  "No voice model is running. Essentia MusiCNN is AGPL with non-commercial weights, so it is not used. YAMNet (Apache-2.0) only tags AudioSet events such as Singing; it is not a music voice-versus-instrumental model and is not shipped. Until a permissively licensed music model is confirmed, this stays Not sure.";

function fingerprintOf(input: {
  lufs: number;
  lra: number;
  lowEnd: number;
  correlation: number | null;
  centroid: number;
}): TrackAnalysis["fingerprint"] {
  const rows: {
    id: string;
    value: number;
    norm: number;
    sigma: number;
    unit: string;
    text: string;
  }[] = [
    {
      id: "integrated_lufs",
      value: input.lufs,
      norm: -14,
      sigma: 5,
      unit: "LUFS",
      text: `Integrated loudness is ${input.lufs.toFixed(1)} LUFS, against a -14 LUFS streaming reference.`,
    },
    {
      id: "level_span",
      value: input.lra,
      norm: 8,
      sigma: 4,
      unit: "LU",
      text: `The loudness curve spans ${input.lra.toFixed(1)} LU from quiet to loud, against an 8 LU reference.`,
    },
    {
      id: "low_end",
      value: input.lowEnd,
      norm: 0.3,
      sigma: 0.12,
      unit: "share",
      text: `${Math.round(input.lowEnd * 100)}% of the spectral energy is below 120 Hz, against a 30% reference.`,
    },
    {
      id: "centroid_hz",
      value: input.centroid,
      norm: 1800,
      sigma: 900,
      unit: "Hz",
      text: `Spectral centroid is ${Math.round(input.centroid)} Hz, against an 1800 Hz reference.`,
    },
  ];
  if (input.correlation != null) {
    rows.push({
      id: "width_correlation",
      value: input.correlation,
      norm: 0.75,
      sigma: 0.25,
      unit: "correlation",
      text: `Left/right correlation is ${input.correlation.toFixed(2)}, against a 0.75 reference.`,
    });
  }
  return rows
    .map((row) => ({ ...row, z: Math.abs(row.value - row.norm) / row.sigma }))
    .filter((row) => row.z >= 1)
    .sort((a, b) => b.z - a.z)
    .slice(0, 3)
    .map(({ z: _z, sigma: _sigma, ...row }) => row);
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const hex = (v: number) =>
    Math.round(clamp(v + m, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

const TONIC_WORD = [
  "Crimson",
  "Amber",
  "Gold",
  "Chartreuse",
  "Verdant",
  "Teal",
  "Cyan",
  "Azure",
  "Indigo",
  "Violet",
  "Magenta",
  "Rose",
];
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function clockLabel(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The free Read cites only key, tempo, and section boundaries. Pro measurements stay in their own rows. */
function freeRead(
  affirm: string,
  changes: { atSec: number; label: string }[],
  sections: { startSec: number; label: string }[],
) {
  const evidence = ["key", "bpm"];
  let surprise: string | null = null;
  const change = changes[0];
  if (change) {
    surprise = `${change.label} at ${clockLabel(change.atSec)}.`;
    evidence.push("sections");
  } else {
    const marked = sections.find((section) => section.label === "Drop" || section.label === "Build");
    if (marked) {
      surprise = `${marked.label} at ${clockLabel(marked.startSec)}.`;
      evidence.push("sections");
    }
  }
  return {
    affirm,
    surprise,
    text: surprise ? `${affirm} ${surprise}` : affirm,
    evidence,
  };
}

function present(partial: {
  keyLabel: string | null;
  tonic: string | null;
  mode: "major" | "minor" | null;
  keyConfidence: number;
  pitched: boolean;
  bpm: number | null;
  bpmConfidence: number;
  feel: Feel;
  swingRatio: number | null;
  tempoLabel: TrackAnalysis["tempoLabel"];
  centroid: number;
  flatness: number;
  fingerprint: TrackAnalysis["fingerprint"];
}): Pick<TrackAnalysis, "palette" | "paletteBecause" | "auraName" | "read"> {
  const pc = partial.tonic ? NOTES.indexOf(partial.tonic) : -1;
  let hue = 250;
  const because: string[] = [];
  if (partial.pitched && pc >= 0) {
    hue = pc * 30;
    because.push(`Primary hue follows the tonic ${partial.tonic} (${hue}°).`);
  } else {
    const x = clamp(
      (Math.log2(Math.max(80, partial.centroid)) - Math.log2(200)) /
        (Math.log2(4000) - Math.log2(200)),
      0,
      1,
    );
    hue = 250 - x * 210;
    because.push(
      `Primary hue follows brightness (${Math.round(partial.centroid)} Hz) because the key is unclear.`,
    );
  }
  const lightness = partial.mode === "minor" ? 0.4 : partial.mode === "major" ? 0.54 : 0.47;
  if (partial.mode) {
    because.push(
      `Lightness is ${partial.mode === "minor" ? "lower" : "higher"} because the mode is ${partial.mode}.`,
    );
  }
  const sat = clamp(0.82 - partial.flatness, 0.38, 0.78);
  because.push("Saturation follows how tonal the spectrum is, not a random palette.");
  const primary = hslToHex(hue, sat, lightness);
  const secondary = hslToHex(hue + 28, sat * 0.85, lightness * 0.82);
  const accent = hslToHex(hue - 18, sat, Math.min(0.72, lightness + 0.14));
  const shadow = hslToHex(hue, sat * 0.45, 0.12);
  const glow = hslToHex(hue, sat * 0.35, 0.78);
  const particle = hslToHex(hue + 36, sat * 0.7, 0.8);

  let first = "Haze";
  if (partial.pitched && pc >= 0) first = TONIC_WORD[pc];
  else if (partial.centroid < 800) first = "Ash";
  else if (partial.centroid > 2500) first = "Glint";
  let second = "Open";
  if (partial.feel === "swung" && partial.bpmConfidence >= 0.35) second = "Swing";
  else if (partial.tempoLabel === "Slow") second = "Hush";
  else if (partial.tempoLabel === "Fast") second = "Pulse";
  else if (partial.tempoLabel === "Mid") second = "Drift";

  const evidence: string[] = [];
  const bits: string[] = [];
  if (partial.pitched && partial.keyLabel && partial.keyConfidence >= 0.3) {
    bits.push(partial.keyLabel);
  } else {
    bits.push("Key unclear");
  }
  evidence.push("key");
  if (partial.bpm != null && partial.bpmConfidence >= 0.35) {
    const feelBit =
      partial.feel === "swung" && partial.swingRatio != null
        ? `swung (${Math.round(partial.swingRatio * 100)}%)`
        : partial.feel === "straight"
          ? "straight"
          : partial.feel;
    bits.push(`${Math.round(partial.bpm)} BPM, ${feelBit}`);
    evidence.push("bpm", "feel");
  } else {
    bits.push("tempo unclear");
    evidence.push("bpm");
  }
  const affirm = `${bits.join(". ")}.`.replace("..", ".");
  const surpriseRow = partial.fingerprint[0];
  const surprise = surpriseRow ? surpriseRow.text : null;
  if (surpriseRow) evidence.push(surpriseRow.id);
  return {
    palette: {
      primary,
      secondary,
      accent,
      shadow,
      glow,
      particle,
      swatches: [primary, secondary, accent, glow],
    },
    paletteBecause: because,
    auraName: `${first} ${second}`,
    read: { affirm, surprise, text: surprise ? `${affirm} ${surprise}` : affirm, evidence },
  };
}

export async function analyzePcm(input: PcmInput): Promise<TrackAnalysis> {
  const sampleRate = input.sampleRate;
  const channels = input.channels.length ? input.channels : [new Float32Array(0)];
  const monoFull = mixMono(channels);
  const durationSec = sampleRate > 0 ? monoFull.length / sampleRate : 0;
  const contentHash = await hashMono(monoFull);
  const { data: mono, sampleRate: fftRate } = downsample(monoFull, sampleRate);

  const perSecond = new Map<
    number,
    {
      chroma: number[];
      flat: number;
      frames: number;
      flux: number;
      centroidNum: number;
      power: number;
      lowPower: number;
    }
  >();
  const onset: number[] = [];
  let prevMag: Float32Array | null = null;
  let flatSum = 0;
  let flatN = 0;
  let totalPower = 0;
  let totalLow = 0;
  let totalCentroid = 0;

  for (let off = 0; off + FRAME <= mono.length; off += HOP) {
    const frame = spectralFrame(mono, off, fftRate, prevMag);
    prevMag = frame.mag;
    onset.push(frame.flux);
    const t = Math.floor(off / fftRate);
    let bucket = perSecond.get(t);
    if (!bucket) {
      bucket = {
        chroma: emptyChroma(),
        flat: 0,
        frames: 0,
        flux: 0,
        centroidNum: 0,
        power: 0,
        lowPower: 0,
      };
      perSecond.set(t, bucket);
    }
    for (let i = 0; i < 12; i++) bucket.chroma[i] += frame.chroma[i];
    bucket.flat += frame.flatness;
    bucket.frames++;
    bucket.flux += frame.flux;
    bucket.centroidNum += frame.centroidNum;
    bucket.power += frame.power;
    bucket.lowPower += frame.lowPower;
    flatSum += frame.flatness;
    flatN++;
    totalPower += frame.power;
    totalLow += frame.lowPower;
    totalCentroid += frame.centroidNum;
  }

  const seconds: SecondChroma[] = [...perSecond.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, bucket]) => {
      const mean = bucket.chroma.reduce((s, v) => s + v, 0) / 12;
      return {
        t,
        chroma: bucket.chroma,
        flatness: bucket.frames ? bucket.flat / bucket.frames : 1,
        peakiness: mean > 0 ? Math.max(...bucket.chroma) / mean : 0,
      };
    });

  const tempo = estimateTempo(Float32Array.from(onset), HOP / fftRate);
  const tempoLabel = tempoBandFromBpm(tempo.bpm, tempo.confidence);
  let key = summarizeKey(seconds);
  const loudness = measureLoudness(channels, sampleRate);
  const width = widthOf(channels);
  const lowEndShare = totalPower > 0 ? totalLow / totalPower : 0;
  const brightnessHz = totalPower > 0 ? totalCentroid / totalPower : 0;
  const meanFlat = flatN ? flatSum / flatN : 1;

  const globalChroma = seconds.reduce((acc, sec) => {
    for (let i = 0; i < 12; i++) acc[i] += sec.chroma[i];
    return acc;
  }, emptyChroma());
  const global = matchKey(globalChroma);
  const globallyPitched = global ? isPitched(meanFlat, global.peakiness, global.score) : false;
  if (
    !key.pitched &&
    globallyPitched &&
    global &&
    global.confidence >= 0.3 &&
    global.score >= 0.55
  ) {
    key = disambiguateKey(seconds, {
      label: global.label,
      tonic: global.tonic,
      mode: global.mode,
      confidence: global.confidence,
      confidenceLabel: confidenceLabel(global.confidence),
      pitched: true,
      display: global.label,
      changes: [],
    });
  }
  if (!globallyPitched && !key.pitched) {
    key = {
      label: null,
      tonic: null,
      mode: null,
      confidence: 0,
      confidenceLabel: "none",
      pitched: false,
      display: "Key unclear",
      changes: [],
    };
  }

  const timeline: TrackAnalysis["timeline"] = loudness.curve.map((row) => {
    const spec = perSecond.get(row.t);
    return {
      t: row.t,
      lufs: Math.round(row.lufs * 10) / 10,
      centroidHz: spec && spec.power > 0 ? Math.round(spec.centroidNum / spec.power) : 0,
      lowEndShare:
        spec && spec.power > 0 ? Math.round((spec.lowPower / spec.power) * 100) / 100 : 0,
      onset: spec ? Math.round(spec.flux * 1000) / 1000 : 0,
    };
  });

  let tension: TrackAnalysis["tension"] = [];
  if (key.pitched && key.tonic && key.mode && key.confidence >= 0.3) {
    const profile = homeProfile(key.tonic, key.mode);
    tension = seconds.map((sec) => ({
      t: sec.t,
      value: Math.round(tensionFromChroma(sec.chroma, profile) * 100) / 100,
    }));
  }

  const duration = Math.max(durationSec, timeline.length);
  const sectionList = sectionsFrom(timeline, duration);
  const fingerprint = fingerprintOf({
    lufs: loudness.integratedLufs,
    lra: loudness.levelSpanLu,
    lowEnd: lowEndShare,
    correlation: width.correlation,
    centroid: brightnessHz,
  });
  const onsetRate = durationSec > 0 ? onset.filter((v) => v > 0).length / durationSec : 0;
  const densityScore = clamp(onsetRate / 40, 0, 1);
  const moods = suggestMoodsDetailed({
    features: {
      energy:
        tempo.bpm == null || tempo.confidence < 0.35
          ? 50
          : clamp(((tempo.bpm - 60) / 100) * 100, 0, 100),
      brightness: clamp(
        (Math.log2(Math.max(80, brightnessHz)) - Math.log2(200)) /
          (Math.log2(4000) - Math.log2(200)),
        0,
        1,
      ),
      densityScore,
      softnessScore: 1 - densityScore,
      aggressionScore: densityScore,
    },
    keyDetection:
      key.label && key.confidence >= 0.35
        ? { key: key.label, mode: key.mode ?? undefined, confidence: key.confidence }
        : null,
  });

  const shown = present({
    keyLabel: key.label,
    tonic: key.tonic,
    mode: key.mode,
    keyConfidence: key.confidence,
    pitched: key.pitched,
    bpm: tempo.bpm,
    bpmConfidence: tempo.confidence,
    feel: tempo.feel,
    swingRatio: tempo.swingRatio,
    tempoLabel,
    centroid: brightnessHz,
    flatness: meanFlat,
    fingerprint,
  });
  shown.read = freeRead(shown.read.affirm, key.changes, sectionList);

  return {
    version: ANALYSIS_VERSION,
    contentHash,
    durationSec: Math.round(durationSec * 100) / 100,
    sampleRate,
    timeline,
    bpm: tempo.bpm,
    bpmConfidence: Math.round(tempo.confidence * 100) / 100,
    feel: tempo.feel,
    swingRatio: tempo.swingRatio,
    tempoLabel,
    key: {
      ...key,
      confidence: Math.round(key.confidence * 100) / 100,
      changes: key.changes.map((c) => ({ ...c, confidence: Math.round(c.confidence * 100) / 100 })),
      method:
        "Krumhansl profile on peak-interpolated FFT chroma, 8-second windows, whole track. Relative and submediant keys are separated with the leading tone and V–I / V–i resolutions. Unpitched audio is not given a key.",
    },
    loudness: {
      integratedLufs: loudness.integratedLufs,
      loudnessRangeLu: loudness.loudnessRangeLu,
      samplePeakDbfs: loudness.samplePeakDbfs,
      crestDb: loudness.crestDb,
      levelSpanLu: loudness.levelSpanLu,
      method:
        "BS.1770 K-weighted gated loudness. Loudness range is EBU R128-style and can ignore a quiet intro. Level span is the 10th-to-95th percentile of the 1-second curve. Sample peak, not oversampled true peak.",
    },
    energyCurve: timeline.map((row) => ({ t: row.t, lufs: row.lufs })),
    energyPeak: loudness.peak,
    lowEnd: {
      shareBelow120Hz: Math.round(lowEndShare * 100) / 100,
      method: "Share of FFT power below 120 Hz over the whole track.",
    },
    width,
    vocals: { status: "not_sure", presence: [], method: "none", note: VOCAL_NOTE },
    sections: sectionList,
    moment: momentOf(loudness.curve, duration),
    tension,
    brightnessHz: Math.round(brightnessHz),
    fingerprint,
    moods,
    ...shown,
  };
}

export function analysisFromAudioBuffer(audio: {
  sampleRate: number;
  numberOfChannels: number;
  getChannelData: (channel: number) => Float32Array;
}): Promise<TrackAnalysis> {
  const channels: Float32Array[] = [];
  for (let c = 0; c < audio.numberOfChannels; c++) channels.push(audio.getChannelData(c));
  return analyzePcm({ sampleRate: audio.sampleRate, channels });
}
