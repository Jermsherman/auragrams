import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzePcm, type TrackAnalysis } from "./analyze";

const SR = 22050;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function silence(sec: number): Float32Array {
  return new Float32Array(Math.floor(SR * sec));
}

function addBurst(x: Float32Array, t0: number, decay: number, amp: number, rng: () => number) {
  const start = Math.floor(t0 * SR);
  const n = Math.floor(decay * SR);
  for (let i = 0; i < n && start + i < x.length; i++) {
    const env = Math.exp((-3 * i) / n);
    x[start + i] += amp * (rng() * 2 - 1) * env;
  }
}

function drums(sec: number, bpm: number, swing: number | null, seed = 1): Float32Array {
  const x = silence(sec);
  const rng = mulberry32(seed);
  const beat = 60 / bpm;
  for (let t = 0.05; t < sec - 0.05; t += beat) {
    addBurst(x, t, 0.045, 0.9, rng);
    if (swing != null) addBurst(x, t + beat * swing, 0.02, 0.45, rng);
  }
  return x;
}

function addTone(x: Float32Array, hz: number, amp: number, startSec: number, endSec: number) {
  const a = Math.floor(startSec * SR);
  const b = Math.min(x.length, Math.floor(endSec * SR));
  const fade = Math.floor(0.03 * SR);
  for (let i = a; i < b; i++) {
    const u = i - a;
    const edge = Math.min(1, u / fade, (b - i) / fade);
    x[i] += amp * edge * Math.sin((2 * Math.PI * hz * i) / SR);
  }
}

const CHORD: Record<string, number[]> = {
  C: [261.63, 329.63, 392],
  Em: [164.81, 196, 246.94],
  E: [164.81, 207.65, 246.94],
  D: [146.83, 220, 293.66],
  Am: [220, 261.63, 329.63],
  Dm: [146.83, 174.61, 220],
  F: [174.61, 220, 261.63],
  G: [196, 246.94, 293.66],
};

function chord(name: string, sec: number, amp = 0.2, start = 0, bass = 1): Float32Array {
  const x = silence(start + sec);
  const tones = CHORD[name];
  for (const hz of tones) {
    addTone(x, hz, amp, start, start + sec);
    addTone(x, hz * 2, amp * 0.45, start, start + sec);
    addTone(x, hz / 2, amp * 0.35 * bass, start, start + sec);
  }
  return x;
}

function concat(parts: Float32Array[]): Float32Array {
  const n = parts.reduce((s, p) => s + p.length, 0);
  const out = new Float32Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function gain(x: Float32Array, g: number): Float32Array {
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
  return y;
}

function sine(hz: number, sec: number, amp: number): Float32Array {
  const x = silence(sec);
  addTone(x, hz, amp, 0, sec);
  return x;
}

async function run(channels: Float32Array[], sampleRate = SR): Promise<TrackAnalysis> {
  return analyzePcm({ sampleRate, channels });
}

function near(actual: number, expected: number, tol: number, label: string) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${label}: expected ${expected} ± ${tol}, got ${actual}`,
  );
}

describe("whole-track analysis", () => {
  it("reads 90, 120, and 140 BPM instead of half time", async () => {
    for (const bpm of [90, 120, 140]) {
      const a = await run([drums(12, bpm, null, bpm)]);
      assert.ok(a.bpm != null, `no bpm for ${bpm}`);
      near(a.bpm, bpm, 2, `${bpm} BPM`);
      assert.ok(a.bpmConfidence >= 0.35, `low confidence ${a.bpmConfidence} at ${bpm}`);
      assert.equal(a.key.display, "Key unclear", `drums at ${bpm} showed ${a.key.display}`);
      assert.equal(a.vocals.status, "not_sure");
    }
  });

  it("keeps the tempo when the middle of the file is silence", async () => {
    const hits = drums(4, 100, null, 3);
    const a = await run([concat([hits, silence(12), hits])]);
    assert.ok(a.bpm != null);
    near(a.bpm, 100, 2, "edge hits");
    assert.ok(a.timeline.length > 16, `timeline only ${a.timeline.length}s`);
  });

  it("measures swing near two-thirds of the beat", async () => {
    const a = await run([drums(12, 100, 0.67, 9)]);
    assert.ok(a.bpm != null);
    near(a.bpm, 100, 2, "swung bpm");
    assert.equal(a.feel, "swung");
    assert.ok(
      a.swingRatio != null && a.swingRatio >= 0.6 && a.swingRatio <= 0.74,
      `swing ${a.swingRatio}`,
    );
  });

  it("names C major and E minor and does not invent a key", async () => {
    const c = await run([chord("C", 10, 0.22)]);
    assert.equal(c.key.display, "C major", `C got ${c.key.display} conf ${c.key.confidence}`);
    assert.ok(c.key.confidence >= 0.35);
    const e = await run([chord("Em", 10, 0.22)]);
    assert.equal(e.key.display, "E minor", `Em got ${e.key.display} conf ${e.key.confidence}`);
    const noise = await run([drums(8, 120, null, 4)]);
    assert.equal(noise.key.display, "Key unclear");
    assert.equal(noise.key.pitched, false);
  });

  it("reports a key change with a timestamp", async () => {
    const a = await run([concat([chord("C", 16, 0.2), chord("D", 16, 0.2)])]);
    assert.equal(a.key.display, "C major", `home ${a.key.display}`);
    const change = a.key.changes.find((c) => c.label === "D major");
    assert.ok(change, `changes ${JSON.stringify(a.key.changes)}`);
    near(change.atSec, 16, 4, "change time");
  });

  it("separates loudness from tempo and keeps the same moods when only gain changes", async () => {
    const music = chord("Am", 8, 0.25);
    const quiet = await run([gain(music, 0.08)]);
    const loud = await run([gain(music, 0.7)]);
    assert.equal(quiet.tempoLabel, loud.tempoLabel);
    assert.ok(loud.loudness.integratedLufs - quiet.loudness.integratedLufs > 12);
    near(quiet.loudness.crestDb, loud.loudness.crestDb, 0.4, "crest is gain-invariant");
    assert.deepEqual(
      quiet.moods.map((m) => m.mood),
      loud.moods.map((m) => m.mood),
    );
    assert.ok(quiet.moods.length >= 2 && quiet.moods.length <= 3);
    const quietNames = new Set(quiet.moods.map((m) => m.mood));
    for (const [a, b] of [
      ["Serene", "Chaotic"],
      ["Euphoric", "Melancholy"],
      ["Gentle", "Tense"],
    ] as const) {
      assert.ok(!(quietNames.has(a) && quietNames.has(b)), `contradiction ${a}/${b}`);
    }
  });

  it("shows the loudness jump, the drop, and the 8 second moment", async () => {
    const a = await run([
      concat([gain(chord("C", 15, 0.2), 0.05), gain(chord("C", 12, 0.2), 0.8)]),
    ]);
    const before = a.energyCurve.find((row) => row.t === 10);
    const after = a.energyCurve.find((row) => row.t === 18);
    assert.ok(before && after);
    assert.ok(after.lufs - before.lufs > 15, `jump ${before.lufs} -> ${after.lufs}`);
    assert.ok(a.energyPeak.t >= 15, `peak at ${a.energyPeak.t}`);
    assert.ok(a.loudness.levelSpanLu > 12, `span ${a.loudness.levelSpanLu}`);
    const boundary = a.sections.some((s) => s.label === "Drop" && Math.abs(s.startSec - 15) <= 2);
    assert.ok(boundary, `sections ${JSON.stringify(a.sections)}`);
    assert.ok(a.moment && a.moment.startSec >= 14, `moment ${a.moment?.startSec}`);
    assert.equal(a.energyCurve.length >= 20, true);
  });

  it("measures mono against wide stereo and low end against a bright tone", async () => {
    const mid = chord("C", 6, 0.2);
    const mono = await run([mid, mid]);
    const detuned = silence(6);
    addTone(detuned, 270, 0.15, 0, 6);
    addTone(detuned, 340, 0.15, 0, 6);
    addTone(detuned, 410, 0.15, 0, 6);
    const wide = await run([mid, detuned]);
    assert.equal(mono.width.label, "mono");
    assert.ok((mono.width.correlation ?? 0) > 0.95);
    assert.equal(wide.width.label, "wide");
    assert.ok((wide.width.correlation ?? 1) < 0.6, `wide corr ${wide.width.correlation}`);

    const bass = await run([sine(80, 4, 0.3)]);
    const high = await run([sine(2000, 4, 0.3)]);
    assert.ok(bass.lowEnd.shareBelow120Hz > 0.7, `bass share ${bass.lowEnd.shareBelow120Hz}`);
    assert.ok(high.lowEnd.shareBelow120Hz < 0.15, `high share ${high.lowEnd.shareBelow120Hz}`);
  });

  it("names A minor on Am-F-G-E and does not swap it for F or C", async () => {
    // Generated here. F and G are louder and the bass is heavy, which used to
    // pull the loop to F major (the submediant) or C major (the relative major).
    const cycle = concat([
      chord("Am", 2, 0.16, 0, 3),
      chord("F", 2, 0.28, 0, 3),
      chord("G", 2, 0.28, 0, 3),
      chord("E", 2, 0.16, 0, 3),
    ]);
    const am = await run([concat([cycle, cycle, cycle, cycle])]);
    assert.equal(am.key.display, "A minor", `Am-F-G-E got ${am.key.display} conf ${am.key.confidence}`);
    assert.ok(am.key.confidence >= 0.3, `confidence ${am.key.confidence}`);

    const turnaround = concat([
      chord("C", 2, 0.2),
      chord("F", 2, 0.2),
      chord("G", 2, 0.2),
      chord("C", 2, 0.2),
    ]);
    const major = await run([concat([turnaround, turnaround, turnaround])]);
    assert.equal(major.key.display, "C major", `I-IV-V-I got ${major.key.display} conf ${major.key.confidence}`);
    assert.ok(major.key.confidence >= 0.3, `C confidence ${major.key.confidence}`);

    const relative = concat([
      chord("Am", 2, 0.2),
      chord("Dm", 2, 0.2),
      chord("E", 2, 0.2),
      chord("Am", 2, 0.2),
    ]);
    const minor = await run([concat([relative, relative, relative])]);
    assert.equal(
      minor.key.display,
      "A minor",
      `relative minor got ${minor.key.display} conf ${minor.key.confidence}`,
    );
    assert.ok(minor.key.confidence >= 0.3, `relative confidence ${minor.key.confidence}`);
  });

  it("raises tension on the E chord in A minor", async () => {
    const loop = concat([
      chord("Am", 2, 0.2),
      chord("F", 2, 0.2),
      chord("G", 2, 0.2),
      chord("E", 2, 0.2),
    ]);
    const a = await run([loop]);
    assert.equal(a.key.display, "A minor", `home ${a.key.display} conf ${a.key.confidence}`);
    const am = a.tension.find((row) => row.t < 2);
    const e = a.tension.find((row) => row.t >= 6 && row.t < 8);
    assert.ok(am && e, `tension ${JSON.stringify(a.tension)} key ${JSON.stringify(a.key)}`);
    assert.ok(e.value > am.value + 0.05, `tension Am ${am.value} E ${e.value}`);
  });

  it("hashes the PCM, so the same audio is the same Aura and a copy matches", async () => {
    const x = drums(6, 90, null, 11);
    const a = await run([x]);
    const b = await run([x]);
    const louder = await run([gain(x, 0.5)]);
    assert.equal(a.contentHash, b.contentHash);
    assert.equal(a.auraName, b.auraName);
    assert.notEqual(a.contentHash, louder.contentHash);
    assert.equal(a.paletteBecause.length > 0, true);
    assert.ok(a.read.evidence.includes("key"));
    assert.equal(a.vocals.status, "not_sure");
    assert.match(a.read.text, /Key unclear|BPM/);
  });

  it("puts a sine near its RMS loudness and a crest near 3 dB", async () => {
    const quiet = await run([sine(997, 3, 0.1)]);
    const loud = await run([sine(997, 3, 0.5)]);
    near(quiet.loudness.crestDb, 3, 0.8, "crest");
    const delta = loud.loudness.integratedLufs - quiet.loudness.integratedLufs;
    near(delta, 20 * Math.log10(5), 1.2, "lufs gain");
    assert.ok(quiet.loudness.loudnessRangeLu < 2, `lra ${quiet.loudness.loudnessRangeLu}`);
  });
});
