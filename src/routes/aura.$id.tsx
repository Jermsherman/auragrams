import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { OrbVisual } from "@/components/OrbVisual";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ShareDialog } from "@/components/ShareDialog";
import { AuraProfileCard } from "@/components/AuraProfileCard";
import { StreamingChips } from "@/components/StreamingLinks";
import { getTrack, type Track } from "@/lib/tracks";
import { getSessionAudio } from "@/lib/session";
import { getPersonality } from "@/lib/aura";
import { AuraAtmosphere } from "@/components/AuraAtmosphere";
import { ArrowLeft } from "lucide-react";

function labelFor(p?: string) {
  return (
    {
      spotify: "Spotify",
      youtube: "YouTube",
      soundcloud: "SoundCloud",
      apple: "Apple Music",
    }[p ?? ""] || "source"
  );
}

export const Route = createFileRoute("/aura/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Aura · ${params.id} — Auragram` },
      { name: "description", content: "A living visual aura for this track on Auragram." },
      { property: "og:title", content: "Listen on Auragram" },
      { property: "og:description", content: "See your sound." },
    ],
  }),
  component: AuraPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <h1 className="font-display text-3xl">Aura not found</h1>
        <p className="mt-2 text-muted-foreground">
          This track isn't available on this device.
        </p>
        <Link
          to="/create"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm bg-aura-gradient text-primary-foreground"
        >
          Create one <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  ),
});

function AuraPage() {
  const { id } = Route.useParams();
  const [track, setTrack] = useState<Track | null | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const t = getTrack(id);
    setTrack(t);
    if (t?.hasLocalAudio) {
      const session = getSessionAudio(id);
      setAudioUrl(session?.audioUrl ?? null);
    } else if (t?.audioDataUrl) {
      // legacy
      setAudioUrl(t.audioDataUrl);
    } else {
      setAudioUrl(null);
    }
  }, [id]);

  if (track === undefined) {
    return (
      <div className="min-h-screen grid place-items-center">
        <OrbVisual size={140} className="opacity-60" />
      </div>
    );
  }
  if (track === null) throw notFound();

  const url = typeof window !== "undefined" ? window.location.href : "";
  const p = PALETTES[track.palette];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* page tint from palette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% -10%, ${p.stops[0]}, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 110%, ${p.stops[2]}, transparent 60%)`,
        }}
      />

      <header className="px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <ShareDialog track={track} url={url} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="relative animate-fade-up">
          <OrbVisual
            size="min(82vw, 460px)"
            hueShift={track.seed}
            isPlaying={playing}
            analyser={analyserRef}
            palette={track.palette}
            className={playing ? "" : "animate-breathe"}
          />
        </div>

        <div className="mt-10 sm:mt-14 max-w-md mx-auto animate-fade-up">
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            {track.title}
          </h1>
          <Link
            to="/artist/$handle"
            params={{ handle: track.artistHandle }}
            className="mt-2 inline-block text-muted-foreground tracking-wide hover:text-foreground transition-colors"
          >
            {track.artist}
          </Link>
        </div>

        <div className="mt-8 w-full animate-fade-up">
          {audioUrl ? (
            <AudioPlayer
              src={audioUrl}
              onPlayingChange={setPlaying}
              onAnalyserReady={(a) => {
                analyserRef.current = a;
                force((n) => n + 1);
              }}
            />
          ) : track.hasLocalAudio ? (
            <div className="mx-auto w-full max-w-md text-center">
              <div className="glass-strong rounded-2xl px-5 py-6">
                <p className="text-sm text-foreground/90">
                  This demo track session expired. Please upload again.
                </p>
                <Link
                  to="/create"
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-10 text-xs bg-aura-gradient text-primary-foreground"
                >
                  Upload again
                </Link>
              </div>
            </div>
          ) : track.embedUrl ? (
            <div className="mx-auto w-full max-w-md">
              <div className="glass-strong rounded-2xl overflow-hidden">
                <iframe
                  title={`${track.title} player`}
                  src={track.embedUrl}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
                  loading="lazy"
                  className="w-full"
                  style={{
                    height:
                      track.provider === "spotify"
                        ? 152
                        : track.provider === "soundcloud"
                          ? 140
                          : track.provider === "apple"
                            ? 175
                            : 200,
                    border: 0,
                    background: "transparent",
                    colorScheme: "normal",
                  }}
                />
              </div>
              {track.streamUrl && (
                <a
                  href={track.streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-center text-[11px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Open on {labelFor(track.provider)} ↗
                </a>
              )}
            </div>
          ) : null}
        </div>

        {/* Streaming chips */}
        {track.streaming && (
          <div className="mt-6 w-full animate-fade-up">
            <StreamingChips links={track.streaming} />
          </div>
        )}

        {/* Aura profile */}
        <div className="mt-10 w-full max-w-md animate-fade-up">
          <AuraProfileCard
            name={track.auraName}
            moods={track.moods}
            energy={track.energy}
            description={track.description}
            palette={track.palette}
          />
        </div>

        <p className="mt-10 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Made to be shared
        </p>
      </main>

      <div className="pb-6 grid place-items-center opacity-50">
        <Logo size={20} />
      </div>
    </div>
  );
}
