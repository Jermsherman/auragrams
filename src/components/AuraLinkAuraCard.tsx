// Playable Aura card for AuraLink pages. Pressing Play streams the Aura's
// audio inline while the Aurascope reacts via Web Audio analyser. Clicking
// the card body or "Open Aura" routes to /aura/$id.

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Pause, ArrowUpRight } from "lucide-react";
import { Aurascope } from "./Aurascope";
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";
import type { SavedAura } from "@/lib/farm";

function fmt(t: number) {
  if (!isFinite(t) || t <= 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  aura: SavedAura;
  variant?: "hero" | "list";
  themeAccent: string;
  themeButtonBg: string;
  themeGlow: string;
  /** When set and !== aura.id, this card pauses itself. */
  playingId: string | null;
  onPlayingChange: (id: string | null) => void;
};

export function AuraLinkAuraCard({
  aura,
  variant = "list",
  themeAccent,
  themeButtonBg,
  themeGlow,
  playingId,
  onPlayingChange,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { analyserRef, metricsRef, ensureGraph, resume } = useAudioAnalyser(audioRef);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [audioError, setAudioError] = useState(false);

  const hasAudio = !!aura.audioPublicUrl && !audioError;
  const isHero = variant === "hero";

  // Pause if another card starts playing.
  useEffect(() => {
    if (playingId && playingId !== aura.id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [playingId, aura.id]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDur(a.duration || aura.audioDurationSeconds || 0);
    const onPlay = () => {
      setPlaying(true);
      onPlayingChange(aura.id);
    };
    const onPause = () => {
      setPlaying(false);
      onPlayingChange(null);
    };
    const onEnded = () => {
      setPlaying(false);
      onPlayingChange(null);
    };
    const onError = () => {
      setAudioError(true);
      setPlaying(false);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
    };
  }, [aura.id, aura.audioDurationSeconds, onPlayingChange]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    ensureGraph();
    await resume();
    if (a.paused) {
      try {
        await a.play();
      } catch {
        /* autoplay blocked; user can retry */
      }
    } else {
      a.pause();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    a.currentTime = Number(e.target.value);
  };

  const pct = dur ? (time / dur) * 100 : 0;
  const auraSize = isHero ? "large" : "small";

  const containerCls = isHero
    ? "w-full rounded-3xl p-5 sm:p-6 border border-foreground/15 flex flex-col items-center gap-5"
    : "group block w-full rounded-2xl p-3 border border-foreground/15 hover:border-foreground/35 transition-all";

  return (
    <div
      className={containerCls}
      style={{ background: themeButtonBg, boxShadow: themeGlow, color: themeAccent }}
    >
      {aura.audioPublicUrl && !audioError && (
        <audio ref={audioRef} src={aura.audioPublicUrl} preload="metadata" crossOrigin="anonymous" />
      )}
      {audioError && (
        <div className="text-[10px] uppercase tracking-[0.24em] opacity-60">Audio unavailable</div>
      )}

      {isHero ? (
        <>
          <div className="relative">
            <Aurascope
              aura={{
                id: aura.id,
                palette: aura.palette,
                seed: aura.seed,
                hasVocals: aura.hasVocals,
                auraName: aura.auraName,
                colors: aura.colors,
              }}
              size={auraSize}
              mode="minimal"
              showLabel={false}
              isPlaying={playing}
              audioAnalysisData={hasAudio ? { analyser: analyserRef, metricsRef } : undefined}
            />
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.28em] opacity-70">{aura.auraName}</div>
            <div className="mt-1 text-base font-medium truncate max-w-[280px]">{aura.trackTitle}</div>
            {aura.artistName && (
              <div className="text-xs opacity-70 truncate max-w-[280px]">{aura.artistName}</div>
            )}
          </div>

          {hasAudio && (
            <div className="w-full flex items-center gap-3">
              <button
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="grid place-items-center h-12 w-12 rounded-full shrink-0 hover:scale-105 active:scale-95 transition-transform"
                style={{
                  background: themeAccent,
                  color: themeButtonBg,
                  boxShadow: themeGlow,
                }}
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
              </button>
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <div className="relative h-1.5 rounded-full bg-foreground/15 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
                    style={{ width: `${pct}%`, background: themeAccent }}
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
                <div className="flex justify-between text-[10px] tabular-nums opacity-70">
                  <span>{fmt(time)}</span>
                  <span>{fmt(dur)}</span>
                </div>
              </div>
            </div>
          )}

          <Link
            to="/aura/$id"
            params={{ id: aura.id }}
            className="inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-medium border border-foreground/20 hover:border-foreground/40 transition-colors"
            style={{ color: themeAccent }}
          >
            Open Aura <ArrowUpRight className="h-4 w-4" />
          </Link>
        </>
      ) : (
        <Link to="/aura/$id" params={{ id: aura.id }} className="block">
          <div className="flex items-center gap-3 text-left">
            <div className="shrink-0">
              <Aurascope
                aura={{
                  id: aura.id,
                  palette: aura.palette,
                  seed: aura.seed,
                hasVocals: aura.hasVocals,
                  auraName: aura.auraName,
                  colors: aura.colors,
                }}
                size="mini"
                mode="minimal"
                showLabel={false}
                isPlaying={playing}
                audioAnalysisData={hasAudio ? { analyser: analyserRef, metricsRef } : undefined}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.22em] opacity-70 truncate">
                {aura.auraName}
              </div>
              <div className="text-sm font-medium truncate">{aura.trackTitle}</div>
              {hasAudio && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative h-1 rounded-full bg-foreground/15 overflow-hidden flex-1">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${pct}%`, background: themeAccent }}
                    />
                  </div>
                  <span className="text-[9px] tabular-nums opacity-70 shrink-0">
                    {fmt(time)} / {fmt(dur)}
                  </span>
                </div>
              )}
            </div>
            {hasAudio ? (
              <button
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="grid place-items-center h-9 w-9 rounded-full shrink-0 hover:scale-105 active:scale-95 transition-transform"
                style={{ background: themeAccent, color: themeButtonBg }}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
              </button>
            ) : (
              <ArrowUpRight className="h-4 w-4 opacity-70 shrink-0" />
            )}
          </div>
        </Link>
      )}
    </div>
  );
}
