import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useAudioAnalyser, type AudioMetrics } from "@/hooks/useAudioAnalyser";
import { getPersonality } from "@/lib/aura";

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  src: string;
  palette?: string;
  showWaveform?: boolean;
  onAnalyserReady?: (analyser: AnalyserNode | null) => void;
  onMetricsReady?: (metrics: React.MutableRefObject<AudioMetrics>) => void;
  onPlayingChange?: (playing: boolean) => void;
};

export function AudioPlayer({
  src,
  palette,
  showWaveform = true,
  onAnalyserReady,
  onMetricsReady,
  onPlayingChange,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { analyserRef, metricsRef, ensureGraph, resume } = useAudioAnalyser(audioRef);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDur(a.duration);
    const onPlay = () => {
      setPlaying(true);
      onPlayingChange?.(true);
    };
    const onPause = () => {
      setPlaying(false);
      onPlayingChange?.(false);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
    };
  }, [onPlayingChange]);

  // Waveform strip canvas
  useEffect(() => {
    if (!showWaveform) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const stops = getPersonality(palette).stops;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const wave = metricsRef.current.waveform;
      const ready = metricsRef.current.ready && wave.length > 0;

      // gradient stroke
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, stops[0]);
      grad.addColorStop(0.5, stops[2]);
      grad.addColorStop(1, stops[4]);

      ctx.lineWidth = 1.4 * dpr;
      ctx.strokeStyle = grad;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.beginPath();
      const mid = h / 2;
      const samples = 220;
      if (ready) {
        const step = wave.length / samples;
        for (let i = 0; i < samples; i++) {
          const v = (wave[Math.floor(i * step)] - 128) / 128; // -1..1
          const x = (i / (samples - 1)) * w;
          const y = mid + v * (h * 0.42);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        // idle line
        const t = performance.now() / 600;
        for (let i = 0; i < samples; i++) {
          const x = (i / (samples - 1)) * w;
          const y = mid + Math.sin(i * 0.18 + t) * (h * 0.06);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // progress overlay
      const pct = dur ? time / dur : 0;
      if (pct > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w * pct, h);
        ctx.clip();
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = `${stops[2]}33`;
        ctx.fillRect(0, 0, w * pct, h);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [showWaveform, palette, metricsRef, time, dur]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    ensureGraph();
    await resume();
    onAnalyserReady?.(analyserRef.current);
    onMetricsReady?.(metricsRef);
    if (a.paused) await a.play();
    else a.pause();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    a.currentTime = Number(e.target.value);
  };

  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto select-none">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid place-items-center h-14 w-14 rounded-full bg-aura-gradient text-primary-foreground shadow-[0_0_40px_-6px_oklch(0.7_0.2_310/0.8)] hover:scale-[1.04] active:scale-[0.98] transition-transform"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
        </button>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="relative h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-aura-gradient rounded-full transition-[width] duration-100"
              style={{ width: `${pct}%` }}
            />
            <input
              type="range"
              min={0}
              max={dur || 0}
              step={0.01}
              value={time}
              onChange={seek}
              aria-label="Seek"
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{fmt(time)}</span>
            <span>{fmt(dur)}</span>
          </div>
        </div>
      </div>

      {showWaveform && (
        <div className="mt-3 rounded-xl glass overflow-hidden">
          <canvas ref={canvasRef} className="block w-full h-7" />
        </div>
      )}
    </div>
  );
}
