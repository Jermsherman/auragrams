import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";
import type { AudioMetrics } from "@/hooks/useAudioAnalyser";
import { getPersonality } from "@/lib/aura";

/**
 * AudioUploadPlayer
 * -----------------
 * A clean, single-responsibility audio player built from the ground up to:
 *  1. Reliably play uploaded audio (local File or remote URL).
 *  2. Drive a Web Audio AnalyserNode for the Aura visualizer — without
 *     the "MediaElementSourceNode already connected" error.
 *
 * Native playback comes first. The Web Audio graph is only created AFTER
 * the user clicks Play (so AudioContext.resume() satisfies autoplay policies).
 *
 * The audio <element> is keyed by `src`, so changing the source remounts it.
 * The MediaElementSourceNode is stored in a ref and reset whenever `src`
 * changes — this is the only safe way to reuse a source node, since
 * createMediaElementSource() can only be called once per element.
 */

export type AudioUploadFileMeta = {
  name: string;
  type: string;
  size: number;
};

type Props = {
  /** Resolved audio source. Either a remote URL or a blob: URL. */
  src: string;
  /** Optional metadata for the debug panel (file uploads only). */
  fileMeta?: AudioUploadFileMeta | null;
  palette?: string;
  /** Show the dev/debug panel. Off by default. */
  debug?: boolean;
  onAnalyserReady?: (analyser: AnalyserNode | null) => void;
  onMetricsReady?: (metrics: React.MutableRefObject<AudioMetrics>) => void;
  onPlayingChange?: (playing: boolean) => void;
};

const SUPPORTED_MIME_PREFIX = "audio/";

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtBytes(n: number | undefined) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function AudioUploadPlayer({
  src,
  fileMeta,
  palette,
  debug = false,
  onAnalyserReady,
  onMetricsReady,
  onPlayingChange,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Playback state ---
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // --- Web Audio graph (built lazily on first Play) ---
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);

  // The metrics object the visualizer reads each frame.
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

  // Reset Web Audio graph if `src` changes — the audio element below remounts
  // (key={src}), so any previous MediaElementSourceNode is now orphaned.
  useEffect(() => {
    sourceRef.current = null;
    analyserRef.current = null;
    metricsRef.current.ready = false;
    setAudioReady(false);
    setLastError(null);
    setTime(0);
    setDuration(0);
    setPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (ctxRef.current) {
      // Tear down old context so the next play() rebuilds a clean graph.
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, [src]);

  // Final cleanup on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
    };
  }, []);

  // --- Audio element event listeners (logging + state) ---
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onLoadStart = () => console.log("[AudioUploadPlayer] Audio load started", src);
    const onLoadedMetadata = () => {
      const d = a.duration;
      setDuration(isFinite(d) ? d : 0);
      setAudioReady(true);
      console.log("[AudioUploadPlayer] Audio metadata loaded — duration:", d);
    };
    const onCanPlay = () => console.log("[AudioUploadPlayer] Audio can play");
    const onTimeUpdate = () => setTime(a.currentTime);
    const onPlay = () => {
      setPlaying(true);
      onPlayingChange?.(true);
      console.log("[AudioUploadPlayer] Audio playing");
    };
    const onPause = () => {
      setPlaying(false);
      onPlayingChange?.(false);
      console.log("[AudioUploadPlayer] Audio paused");
    };
    const onEnded = () => {
      setPlaying(false);
      onPlayingChange?.(false);
      console.log("[AudioUploadPlayer] Audio ended");
    };
    const onErr = () => {
      const err = a.error;
      const msg = err ? `Error ${err.code}: ${err.message || "unknown"}` : "Unknown audio error";
      setLastError(msg);
      setAudioReady(false);
      console.error("[AudioUploadPlayer] Audio error:", err?.code, err?.message);
    };

    a.addEventListener("loadstart", onLoadStart);
    a.addEventListener("loadedmetadata", onLoadedMetadata);
    a.addEventListener("canplay", onCanPlay);
    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onErr);

    // Force the element to re-evaluate its source whenever it (re)mounts
    // with a new URL.
    try {
      a.load();
    } catch {
      /* ignore */
    }

    return () => {
      a.removeEventListener("loadstart", onLoadStart);
      a.removeEventListener("loadedmetadata", onLoadedMetadata);
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onErr);
    };
  }, [src, onPlayingChange]);

  /**
   * Build the Web Audio graph the FIRST time the user clicks Play.
   * createMediaElementSource() can only be called once per HTMLAudioElement,
   * so we gate it behind sourceRef and rebuild only when src changes (which
   * remounts the <audio> element via key={src}).
   */
  const ensureGraph = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (ctxRef.current && sourceRef.current && analyserRef.current) return;

    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(a);
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

      onAnalyserReady?.(analyser);
      onMetricsReady?.(metricsRef);

      // Drive the metrics tick loop.
      let prevBass = 0;
      const lerp = (a0: number, b0: number, t: number) => a0 + (b0 - a0) * t;
      const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

      const tick = () => {
        analyser.getByteTimeDomainData(wave);
        analyser.getByteFrequencyData(freq);

        // peak-to-peak + RMS
        let min = 255;
        let max = 0;
        let sumSq = 0;
        let count = 0;
        for (let i = 0; i < wave.length; i += 4) {
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
        const aFast = 0.35;
        const aSlow = 0.16;
        m.peak = lerp(m.peak, peak, peak > m.peak ? aFast : aSlow);
        m.volume = lerp(m.volume, rms, rms > m.volume ? aFast : aSlow);
        m.bass = lerp(m.bass, bass, bass > m.bass ? aFast : aSlow);
        m.mid = lerp(m.mid, mid, mid > m.mid ? 0.28 : aSlow);
        m.treble = lerp(m.treble, treble, treble > m.treble ? 0.4 : 0.22);

        const delta = Math.max(0, bass - prevBass);
        const burst = clamp01(delta * 6);
        m.transient = Math.max(m.transient * 0.86, burst);
        prevBass = bass;

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn("[AudioUploadPlayer] Web Audio analyser unavailable", e);
    }
  }, [onAnalyserReady, onMetricsReady]);

  const handlePlayClick = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;

    setLastError(null);
    if (a.paused) {
      // Build the analyser graph inside the user-gesture so the AudioContext
      // is allowed to start unsuspended on iOS / Safari.
      ensureGraph();
      const ctx = ctxRef.current;
      if (ctx && ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch (e) {
          console.warn("[AudioUploadPlayer] AudioContext resume failed", e);
        }
      }
      try {
        await a.play();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Playback failed";
        setLastError(msg);
        console.error("[AudioUploadPlayer] play() rejected:", e);
      }
    } else {
      a.pause();
    }
  }, [ensureGraph]);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = Number(e.target.value);
  };

  // Apply volume + muted to the underlying element reactively.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
  }, [volume, muted, src]);

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.min(1, Number(e.target.value) / 100));
    setVolume(v);
    if (v > 0 && muted) setMuted(false);
    try { localStorage.setItem(VOLUME_KEY, String(v)); } catch { /* noop */ }
  };
  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try { localStorage.setItem(MUTED_KEY, next ? "1" : "0"); } catch { /* noop */ }
      return next;
    });
  };

  const stops = getPersonality(palette).stops;
  const pct = duration ? (time / duration) * 100 : 0;
  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="w-full max-w-md mx-auto select-none">
      {/*
        IMPORTANT: key={src} forces React to unmount/remount the <audio>
        whenever the source URL changes. This guarantees we never call
        createMediaElementSource() twice on the same element.
      */}
      <audio
        ref={audioRef}
        key={src}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
      />

      <div className="flex items-center gap-4">
        <button
          onClick={handlePlayClick}
          aria-label={playing ? "Pause" : "Play"}
          className="grid place-items-center h-14 w-14 rounded-full bg-aura-gradient text-primary-foreground shadow-[0_0_40px_-6px_oklch(0.7_0.2_310/0.8)] hover:scale-[1.04] active:scale-[0.98] transition-transform"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
        </button>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="relative h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${stops[0]}, ${stops[2]}, ${stops[4]})`,
              }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={time}
              onChange={seek}
              aria-label="Seek"
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{fmt(time)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      {/* Volume row */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="grid place-items-center h-9 w-9 rounded-full glass hover:bg-foreground/10 transition-colors text-foreground/80"
        >
          <VolIcon className="h-4 w-4" />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round((muted ? 0 : volume) * 100)}
          onChange={onVolumeChange}
          aria-label="Volume"
          className="flex-1 h-1 accent-foreground/70 cursor-pointer"
        />
        <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
          {muted ? 0 : Math.round(volume * 100)}
        </span>
      </div>



      {lastError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl glass px-3 py-2 text-[11px] text-foreground/90"
        >
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
          <span className="leading-snug">{lastError}</span>
        </div>
      )}

      {debug && (
        <div className="mt-4 rounded-xl glass p-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground space-y-1">
          <div className="flex justify-between gap-3">
            <span>file</span>
            <span className="text-foreground/80 normal-case tracking-normal truncate max-w-[60%]">
              {fileMeta?.name ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>type</span>
            <span className="text-foreground/80 normal-case tracking-normal">{fileMeta?.type ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>size</span>
            <span className="text-foreground/80 normal-case tracking-normal">{fmtBytes(fileMeta?.size)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>src</span>
            <span className="text-foreground/80 normal-case tracking-normal truncate max-w-[60%]">{src.slice(0, 40)}…</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>ready</span>
            <span className="text-foreground/80 normal-case tracking-normal">{audioReady ? "true" : "false"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>duration</span>
            <span className="text-foreground/80 normal-case tracking-normal">{duration.toFixed(2)}s</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>last error</span>
            <span className="text-foreground/80 normal-case tracking-normal">{lastError ?? "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Helper exposed for the upload form: validates that a File is a usable audio file. */
export function validateUploadAudioFile(file: File): string | null {
  if (!file) return "No file selected.";
  const okType = file.type.startsWith(SUPPORTED_MIME_PREFIX);
  const okExt = /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i.test(file.name);
  if (!okType && !okExt) {
    return "Please upload an audio file (.mp3, .wav, .m4a, .aac, .ogg).";
  }
  console.log("[AudioUploadPlayer] file selected:", file.name, file.type, file.size);
  return null;
}
