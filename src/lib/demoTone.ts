// Synthesized demo loop for the landing hero. Created only on a user gesture,
// so mobile browsers unlock audio. Produces content in every band the orb
// reads: sub kick, mid "voice" formants, and transient hats.

export type DemoTone = {
  analyser: AnalyserNode;
  stop: () => void;
};

export function startDemoTone(): DemoTone | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.18;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.82;
  master.connect(analyser);
  analyser.connect(ctx.destination);

  // --- Sustained "voice" pad: two detuned saws through a formant-ish filter.
  const voiceGain = ctx.createGain();
  voiceGain.gain.value = 0.0001;
  const formant = ctx.createBiquadFilter();
  formant.type = "bandpass";
  formant.frequency.value = 900;
  formant.Q.value = 3.2;
  voiceGain.connect(formant);
  formant.connect(master);

  const voices: OscillatorNode[] = [];
  for (const detune of [-7, 6]) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = 220;
    o.detune.value = detune;
    o.connect(voiceGain);
    o.start();
    voices.push(o);
  }
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.frequency.value = 5.2;
  vibratoGain.gain.value = 5;
  vibrato.connect(vibratoGain);
  voices.forEach((v) => vibratoGain.connect(v.detune));
  vibrato.start();

  // --- Noise buffer reused for hats.
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const kick = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.45);
  };

  const hat = (t: number, level = 0.25) => {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(hp);
    hp.connect(g);
    g.connect(master);
    s.start(t);
    s.stop(t + 0.1);
  };

  // Simple 4-bar-ish pattern, scheduled a little ahead of the clock.
  const bpm = 96;
  const beat = 60 / bpm;
  const notes = [220, 261.63, 196, 293.66, 246.94, 174.61, 220, 329.63];
  let step = 0;
  let next = ctx.currentTime + 0.08;

  const schedule = () => {
    while (next < ctx.currentTime + 0.4) {
      const t = next;
      if (step % 4 === 0 || step % 8 === 6) kick(t);
      hat(t, step % 2 === 0 ? 0.22 : 0.1);
      if (step % 2 === 0) {
        const f = notes[(step / 2) % notes.length];
        voices.forEach((v) => v.frequency.setTargetAtTime(f, t, 0.05));
        formant.frequency.setTargetAtTime(650 + (step % 4) * 220, t, 0.08);
        voiceGain.gain.setTargetAtTime(0.16, t, 0.04);
        voiceGain.gain.setTargetAtTime(0.02, t + beat * 0.75, 0.12);
      }
      step = (step + 1) % 32;
      next += beat / 2;
    }
  };

  schedule();
  const timer = window.setInterval(schedule, 120);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    try {
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
      voices.forEach((v) => v.stop(ctx.currentTime + 0.3));
      vibrato.stop(ctx.currentTime + 0.3);
    } catch {
      /* already stopped */
    }
    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 400);
  };

  return { analyser, stop };
}
