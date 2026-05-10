import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { AudioMetrics } from "@/hooks/useAudioAnalyser";
import { Logo } from "@/components/Logo";
import { OrbVisual } from "@/components/OrbVisual";
import { Aurascope, aurascopeAuraFromTrack } from "@/components/Aurascope";
import { AudioUploadPlayer } from "@/components/AudioUploadPlayer";
import { ShareDialog } from "@/components/ShareDialog";
import { AuraProfileCard } from "@/components/AuraProfileCard";
import { StreamingChips } from "@/components/StreamingLinks";
import { PlatformCard } from "@/components/PlatformCard";
import { getTrack, providerLabel, updateTrack, type Track } from "@/lib/tracks";
import { getSessionAudio } from "@/lib/session";
import { getPersonality, generateAura } from "@/lib/aura";
import { AuraAtmosphere } from "@/components/AuraAtmosphere";
import { ArrowLeft, Bookmark, BookmarkCheck, Trash2, Share2, Sparkles, Layers, Wand2, Palette } from "lucide-react";
import { isAuraSaved, saveAuraFromTrack, deleteAura } from "@/lib/farm";
import { updateAuraVibe, getPublicAura } from "@/lib/cloudAura";
import { StoryPreviewDialog } from "@/components/StoryPreviewDialog";
import { AddToAuracleDialog } from "@/components/AddToAuracleDialog";
import { EditPaletteDialog } from "@/components/EditPaletteDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/aura/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `AuraLink · ${params.id} — Auragram` },
      { name: "description", content: "A living link for this track. Listen, watch, and open it on your favorite platform." },
      { property: "og:title", content: "Listen on Auragram" },
      { property: "og:description", content: "A living link for this track." },
    ],
  }),
  component: AuraPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <h1 className="font-display text-3xl">Aura not found</h1>
        <p className="mt-2 text-muted-foreground">
          This Aura isn't available on this device.
        </p>
        <Link
          to="/create"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm bg-aura-gradient text-primary-foreground"
        >
          Gain Aura <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  ),
});

function AuraPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [track, setTrack] = useState<Track | null | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [auracleOpen, setAuracleOpen] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const metricsRef = useRef<React.MutableRefObject<AudioMetrics> | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const t = getTrack(id);
    setTrack(t);
    setSaved(isAuraSaved(id));

    // Priority: local public URL → session blob (just uploaded) → legacy data URL
    if (t?.audioPublicUrl) {
      setAudioUrl(t.audioPublicUrl);
    } else {
      const session = getSessionAudio(id);
      if (session?.audioUrl) {
        setAudioUrl(session.audioUrl);
      } else if (t?.audioDataUrl) {
        setAudioUrl(t.audioDataUrl);
      } else {
        setAudioUrl(null);
      }
    }

    // Cloud fallback: hydrate audioPublicUrl (and basic track shell) from the
    // server when the local cache doesn't have it (e.g. another device, or
    // local cache cleared).
    (async () => {
      if (t?.audioPublicUrl) return;
      try {
        const row = await getPublicAura(id);
        if (cancelled || !row?.audio_public_url) return;
        setAudioUrl((prev) => prev ?? row.audio_public_url ?? null);
        if (!t) {
          // Build a minimal Track shell from the cloud row so the page renders.
          const shell = {
            id: row.id,
            title: row.track_title,
            artist: row.public_artist_name ?? "Unknown",
            artistHandle: row.public_handle ?? "artist",
            seed: 0,
            createdAt: new Date(row.created_at).getTime(),
            moods: row.mood_tags ?? [],
            palette: (row.palette_name as Track["palette"]) ?? "amethyst",
            auraName: row.aura_name ?? row.track_title,
            energy: Number(row.energy_level ?? 0.6),
            description: row.aura_description ?? "",
            hasLocalAudio: !!row.audio_storage_path,
            audioPublicUrl: row.audio_public_url ?? undefined,
            audioStoragePath: row.audio_storage_path ?? undefined,
            sourceType: (row.source_type as Track["sourceType"]) ?? "upload",
          } as Track;
          setTrack(shell);
        }
      } catch {
        /* ignore — local-only mode still works */
      }
    })();

    return () => {
      cancelled = true;
    };
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
  const p = getPersonality(track.palette);
  const isUpload = !!track.hasLocalAudio;
  const platformName = providerLabel(track.provider);

  const handleSave = () => {
    saveAuraFromTrack(track);
    setSaved(true);
    toast.success("Aura added to your Farm.");
  };

  const handleDelete = () => {
    deleteAura(track.id);
    toast.success("Aura deleted.");
    nav({ to: "/farm" });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AuraAtmosphere personality={p} />

      <header className="px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between gap-3">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {saved ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  aria-label="Delete from Farm"
                  className="inline-flex items-center gap-2 rounded-full glass px-3 sm:px-4 h-10 text-xs sm:text-sm hover:bg-foreground/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card/85 backdrop-blur-2xl border-border/60">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this Aura from your Farm?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This only removes it from your local collection.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full glass px-3 sm:px-4 h-10 text-xs sm:text-sm hover:bg-foreground/10 transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Save to Farm</span>
            </button>
          )}
          {saved && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full glass px-3 h-10 text-xs text-foreground/80">
              <BookmarkCheck className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <ShareDialog
            track={track}
            url={url}
            saved={saved}
            onSave={handleSave}
            open={shareOpen}
            onOpenChange={setShareOpen}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Your Aura is ready
          </div>
        </div>
        <div className="relative mt-6 animate-fade-up">
          <Aurascope
            aura={aurascopeAuraFromTrack(track)}
            size="large"
            mode="full"
            isPlaying={playing}
            audioAnalysisData={{
              analyser: analyserRef,
              metricsRef: metricsRef.current ?? undefined,
            }}
            showLabel={false}
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
          <p className="mt-3 text-sm text-muted-foreground">
            Save it to your Farm or share it anywhere with an AuraLink.
          </p>
        </div>

        {/* Primary action row */}
        <div className="mt-6 w-full max-w-md mx-auto animate-fade-up grid grid-cols-2 gap-2 sm:grid-cols-3">
          {saved ? (
            <button
              onClick={() => toast.message("Already in your Farm")}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium glass-strong text-foreground/90"
            >
              <BookmarkCheck className="h-4 w-4" /> Saved in Farm
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_40px_-10px_oklch(0.7_0.2_310/0.9)]"
            >
              <Bookmark className="h-4 w-4" /> Save to Farm
            </button>
          )}
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium glass hover:bg-foreground/10 transition-colors"
          >
            <Share2 className="h-4 w-4" /> Share AuraLink
          </button>
          <button
            onClick={() => setStoryOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium glass hover:bg-foreground/10 transition-colors"
          >
            <Sparkles className="h-4 w-4" /> Story Preview
          </button>
        </div>

        {/* Secondary actions */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/aura/$id/influence"
            params={{ id: track.id }}
            className="inline-flex items-center justify-center gap-2 rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Wand2 className="h-3.5 w-3.5" /> Influence Aura
          </Link>
          <button
            onClick={() => setAuracleOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Layers className="h-3.5 w-3.5" /> Add to Auracle
          </button>
        </div>

        <StoryPreviewDialog track={track} open={storyOpen} onOpenChange={setStoryOpen} />
        <AddToAuracleDialog
          auraId={track.id}
          open={auracleOpen}
          onOpenChange={setAuracleOpen}
        />

        <div className="mt-8 w-full animate-fade-up">
          {audioUrl ? (
            <AudioUploadPlayer
              src={audioUrl}
              palette={track.palette}
              fileMeta={
                track.audioFileName
                  ? {
                      name: track.audioFileName,
                      type: track.audioMimeType ?? "audio/*",
                      size: track.audioSizeBytes ?? 0,
                    }
                  : null
              }
              onPlayingChange={setPlaying}
              onAnalyserReady={(a) => {
                analyserRef.current = a;
                force((n) => n + 1);
              }}
              onMetricsReady={(m) => {
                metricsRef.current = m;
                force((n) => n + 1);
              }}
            />
          ) : isUpload ? (
            <div className="mx-auto w-full max-w-md text-center">
              <div className="glass-strong rounded-2xl px-5 py-6">
                <p className="text-sm text-foreground/90">
                  {track.sourceType === "raw_recording"
                    ? "This Raw Aura recording is no longer available. Record again to restore playback."
                    : "This uploaded audio is no longer available. Reupload to restore playback."}
                </p>
                <Link
                  to="/create"
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-5 h-10 text-xs bg-aura-gradient text-primary-foreground"
                >
                  {track.sourceType === "raw_recording" ? "Record again" : "Upload again"}
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
                  Open on {platformName} ↗
                </a>
              )}
            </div>
          ) : track.streamUrl ? (
            <PlatformCard
              platformName={platformName}
              url={track.streamUrl}
              provider={track.provider}
            />
          ) : null}
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-muted-foreground/80">
          {isUpload
            ? "Aurascope reacting to audio"
            : "Aura generated from track identity"}
        </p>

        {track.streaming && (
          <div className="mt-6 w-full animate-fade-up">
            <StreamingChips links={track.streaming} />
          </div>
        )}

        <div className="mt-10 w-full max-w-md animate-fade-up">
          <AuraProfileCard
            name={track.auraName}
            moods={track.moods}
            energy={track.energy}
            description={track.description}
            palette={track.palette}
            musicalKey={track.musicalKey}
            tempoBand={track.tempoBand}
            density={track.density}
            paletteName={track.paletteName}
            vibeDescription={track.vibeDescription}
            motionKeywords={track.motionKeywords}
            colors={track.colors}
            keyDetected={track.keyDetected}
            pitchCenter={track.pitchCenter}
            sourceType={track.sourceType}
            colorGuided={track.colorGuided}
            editable={saved}
            onSaveVibe={async (text) => {
              updateTrack(track.id, { vibeDescription: text });
              setTrack({ ...track, vibeDescription: text });
              try {
                await updateAuraVibe(track.id, text);
                toast.success("Vibe updated");
              } catch {
                toast.success("Vibe saved locally");
              }
            }}
            onRegenerateVibe={async () => {
              const gen = generateAura({
                id: track.id + "-" + Date.now(),
                title: track.title,
                artist: track.artist,
                moods: track.moods,
                detectedKey: track.detectedKey ?? null,
                pitchCenter: track.pitchCenter ?? null,
                energyOverride: track.energy,
                sourceType: track.sourceType,
                userColorInfluence: track.userColorInfluence,
              });
              const text = gen.vibeDescription;
              updateTrack(track.id, { vibeDescription: text });
              setTrack({ ...track, vibeDescription: text });
              try {
                await updateAuraVibe(track.id, text);
                toast.success("New vibe generated");
              } catch {
                toast.success("New vibe (saved locally)");
              }
            }}
          />
        </div>

        <p className="mt-10 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          A living link for this track
        </p>
      </main>

      <div className="pb-6 grid place-items-center opacity-50">
        <Logo size={20} />
      </div>
    </div>
  );
}
