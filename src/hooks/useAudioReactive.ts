import { useEffect, useRef, useState } from "react";

/**
 * Connects an HTMLAudioElement to a Web Audio AnalyserNode so the orb can
 * read both time-domain (waveform) and frequency-domain (FFT) data.
 */
export function useAudioReactive(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [ready, setReady] = useState(false);

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
      // Larger FFT → smoother waveform reads, more frequency bins.
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      sourceRef.current = source;
      analyserRef.current = analyser;
      setReady(true);
    } catch (e) {
      console.warn("Audio analyser unavailable", e);
    }
  };

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return { analyserRef, ensureGraph, ready };
}
