import { useEffect, useRef } from "react";

export type AudioMetrics = {
  waveform: Uint8Array; // time-domain (0..255, center 128)
  frequency: Uint8Array; // freq-domain
  volume: number; // 0..1 RMS
  bass: number; // 0..1
  mid: number; // 0..1
  treble: number; // 0..1
  transient: number; // 0..1, decays
  peak: number; // 0..1 waveform peak-to-peak
  ready: boolean;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Web Audio API analyser hooked to an <audio> element.
 * Exposes refs (no per-frame React re-renders).
 *
 * Call ensureGraph() inside a user gesture (Play tap) so mobile browsers unlock.
 */
export function useAudioAnalyser(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isReadyRef = useRef(false);
  const rafRef = useRef(0);

  const metricsRef = useRef<AudioMetrics>({
    waveform: new Uint8Array(0),
    frequency: new Uint8Array(0),
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    transient: 0,
    peak: 0,
    ready: false,
  });

  const ensureGraph = () => {
    const audio = audioRef.current;
    if (!audio || ctxRef.current) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      ctxRef.current = ctx;
      sourceRef.current = source;
      analyserRef.current = analyser;

      const wave = new Uint8Array(analyser.fftSize);
      const freq = new Uint8Array(analyser.frequencyBinCount);
      metricsRef.current.waveform = wave;
      metricsRef.current.frequency = freq;
      metricsRef.current.ready = true;
      isReadyRef.current = true;

      let prevBass = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(wave);
        analyser.getByteFrequencyData(freq);

        // peak-to-peak + RMS from waveform
        let min = 255;
        let max = 0;
        let sumSq = 0;
        const stride = 4;
        let count = 0;
        for (let i = 0; i < wave.length; i += stride) {
          const v = wave[i];
          if (v < min) min = v;
          if (v > max) max = v;
          const c = (v - 128) / 128;
          sumSq += c * c;
          count++;
        }
        const peak = (max - min) / 255;
        const rms = Math.sqrt(sumSq / Math.max(1, count));

        // bands
        const n = freq.length;
        const bassEnd = Math.floor(n * 0.08);
        const midEnd = Math.floor(n * 0.35);
        let bSum = 0;
        let mSum = 0;
        let tSum = 0;
        for (let i = 0; i < bassEnd; i++) bSum += freq[i];
        for (let i = bassEnd; i < midEnd; i++) mSum += freq[i];
        for (let i = midEnd; i < n; i++) tSum += freq[i];
        const bass = bSum / Math.max(1, bassEnd) / 255;
        const mid = mSum / Math.max(1, midEnd - bassEnd) / 255;
        const treble = tSum / Math.max(1, n - midEnd) / 255;

        const m = metricsRef.current;
        // attack faster than release for natural envelopes
        const aFast = 0.35;
        const aSlow = 0.16;
        m.peak = lerp(m.peak, peak, peak > m.peak ? aFast : aSlow);
        m.volume = lerp(m.volume, rms, rms > m.volume ? aFast : aSlow);
        m.bass = lerp(m.bass, bass, bass > m.bass ? aFast : aSlow);
        m.mid = lerp(m.mid, mid, mid > m.mid ? 0.28 : aSlow);
        m.treble = lerp(m.treble, treble, treble > m.treble ? 0.4 : 0.22);

        // transient: positive delta on bass, with decay
        const delta = Math.max(0, bass - prevBass);
        const burst = clamp01(delta * 6);
        m.transient = Math.max(m.transient * 0.86, burst);
        prevBass = bass;

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn("[useAudioAnalyser] analyser unavailable", e);
    }
  };

  const resume = async () => {
    const ctx = ctxRef.current;
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn("[useAudioAnalyser] resume failed", e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      isReadyRef.current = false;
    };
  }, []);

  return { analyserRef, metricsRef, ensureGraph, resume, isReadyRef };
}
