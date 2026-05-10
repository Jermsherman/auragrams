import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { Aurascope } from "@/components/Aurascope";
import { MoodPicker } from "@/components/MoodPicker";
import { ColorInfluence } from "@/components/ColorInfluence";
import { IdentitySelector } from "@/components/IdentitySelector";
import { AuraAtmosphere } from "@/components/AuraAtmosphere";
import { getTrack, updateTrack, type Track } from "@/lib/tracks";
import { getPersonality, generateAura, type UserColorInfluence } from "@/lib/aura";
import type { VisibilityMode, ArtistProfile } from "@/lib/identity";
import { isAuraSaved, saveAuraFromTrack } from "@/lib/farm";
import { saveAuraToCloud } from "@/lib/cloudAura";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/aura/$id/influence")({
  head: () => ({
    meta: [
      { title: "Influence Aura — Auragram" },
      { name: "description", content: "Guide the mood, color, and public identity of this Aura." },
    ],
  }),
  component: InfluencePage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <h1 className="font-display text-3xl">Aura not found</h1>
        <Link
          to="/farm"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm bg-aura-gradient text-primary-foreground"
        >
          Back to Farm
        </Link>
      </div>
    </div>
  ),
});

const DEFAULT_INFLUENCE: UserColorInfluence = { mode: "surprise", colors: [], description: "" };

function InfluencePage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { profile } = useAuth();

  const [track, setTrack] = useState<Track | null | undefined>(undefined);
  const [moods, setMoods] = useState<string[]>([]);
  const [influence, setInfluence] = useState<UserColorInfluence>(DEFAULT_INFLUENCE);
  const [vibeNote, setVibeNote] = useState("");
  const [identity, setIdentity] = useState<{ mode: VisibilityMode; artistProfileId: string | null }>({
    mode: "artist",
    artistProfileId: null,
  });
  const [resolved, setResolved] = useState<{
    artistProfile: ArtistProfile | null;
    publicArtistName: string;
    publicHandle: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = getTrack(id);
    setTrack(t);
    if (t) {
      setMoods(t.moods ?? []);
      setInfluence(t.userColorInfluence ?? DEFAULT_INFLUENCE);
      setVibeNote(t.influenceSettings?.vibeNote ?? "");
      setIdentity({
        mode: (t.visibilityMode as VisibilityMode) ?? "artist",
        artistProfileId: null,
      });
    }
  }, [id]);

  // Live preview — recompute the engine output from current draft.
  const preview = useMemo(() => {
    if (!track) return null;
    const gen = generateAura({
      id: track.id + "-preview",
      title: track.title,
      artist: track.artist,
      moods,
      detectedKey: track.detectedKey ?? null,
      pitchCenter: track.pitchCenter ?? null,
      energyOverride: track.energy,
      sourceType: track.sourceType,
      userColorInfluence: influence,
    });
    return gen;
  }, [track, moods, influence]);

  if (track === undefined) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (track === null) throw notFound();

  const p = getPersonality(preview?.palette ?? track.palette);
  const previewVibe = vibeNote.trim() || preview?.vibeDescription || track.vibeDescription || "";

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const finalVibe = vibeNote.trim() || preview.vibeDescription;
      const patch: Partial<Track> = {
        moods,
        userColorInfluence: influence,
        colorGuided: preview.colorGuided,
        auraName: preview.auraName,
        paletteName: preview.paletteName,
        colors: preview.colors,
        palette: preview.palette,
        description: preview.description,
        vibeDescription: finalVibe,
        motionKeywords: preview.motionKeywords,
        density: preview.density,
        tempoBand: preview.tempoBand,
        visibilityMode: identity.mode,
        influenceSettings: {
          moodTags: moods,
          userColorInfluence: influence,
          vibeNote: vibeNote.trim(),
          visibilityMode: identity.mode,
          updatedAt: new Date().toISOString(),
        },
      };
      updateTrack(track.id, patch);
      const updated: Track = { ...track, ...patch };

      // Refresh Farm + cloud row if this Aura is saved or the user is signed in.
      const wasSaved = isAuraSaved(track.id);
      if (wasSaved) saveAuraFromTrack(updated);

      if (profile && (wasSaved || resolved)) {
        try {
          const saved = wasSaved
            ? saveAuraFromTrack(updated)
            : saveAuraFromTrack(updated);
          await saveAuraToCloud({
            saved,
            userId: profile.id,
            visibilityMode: identity.mode,
            artistProfileId: identity.mode === "artist" ? identity.artistProfileId : null,
            publicArtistName: identity.mode !== "anonymous" ? resolved?.publicArtistName ?? null : null,
            publicHandle: identity.mode !== "anonymous" ? resolved?.publicHandle ?? null : null,
          });
          toast.success("Aura influence saved.");
        } catch {
          toast.success("Influence saved locally");
        }
      } else {
        toast.success("Aura influence saved.");
      }

      nav({ to: "/aura/$id", params: { id: track.id } });
    } finally {
      setSaving(false);
    }
  };

  const previewAura = preview && {
    id: track.id,
    palette: preview.palette,
    seed: track.seed,
    auraName: preview.auraName,
    trackTitle: track.title,
    artistName: track.artist,
    colors: preview.colors,
    isAnonymous: identity.mode === "anonymous",
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AuraAtmosphere personality={p} />

      <header className="px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between gap-3">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <Link
          to="/aura/$id"
          params={{ id: track.id }}
          className="inline-flex items-center gap-2 rounded-full glass px-3 sm:px-4 h-10 text-xs sm:text-sm hover:bg-foreground/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to AuraLink</span>
        </Link>
      </header>

      <main className="flex-1 px-5 sm:px-8 py-8 max-w-5xl w-full mx-auto">
        <div className="text-center max-w-xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Influence Aura
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl tracking-tight">
            <span className="text-aura-gradient">Bend this Aura toward you</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your moods, colors, and notes carry real weight — Auragram pulls the palette,
            glow, and vibe toward your direction while keeping the song's core identity.
          </p>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
          {/* Controls */}
          <div className="space-y-6 animate-fade-up">
            <div className="glass-strong rounded-3xl p-5">
              <h2 className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-3">
                Guide the mood
              </h2>
              <MoodPicker value={moods} onChange={setMoods} glowColor={preview?.colors?.glow} />
            </div>

            <div>
              <h2 className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-2 px-1">
                Guide the glow
              </h2>
              <ColorInfluence value={influence} onChange={setInfluence} />
            </div>

            <div className="glass-strong rounded-3xl p-5">
              <h2 className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                Vibe Note
              </h2>
              <textarea
                value={vibeNote}
                onChange={(e) => setVibeNote(e.target.value.slice(0, 240))}
                rows={3}
                maxLength={240}
                placeholder="Describe what this track feels like…"
                className="w-full rounded-xl bg-background/40 border border-border/60 px-3 py-2 text-sm italic outline-none focus:border-foreground/25 resize-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Influences the regenerated description
                </p>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {vibeNote.length}/240
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-2 px-1">
                Public identity
              </h2>
              <IdentitySelector value={identity} onChange={setIdentity} onResolve={setResolved} />
            </div>
          </div>

          {/* Live Preview */}
          <aside className="lg:sticky lg:top-6 lg:self-start animate-fade-up">
            <div className="glass-strong rounded-3xl p-5 text-center">
              <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                Updated Aura Preview
              </div>
              {previewAura && (
                <div className="mt-4 grid place-items-center">
                  <Aurascope aura={previewAura} size="medium" mode="card" showLabel={false} />
                </div>
              )}
              <h3 className="mt-4 font-display text-2xl">
                <span className="text-aura-gradient">{preview?.auraName}</span>
              </h3>
              {moods.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {moods.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-border/60 bg-background/30 px-2.5 h-6 inline-flex items-center text-[11px] text-foreground/85"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              {preview?.colors && (
                <div className="mt-3 flex justify-center gap-1.5">
                  {(preview.colors.swatches ?? []).map((c, i) => (
                    <span
                      key={i}
                      className="h-5 w-5 rounded-full ring-1 ring-foreground/15"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              )}
              {preview?.paletteName && (
                <div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Palette · {preview.paletteName}
                </div>
              )}
              {preview?.description && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                  {preview.description}
                </p>
              )}
              {previewVibe && (
                <p className="mt-2 text-xs italic text-muted-foreground">“{previewVibe}”</p>
              )}
              {preview?.colorGuided && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-aura-gradient/30 px-2.5 h-6 text-[10px] uppercase tracking-[0.24em] text-foreground/90">
                  <Sparkles className="h-3 w-3" /> Color-guided
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="sticky bottom-4 mt-8 z-10">
          <div className="glass-strong rounded-full p-2 flex items-center gap-2 max-w-md mx-auto">
            <Link
              to="/aura/$id"
              params={{ id: track.id }}
              className="flex-1 inline-flex items-center justify-center rounded-full h-11 text-sm hover:bg-foreground/5 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || moods.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full h-11 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Apply Influence
            </button>
          </div>
        </div>
      </main>

      <div className="pb-6 grid place-items-center opacity-50">
        <Logo size={20} />
      </div>
    </div>
  );
}
