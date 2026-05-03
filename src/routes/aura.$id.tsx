import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { OrbVisual } from "@/components/OrbVisual";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ShareDialog } from "@/components/ShareDialog";
import { getTrack, type Track } from "@/lib/tracks";
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
  const [playing, setPlaying] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const t = getTrack(id);
    setTrack(t);
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <ShareDialog url={url} title={`${track.title} — ${track.artist}`} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="relative animate-fade-up">
          <OrbVisual
            size="min(82vw, 460px)"
            hueShift={track.seed}
            isPlaying={playing}
            analyser={analyserRef}
            className={playing ? "" : "animate-breathe"}
          />
        </div>

        <div className="mt-10 sm:mt-14 max-w-md mx-auto animate-fade-up">
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            {track.title}
          </h1>
          <p className="mt-2 text-muted-foreground tracking-wide">{track.artist}</p>
        </div>

        <div className="mt-8 w-full animate-fade-up">
          {track.audioDataUrl ? (
            <AudioPlayer
              src={track.audioDataUrl}
              onPlayingChange={setPlaying}
              onAnalyserReady={(a) => {
                analyserRef.current = a;
                force((n) => n + 1);
              }}
            />
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
          ) : track.streamUrl ? (
            <a
              href={track.streamUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full glass-strong px-5 h-11 text-sm hover:bg-foreground/10 transition-colors"
            >
              Open track ↗
            </a>
          ) : null}
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
