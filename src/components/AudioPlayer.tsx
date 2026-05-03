import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useAudioReactive } from "@/hooks/useAudioReactive";

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  src: string;
  onAnalyserReady?: (analyser: AnalyserNode | null) => void;
  onPlayingChange?: (playing: boolean) => void;
};

export function AudioPlayer({ src, onAnalyserReady, onPlayingChange }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { analyserRef, ensureGraph } = useAudioReactive(audioRef);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

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

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    ensureGraph();
    onAnalyserReady?.(analyserRef.current);
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
    </div>
  );
}
