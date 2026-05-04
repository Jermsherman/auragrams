import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { OrbVisual } from "@/components/OrbVisual";
import { Aurascope, aurascopeAuraFromTrack } from "@/components/Aurascope";
import {
  getArtist,
  listTracksByHandle,
  saveArtist,
  type Track,
} from "@/lib/tracks";
import { Pencil, Play } from "lucide-react";
import { PALETTES } from "@/lib/aura";

export const Route = createFileRoute("/artist/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — Auragram` },
      {
        name: "description",
        content: `Auras by ${params.handle} — see their sound on Auragram.`,
      },
      { property: "og:title", content: `${params.handle} on Auragram` },
      { property: "og:description", content: "Every track has its own aura." },
    ],
  }),
  component: ArtistPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <h1 className="font-display text-3xl">Artist not found</h1>
        <p className="mt-2 text-muted-foreground">No auras here yet.</p>
        <Link
          to="/create"
          className="mt-6 inline-flex items-center rounded-full px-5 h-11 text-sm bg-aura-gradient text-primary-foreground"
        >
          Create one
        </Link>
      </div>
    </div>
  ),
});

function ArtistPage() {
  const { handle } = Route.useParams();
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [bio, setBio] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const t = listTracksByHandle(handle);
    setTracks(t);
    const a = getArtist(handle);
    setName(a?.name ?? t[0]?.artist ?? handle);
    setBio(a?.bio ?? "");
  }, [handle]);

  if (tracks === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <OrbVisual size={120} className="opacity-50" />
      </div>
    );
  }

  if (tracks.length === 0) throw notFound();

  const featured = tracks[0];
  const rest = tracks.slice(1);

  const saveBio = () => {
    saveArtist({ handle, name, bio });
    setEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta />
      <main className="flex-1 mx-auto w-full max-w-5xl px-5 sm:px-8 py-12 sm:py-16">
        {/* Hero */}
        <section className="text-center animate-fade-up">
          <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            Artist
          </div>
          <h1 className="mt-2 font-display text-4xl sm:text-6xl tracking-tight">
            {name}
          </h1>
          {editing ? (
            <div className="mt-4 max-w-md mx-auto space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass rounded-xl px-4 h-11 text-sm outline-none text-center"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Songs with feeling, coastlines, and late-night glow."
                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none resize-none"
              />
              <div className="flex justify-center gap-2">
                <button
                  onClick={saveBio}
                  className="rounded-full bg-aura-gradient text-primary-foreground px-5 h-9 text-xs font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-full border border-border/70 px-4 h-9 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 max-w-md mx-auto text-sm text-muted-foreground">
                {bio || "Every track has its own aura."}
              </p>
              <button
                onClick={() => setEditing(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.24em] text-muted-foreground/80 hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3" /> Edit profile
              </button>
            </>
          )}
        </section>

        {/* Featured */}
        <section className="mt-14 grid sm:grid-cols-[280px_1fr] gap-8 sm:gap-10 items-center animate-fade-up">
          <div className="grid place-items-center">
            <Aurascope
              aura={aurascopeAuraFromTrack(featured)}
              size="large"
              mode="minimal"
              showLabel={false}
              style={{ width: "min(64vw, 280px)" }}
            />
          </div>
          <div className="text-center sm:text-left">
            <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Featured aura
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl tracking-tight text-aura-gradient">
              {featured.auraName}
            </h2>
            <p className="mt-1 text-foreground/85">{featured.title}</p>
            {featured.moods.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {featured.moods.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-border/70 bg-background/30 px-2.5 h-6 inline-flex items-center text-[11px]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
            <Link
              to="/aura/$id"
              params={{ id: featured.id }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground px-5 h-10 text-sm font-medium"
            >
              <Play className="h-4 w-4" /> Open aura
            </Link>
          </div>
        </section>

        {/* Grid */}
        {rest.length > 0 && (
          <section className="mt-16 animate-fade-up">
            <h3 className="font-display text-xl tracking-tight mb-5">More auras</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((t) => (
                <TrackCard key={t.id} track={t} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function TrackCard({ track }: { track: Track }) {
  const p = PALETTES[track.palette];
  return (
    <Link
      to="/aura/$id"
      params={{ id: track.id }}
      className="group glass rounded-3xl p-5 flex items-center gap-4 hover:bg-foreground/[0.04] transition-colors"
      style={{
        backgroundImage: `radial-gradient(ellipse 80% 60% at 0% 0%, ${p.stops[0]}22, transparent 60%)`,
      }}
    >
      <Aurascope aura={aurascopeAuraFromTrack(track)} size="small" mode="minimal" showLabel={false} style={{ width: 84, height: 84 }} />
      <div className="flex-1 min-w-0">
        <div className="font-display text-base truncate">{track.title}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {track.moods[0] ?? "Mellow"} · {track.energy}%
        </div>
      </div>
      <span className="grid place-items-center h-9 w-9 rounded-full glass-strong group-hover:bg-aura-gradient group-hover:text-primary-foreground transition-colors">
        <Play className="h-4 w-4" />
      </span>
    </Link>
  );
}
