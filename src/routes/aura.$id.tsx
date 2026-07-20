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
import { ArrowLeft, Bookmark, BookmarkCheck, Trash2, Share2, Sparkles, Layers, Palette, Shuffle } from "lucide-react";
import { isAuraSaved, saveAuraFromTrack, deleteAura as deleteAuraLocal, getSavedAuras } from "@/lib/farm";
import { updateAuraVibe, getPublicAura, deleteAura as deleteAuraCloud, deleteAuraAudio, saveAuraToCloud } from "@/lib/cloudAura";
import { useAuth } from "@/hooks/useAuth";
import { getPendingAura, clearPendingAura } from "@/lib/pendingAura";
import { uploadAuraAudio, getSignedAudioUrl } from "@/lib/audioStorage";
import { getGuestAudio, clearGuestAudio } from "@/lib/guestAudioStore";

import { StoryPreviewDialog } from "@/components/StoryPreviewDialog";
import { AuraRevealHero } from "@/components/AuraRevealHero";
import { AuraShareDialog } from "@/components/AuraShareDialog";
import { AddToAuracleDialog } from "@/components/AddToAuracleDialog";
import { EditPaletteDialog } from "@/components/EditPaletteDialog";
import { flags } from "@/lib/featureFlags";
import { computeAuraTraits } from "@/lib/auraTraits";
import { TraitSheet } from "@/components/TraitSheet";
import { SongPersonalityProfile, SongPersonalityProfilePending } from "@/components/SongPersonalityProfile";
import { TraitProvenance } from "@/components/TraitProvenance";
import { generateAuraInsight } from "@/lib/auraInsight.functions";
import { isAuraInsight, type AuraInsight } from "@/lib/auraInsight";
import { supabase } from "@/integrations/supabase/client";
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
  validateSearch: (s: Record<string, unknown>) => ({
    claim: s.claim === "1" || s.claim === 1 ? ("1" as const) : undefined,
    reveal: s.reveal === "1" || s.reveal === 1 ? ("1" as const) : undefined,
  }),
  loader: async ({ params }) => {
    // Best-effort SSR meta — never throws so guest/local-only Auras still render.
    try {
      const row = await getPublicAura(params.id);
      if (!row) return { seo: null };
      const extra = (row.extra ?? {}) as { coverUrl?: string };
      const anon = row.visibility_mode === "anonymous";
      const artist = anon ? "Anonymous Artist" : row.public_artist_name ?? "";
      return {
        seo: {
          title: `${row.track_title}${artist ? ` · ${artist}` : ""} — Auragram`,
          description:
            row.vibe_description ||
            row.aura_description ||
            `A living Aura for "${row.track_title}" on Auragram.`,
          image: extra.coverUrl ?? null,
        },
      };
    } catch {
      return { seo: null };
    }
  },
  head: ({ params, loaderData }) => {
    const d = loaderData as { seo: { title: string; description: string; image: string | null } | null } | undefined;
    const title = d?.seo?.title ?? `Aura on Auragram`;
    const description =
      d?.seo?.description ??
      "A living link for this track. Listen, watch, and open it on your favorite platform.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "music.song" },
      { name: "twitter:card", content: d?.seo?.image ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];
    if (d?.seo?.image) {
      meta.push({ property: "og:image", content: d.seo.image });
      meta.push({ name: "twitter:image", content: d.seo.image });
    }
    return { meta };
  },
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
  const { claim, reveal } = Route.useSearch();
  const nav = useNavigate();
  const { profile, user } = useAuth();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [track, setTrack] = useState<Track | null | undefined>(undefined);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [auraShareOpen, setAuraShareOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [auracleOpen, setAuracleOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [insight, setInsight] = useState<AuraInsight | null>(null);
  const [insightState, setInsightState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const analyserRef = useRef<AnalyserNode | null>(null);
  const metricsRef = useRef<React.MutableRefObject<AudioMetrics> | null>(null);
  const [, force] = useState(0);
  // Capture reveal intent once, then strip the URL param so refresh doesn't re-trigger.
  const [revealActive] = useState(() => reveal === "1");
  useEffect(() => {
    if (reveal === "1") {
      nav({
        to: "/aura/$id",
        params: { id },
        search: { claim: claim ?? undefined },
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = getTrack(id);
    setTrack(t ?? undefined);
    setSaved(isAuraSaved(id));

    // Priority: local public URL → session blob (just uploaded) → legacy data URL → IDB guest blob
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
        getGuestAudio(id)
          .then((entry) => {
            if (!cancelled && entry) setAudioUrl(entry.audioUrl);
          })
          .catch(() => {});
      }
    }

    // Always attempt cloud hydration to learn ownership and fill missing fields.
    (async () => {
      try {
        const row = await getPublicAura(id);
        if (cancelled) return;
        if (!row) {
          if (!t) setTrack(null);
          return;
        }
        setOwnerUserId(row.user_id);
        if (row.audio_storage_path) {
          const signed = await getSignedAudioUrl(row.audio_storage_path);
          if (signed) setAudioUrl((prev) => prev ?? signed);
        }
        if (!t) {
          const shell = {
            id: row.id,
            title: row.track_title,
            artist: row.public_artist_name ?? "Unknown",
            artistHandle: row.public_handle ?? "artist",
            seed: 0,
            createdAt: new Date(row.created_at).getTime(),
            moods: row.mood_tags ?? [],
            palette: ((row.palette_name as Track["palette"]) ?? "amethyst"),
            auraName: row.aura_name ?? row.track_title,
            energy: Number(row.energy_level ?? 0.6),
            description: row.aura_description ?? "",
            hasLocalAudio: !!row.audio_storage_path,
            audioPublicUrl: row.audio_public_url ?? undefined,
            audioStoragePath: row.audio_storage_path ?? undefined,
            audioFileName: row.audio_file_name ?? undefined,
            audioMimeType: row.audio_mime_type ?? undefined,
            audioSizeBytes: row.audio_size_bytes ?? undefined,
            audioDurationSeconds: row.audio_duration_seconds ?? undefined,
            sourceType: (row.source_type as Track["sourceType"]) ?? "upload",
            platformUrl: row.platform_url ?? undefined,
            embedUrl: row.embed_url ?? undefined,
            colors: (row.color_palette as Track["colors"]) ?? undefined,
            paletteName: row.palette_name ?? undefined,
            vibeDescription: row.vibe_description ?? undefined,
            visibilityMode: row.visibility_mode,
          } as Track;
          setTrack(shell);
        }
      } catch {
        if (!t && !cancelled) setTrack(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Track which Aura is the guest pending one (for Save CTA / claim flow).
  useEffect(() => {
    setPendingId(getPendingAura()?.id ?? null);
  }, [id, user?.id]);

  // Load (or generate) the Song Personality Profile from the cloud row.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setInsight(null);
    setInsightState("loading");
    (async () => {
      try {
        const { data: row } = await supabase
          .from("auras")
          .select("insight")
          .eq("id", id)
          .maybeSingle();
        if (cancelled) return;
        if (row && isAuraInsight(row.insight)) {
          setInsight(row.insight as AuraInsight);
          setInsightState("ready");
          return;
        }
        // Row missing insight (or row not in cloud yet) — try to generate.
        const res = await generateAuraInsight({ data: { auraId: id } });
        if (cancelled) return;
        if (res.insight) {
          setInsight(res.insight);
          setInsightState("ready");
        } else {
          setInsightState("failed");
        }
      } catch {
        if (!cancelled) setInsightState("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const retryInsight = async () => {
    setInsightState("loading");
    try {
      const res = await generateAuraInsight({ data: { auraId: id } });
      if (res.insight) {
        setInsight(res.insight);
        setInsightState("ready");
      } else {
        setInsightState("failed");
        toast.error("Couldn't write the story just now — try again in a moment.");
      }
    } catch {
      setInsightState("failed");
      toast.error("Couldn't write the story just now — try again in a moment.");
    }
  };

  // Claim flow: after sign-in with ?claim=1, push the local guest Aura to cloud.
  useEffect(() => {
    if (!claim || !profile?.id || !user?.id) return;
    const pending = getPendingAura();
    if (!pending || pending.id !== id) return;
    const t = getTrack(id);
    const saved = getSavedAuras().find((a) => a.id === id);
    if (!t || !saved) return;
    let cancelled = false;
    setClaiming(true);
    (async () => {
      try {
        // Try to upload audio if a File is still in the session blob,
        // or recover it from IndexedDB (survives the auth redirect).
        const session = getSessionAudio(id);
        let fileToUpload: File | null = session?.file ?? null;
        if (!fileToUpload) {
          const guest = await getGuestAudio(id);
          if (guest) fileToUpload = guest.file;
        }
        let uploaded: Awaited<ReturnType<typeof uploadAuraAudio>> | null = null;
        if (fileToUpload) {
          try {
            uploaded = await uploadAuraAudio({
              authUserId: user.id,
              auraId: id,
              file: fileToUpload,
              rawRecording: t.sourceType === "raw_recording",
            });
          } catch (e) {
            console.error("claim upload", e);
            toast.error(e instanceof Error ? e.message : "Could not upload your audio. Please try again.");
            return;
          }
        } else if (t.hasLocalAudio && !saved.audioStoragePath) {
          toast.error("Could not recover the guest audio file. Please re-upload before saving.");
          return;
        }
        const enriched = uploaded
          ? {
              ...saved,
              audioStoragePath: uploaded.storagePath,
              audioPublicUrl: uploaded.publicUrl,
              audioFileName: uploaded.fileName,
              audioMimeType: uploaded.mimeType,
              audioSizeBytes: uploaded.sizeBytes,
              audioDurationSeconds: uploaded.durationSeconds ?? undefined,
            }
          : saved;
        await saveAuraToCloud({
          saved: enriched,
          userId: profile.id,
          visibilityMode: "username",
          artistProfileId: null,
          publicArtistName: profile.display_name ?? profile.username ?? null,
          publicHandle: profile.username ?? null,
        });
        if (cancelled) return;
        clearPendingAura();
        await clearGuestAudio(id).catch(() => {});
        setPendingId(null);
        toast.success("Saved to My Auras. Let's build your AuraLink.");
        nav({ to: "/auralink/create", replace: true });
      } catch (e) {
        console.error("claim", e);
        toast.error("Could not save your Aura. Please try again.");
      } finally {
        if (!cancelled) setClaiming(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [claim, profile?.id, user?.id, id, nav]);

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
  const isOwner = !!profile?.id && (ownerUserId === null || ownerUserId === profile.id);

  const handleSave = () => {
    saveAuraFromTrack(track);
    setSaved(true);
    toast.success("Aura added to My Auras.");
  };

  const handleDelete = async () => {
    if (isOwner) {
      try {
        await deleteAuraCloud(track.id, profile?.id);
      } catch (e) {
        console.error(e);
        toast.error("Couldn't remove from cloud. Removed locally.");
      }
      try {
        await deleteAuraAudio(track.audioStoragePath);
      } catch (e) {
        console.error("audio delete failed", e);
        toast.warning("Aura deleted, but the audio file couldn't be removed. Try again later.");
      }
    }
    deleteAuraLocal(track.id);
    toast.success("Aura deleted.");
    nav({ to: "/farm" });
  };

  const shufflePalette = () => {
    if (!track) return null;
    const gen = generateAura({
      id: track.id + "-shuffle-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      title: track.title,
      artist: track.artist,
      moods: track.moods,
      detectedKey: track.detectedKey ?? null,
      pitchCenter: track.pitchCenter ?? null,
      energyOverride: track.energy,
      sourceType: track.sourceType,
      userColorInfluence: track.userColorInfluence,
    });
    updateTrack(track.id, { colors: gen.colors, paletteName: gen.paletteName });
    setTrack({ ...track, colors: gen.colors, paletteName: gen.paletteName });
    if (saved) {
      saveAuraFromTrack({ ...track, colors: gen.colors, paletteName: gen.paletteName });
    }
    return { colors: gen.colors, name: gen.paletteName };
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AuraAtmosphere personality={p} />

      <header className="px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between gap-3">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isOwner && (saved ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  aria-label="Delete from My Auras"
                  className="inline-flex items-center gap-2 rounded-full glass px-3 sm:px-4 h-10 text-xs sm:text-sm hover:bg-foreground/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card/85 backdrop-blur-2xl border-border/60">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this Aura?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the Aura from My Auras and your cloud library.
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
              <span className="hidden sm:inline">Save to My Auras</span>
            </button>
          ))}
          {isOwner && saved && (
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
        {/* Cinematic reveal hero: eyebrow · Aura Name · song · pull-quote */}
        <div className="w-full animate-fade-up">
          <AuraRevealHero
            auraName={insight?.auraName || track.auraName}
            trackTitle={track.title}
            artist={track.artist}
            colors={track.colors}
            insight={insight}
            reveal={revealActive}
          />
        </div>

        <div className="relative mt-8 animate-fade-up">
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

        <div className="mt-6 w-full animate-fade-up">
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

        {insightState === "ready" && insight ? (
          <div className="mt-10">
            <SongPersonalityProfile insight={insight} reveal={revealActive} hideHeader />
          </div>
        ) : insightState === "loading" ? (
          <div className="mt-10">
            <SongPersonalityProfilePending />
          </div>
        ) : null}
        ) : insightState === "loading" ? (
          <div className="mt-10">
            <SongPersonalityProfilePending />
          </div>
        ) : insightState === "failed" && isOwner ? (
          <div className="mt-10">
            <SongPersonalityProfilePending canRetry onRetry={retryInsight} />
          </div>
        ) : null}

        <TraitSheet traits={computeAuraTraits(track)} reveal={revealActive} />

        <div className="mt-6">
          <TraitProvenance />
        </div>



        {/* Primary action row */}
        <div className="mt-6 w-full max-w-md mx-auto animate-fade-up grid grid-cols-2 gap-2 sm:grid-cols-3">
          {!user && pendingId === id ? (
            <Link
              to="/auth"
              search={{ mode: "signup", redirect: `/aura/${id}?claim=1` }}
              className="col-span-2 sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_40px_-10px_oklch(0.7_0.2_310/0.9)]"
            >
              <Bookmark className="h-4 w-4" />
              {claiming ? "Saving…" : "Save Aura & Build AuraLink"}
            </Link>
          ) : isOwner ? (
            <>
              {saved ? (
                <button
                  onClick={() => toast.message("Already in My Auras")}
                  className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium glass-strong text-foreground/90"
                >
                  <BookmarkCheck className="h-4 w-4" /> Saved
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_40px_-10px_oklch(0.7_0.2_310/0.9)]"
                >
                  <Bookmark className="h-4 w-4" /> Save Aura & Build AuraLink
                </button>
              )}
              <button
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium glass hover:bg-foreground/10 transition-colors"
              >
                <Share2 className="h-4 w-4" /> Share AuraLink
              </button>
              {flags.enableStoryExport && (
              <button
                onClick={() => setStoryOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium glass hover:bg-foreground/10 transition-colors"
              >
                <Sparkles className="h-4 w-4" /> Story Preview
              </button>
              )}
            </>
          ) : null}
        </div>

        {!user && pendingId === id && (
          <p className="mt-3 text-xs text-muted-foreground max-w-md mx-auto animate-fade-up">
            Sign up to save it and build your music-first AuraLink.
          </p>
        )}

        {/* Secondary actions — owner only */}
        {isOwner && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {flags.enableAuracle && (
          <button
            onClick={() => setAuracleOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Layers className="h-3.5 w-3.5" /> Add to Auracle
          </button>
          )}
          {track.colors && (
            <button
              onClick={() => {
                const r = shufflePalette();
                if (r) toast.success("Palette shuffled");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
              title="Reroll palette colors"
            >
              <Shuffle className="h-3.5 w-3.5" /> Shuffle
            </button>
          )}
          {flags.enableEditPalette && saved && track.colors && (
            <button
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Palette className="h-3.5 w-3.5" /> Edit Palette
            </button>
          )}
        </div>
        )}

        <StoryPreviewDialog track={track} open={storyOpen} onOpenChange={setStoryOpen} />
        <AddToAuracleDialog
          auraId={track.id}
          open={auracleOpen}
          onOpenChange={setAuracleOpen}
        />
        {track.colors && (
          <EditPaletteDialog
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            initialColors={track.colors}
            generatedColors={track.colors}
            initialName={track.paletteName}
            onSave={(next, name) => {
              updateTrack(track.id, { colors: next, paletteName: name });
              setTrack({ ...track, colors: next, paletteName: name });
            }}
            onShuffle={() => {
              const gen = generateAura({
                id: track.id + "-shuffle-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
                title: track.title,
                artist: track.artist,
                moods: track.moods,
                detectedKey: track.detectedKey ?? null,
                pitchCenter: track.pitchCenter ?? null,
                energyOverride: track.energy,
                sourceType: track.sourceType,
                userColorInfluence: track.userColorInfluence,
              });
              return { colors: gen.colors, name: gen.paletteName };
            }}
          />
        )}

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
                vibeSeed: track.influenceSettings?.vibeNote ?? null,
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
