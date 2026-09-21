import { createFileRoute, useHydrated, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import {
  UploadCloud,
  Music2,
  ArrowRight,
  X,
  Image as ImageIcon,
  Layers,
  GripVertical,
  Mic,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  
  fileToDataUrl,
  makeId,
  saveTrack,
  seedFromId,
} from "@/lib/tracks";
import { setSessionAudio } from "@/lib/session";
import { putGuestAudio } from "@/lib/guestAudioStore";
import { generateAura, slugify, type PitchCenter, type UserColorInfluence } from "@/lib/aura";
import { detectKey, detectPitchCenter, type KeyDetection } from "@/lib/keyDetect";
import { analyzeFile, type AudioFeatures } from "@/lib/audioFeatures";
import { suggestMoods } from "@/lib/moodDetect";
import { MoodPicker } from "@/components/MoodPicker";
import { BandCustomizer } from "@/components/BandCustomizer";
import { DEFAULT_BANDS, type BandsConfig } from "@/lib/auraBands";
import { Aurascope } from "@/components/Aurascope";

import { ColorInfluence } from "@/components/ColorInfluence";
import { RawAuraRecorder } from "@/components/RawAuraRecorder";
import { saveAuraFromTrack } from "@/lib/farm";
import {
  PROJECT_TYPE_LABELS,
  saveAuracle,
  type AuracleProjectType,
} from "@/lib/auracle";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { HelpLink } from "@/components/HelpLink";
import { useAuth } from "@/hooks/useAuth";
import { IdentitySelector } from "@/components/IdentitySelector";
import type { ArtistProfile, VisibilityMode } from "@/lib/identity";
import { saveAuraToCloud, saveAuracleToCloud } from "@/lib/cloudAura";
import { MAX_AUDIO_BYTES, formatAudioSize, uploadAuraAudio, validateAudioFile } from "@/lib/audioStorage";
import { setPendingAura, getPendingAura } from "@/lib/pendingAura";
import { flags } from "@/lib/featureFlags";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
// Link already imported above

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Gain an Aura — Auragram" },
      {
        name: "description",
        content:
          "Upload a sound or record a Raw Aura. Auragram turns it into a living visual identity you can share.",
      },
      { property: "og:title", content: "Gain an Aura — Auragram" },
      {
        property: "og:description",
        content:
          "Upload a sound or record a Raw Aura. Auragram turns it into a living visual identity you can share.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatePage,
});

type Mode = "file" | "raw" | "auracle";

function CreatePage() {
  const nav = useNavigate();
  const { profile, user } = useAuth();
  const hydrated = useHydrated();
  const [mode, setMode] = useState<Mode>("file");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [identity, setIdentity] = useState<{ mode: VisibilityMode; artistProfileId: string | null }>(
    { mode: "artist", artistProfileId: null },
  );
  const [resolvedIdentity, setResolvedIdentity] = useState<{ artistProfile: ArtistProfile | null; publicArtistName: string; publicHandle: string }>(
    { artistProfile: null, publicArtistName: "", publicHandle: "" },
  );
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [moods, setMoods] = useState<string[]>([]);
  const [hasVocals, setHasVocals] = useState(true);
  const [bands, setBands] = useState<BandsConfig>(DEFAULT_BANDS);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);
  const [keyDetection, setKeyDetection] = useState<KeyDetection | null>(null);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);
  const [pitchCenter, setPitchCenter] = useState<PitchCenter | null>(null);
  // Guards the one-shot auto mood detection per uploaded file.
  const autoMoodDoneRef = useRef(false);
  const analysisRunRef = useRef(0);
  const [colorInfluence, setColorInfluence] = useState<UserColorInfluence>({
    mode: "surprise",
    colors: [],
    description: "",
  });

  // Auracle (multi-file) state
  const [auracleFiles, setAuracleFiles] = useState<File[]>([]);
  const [auracleType, setAuracleType] = useState<AuracleProjectType>("ep");
  const [auracleDesc, setAuracleDesc] = useState("");

  // Consume a file handed off from the landing page drop zone
  useEffect(() => {
    import("@/lib/landingHandoff").then(({ takeLandingFile }) => {
      const f = takeLandingFile();
      if (f) {
        onPick(f);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAudioAnalysis = () => {
    analysisRunRef.current += 1;
    autoMoodDoneRef.current = false;
    setKeyDetection(null);
    setFeatures(null);
    setPitchCenter(null);
    setMoods([]);
    setAnalysisError(null);
    setAnalyzing(false);
  };

  const runAnalysis = async (f: File) => {
    const runId = analysisRunRef.current + 1;
    analysisRunRef.current = runId;
    autoMoodDoneRef.current = false;
    setKeyDetection(null);
    setFeatures(null);
    setPitchCenter(null);
    setMoods([]);
    setAnalysisError(null);
    setAnalyzing(true);
    const [keyResult, featureResult, pitchResult] = await Promise.allSettled([
      detectKey(f),
      analyzeFile(f),
      detectPitchCenter(f),
    ]);
    if (analysisRunRef.current !== runId) return;
    if (keyResult.status === "fulfilled" && keyResult.value) {
      setKeyDetection(keyResult.value);
      if (keyResult.value.confidence >= 0.15) toast.success(`Key detected: ${keyResult.value.key}`);
    }
    if (featureResult.status === "fulfilled" && featureResult.value) setFeatures(featureResult.value);
    if (pitchResult.status === "fulfilled" && pitchResult.value) setPitchCenter(pitchResult.value);
    if ([keyResult, featureResult, pitchResult].every((result) => result.status === "rejected")) {
      setAnalysisError("We couldn't read this track. Try another audio file.");
    }
    setAnalyzing(false);
  };

  const onPick = (f: File | undefined | null) => {
    if (!f) return;
    const err = validateAudioFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    if (f.size > MAX_AUDIO_BYTES) {
      toast.info("Large file detected. Auragram will compress it before upload.");
    }
    setCompressionStatus(null);
    setUploadPct(null);
    setAudio(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, "").trim());
    void runAnalysis(f);
  };

  const onRawRecorded = (f: File) => {
    setAudio(f);
    void runAnalysis(f);
  };

  const onRawClear = () => {
    setAudio(null);
    resetAudioAnalysis();
  };

  // Sync artist text from resolved identity (artist profile or username)
  // When anonymous: keep the artist field as 'Anonymous Artist' for the preview only.
  useEffect(() => {
    if (identity.mode === "anonymous") {
      if (artist !== "Anonymous Artist") setArtist("Anonymous Artist");
    } else if (resolvedIdentity.publicArtistName && artist !== resolvedIdentity.publicArtistName) {
      setArtist(resolvedIdentity.publicArtistName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.mode, resolvedIdentity.publicArtistName]);

  

  const isGuest = !hydrated || !user;
  // Guests cannot use Auracle (multi-track) or pick identity — they get a single guest Aura.
  useEffect(() => {
    if (mode === "auracle" && (isGuest || !flags.enableAuracle)) setMode("file");
    if (mode === "raw" && !flags.enableRawRecording) setMode("file");
  }, [isGuest, mode]);

  const identityReady =
    isGuest ||
    identity.mode === "anonymous" ||
    (identity.mode === "username" && !!profile?.username) ||
    (identity.mode === "artist" && !!identity.artistProfileId);
  const ready =
    !analyzing && !analysisError && identityReady && (
      mode === "auracle"
        ? title.trim().length > 0 && auracleFiles.length >= 2
        : mode === "raw"
          ? !!audio
          : !!(title.trim() && !!audio)
    );

  const detectedKeyStr = keyDetection?.key ?? null;
  const sourceType: "raw_recording" | "upload" =
    mode === "raw" ? "raw_recording" : "upload";

  const handleDetectMood = async () => {
    if (!audio) {
      toast("Couldn't detect moods yet. Pick up to 4 manually.");
      return;
    }
    let feat = features;
    if (!feat) {
      feat = await analyzeFile(audio);
      if (feat) setFeatures(feat);
    }
    let kd = keyDetection;
    if (!kd) {
      kd = await detectKey(audio);
      if (kd) setKeyDetection(kd);
    }
    const sug = suggestMoods({
      features: feat,
      keyDetection: kd,
      pitchHz: pitchCenter?.hz ?? null,
      sourceType,
    });
    if (sug.length === 0) {
      toast("Couldn't detect moods yet. Pick up to 4 manually.");
      return;
    }
    setMoods(sug);
    toast.success("Moods detected. You can still adjust them.");
  };

  // Auto-run mood detection once analysis lands — never overwrites manual picks.
  useEffect(() => {
    if (autoMoodDoneRef.current) return;
    if (!audio || !features || !keyDetection) return;
    if (moods.length > 0) return;
    autoMoodDoneRef.current = true;
    void handleDetectMood();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, features, keyDetection]);



  const onPickAuracleFiles = (files: FileList | File[] | null | undefined) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => {
      const okType = f.type.startsWith("audio/");
      const okExt = /\.(mp3|wav|m4a|aac|ogg)$/i.test(f.name);
      return okType || okExt;
    });
    if (!arr.length) {
      toast.error("Please upload audio files (.mp3, .wav, .m4a, .aac, .ogg)");
      return;
    }
    setAuracleFiles((prev) => [...prev, ...arr]);
  };

  const removeAuracleFile = (i: number) =>
    setAuracleFiles((prev) => prev.filter((_, idx) => idx !== i));

  const moveAuracleFile = (i: number, dir: -1 | 1) =>
    setAuracleFiles((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // Live preview of generated aura
  const preview = useMemo(
    () =>
      generateAura({
        id: title + artist,
        title: title || (mode === "raw" ? "Untitled Raw Aura" : "Untitled"),
        artist: artist || "Unknown",
        moods,
        detectedKey: detectedKeyStr,
        pitchCenter,
        energyOverride: features?.energy ?? null,
        keyConfidence: keyDetection?.confidence ?? null,
        sourceType,
        userColorInfluence: colorInfluence,
      }),
    [title, artist, moods, detectedKeyStr, pitchCenter, features, keyDetection, sourceType, mode, colorInfluence],
  );

  const canDetect = !!audio;

  const readinessMessage = analyzing
    ? "Analyzing your track…"
    : analysisError
      ? analysisError
      : mode === "auracle"
        ? auracleFiles.length < 2
          ? "Add at least two tracks."
          : !title.trim()
            ? "Add a project title."
            : !identityReady
              ? "Choose who this Auracle belongs to."
              : "Ready to create."
        : !audio
          ? "Add a track to continue."
          : mode === "file" && !title.trim()
            ? "Add the track title."
            : !identityReady
              ? "Choose who this Aura belongs to."
              : "Ready to generate."

  const actionLabel = busy
    ? compressionStatus || (uploadPct !== null ? `Uploading ${uploadPct}%` : "Preparing Aura…")
    : analyzing
      ? "Analyzing track…"
      : mode === "auracle"
        ? "Create Auracle"
        : "Generate Aura";

  const submit = async () => {
    if (!ready) return;
    if (isGuest) {
      const existing = getPendingAura();
      if (existing && !window.confirm("You already have an unsaved guest Aura. Replace it?")) {
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "auracle") {
        const auraIds: string[] = [];
        for (const file of auracleFiles) {
          const id = makeId();
          const trackTitle = file.name.replace(/\.[^.]+$/, "").trim() || "Untitled";
          const aura = generateAura({
            id,
            title: trackTitle,
            artist: artist.trim(),
            moods: [],
            detectedKey: null,
          });
          const audioUrl = URL.createObjectURL(file);
          setSessionAudio(id, file, audioUrl);
          if (!user) await putGuestAudio(id, file).catch(() => {});

          let uploaded: Awaited<ReturnType<typeof uploadAuraAudio>> | null = null;
          if (user) {
            try {
              uploaded = await uploadAuraAudio({ authUserId: user.id, auraId: id, file, onStatus: setCompressionStatus });
            } catch (e) {
              console.error("audio upload", e);
              toast.error(e instanceof Error ? e.message : "Upload failed. Please try again.");
              setBusy(false);
              return;
            }
          }

          const track = {
            id,
            title: trackTitle,
            artist: artist.trim(),
            artistHandle: slugify(artist.trim()) || "artist",
            seed: seedFromId(id),
            createdAt: Date.now(),
            moods: [],
            hasLocalAudio: true,
            audioStoragePath: uploaded?.storagePath,
            audioPublicUrl: uploaded?.publicUrl,
            audioFileName: uploaded?.fileName,
            audioMimeType: uploaded?.mimeType,
            audioSizeBytes: uploaded?.sizeBytes,
            audioDurationSeconds: uploaded?.durationSeconds ?? undefined,
            uploadStatus: uploaded ? ("complete" as const) : ("failed" as const),
            ...aura,
          };
          saveTrack(track);
          const saved = saveAuraFromTrack(track);
          if (profile) {
            await saveAuraToCloud({
              saved, userId: profile.id,
              visibilityMode: identity.mode,
              artistProfileId: identity.artistProfileId,
              publicArtistName: identity.mode === "anonymous" ? null : resolvedIdentity.publicArtistName || null,
              publicHandle: identity.mode === "anonymous" ? null : resolvedIdentity.publicHandle || null,
            }).catch((e) => {
              console.error("cloud save aura", e);
              toast.error("We couldn't save this Aura to the cloud.");
            });
          }
          auraIds.push(id);
        }
        const a = saveAuracle({
          title: title.trim(),
          artistName: artist.trim(),
          projectType: auracleType,
          description: auracleDesc.trim() || undefined,
          auraIds,
        });
        if (profile) {
          await saveAuracleToCloud({
            auracle: a, userId: profile.id,
            visibilityMode: identity.mode,
            artistProfileId: identity.artistProfileId,
            publicArtistName: identity.mode === "anonymous" ? null : resolvedIdentity.publicArtistName || null,
            publicHandle: identity.mode === "anonymous" ? null : resolvedIdentity.publicHandle || null,
          }).catch((e) => {
            console.error("cloud save auracle", e);
            toast.error("We couldn't save this Auracle to the cloud.");
          });
        }
        toast.success("Auracle created.");
        nav({ to: "/auracle/$id", params: { id: a.id } });
        return;
      }

      const id = makeId();
      const coverDataUrl = cover ? await fileToDataUrl(cover) : undefined;
      const finalTitle = (title.trim() || (mode === "raw" ? "Untitled Raw Aura" : title.trim()));
      const aura = generateAura({
        id,
        title: finalTitle,
        artist: artist.trim(),
        moods,
        detectedKey: detectedKeyStr,
        pitchCenter,
        energyOverride: features?.energy ?? null,
        keyConfidence: keyDetection?.confidence ?? null,
        sourceType,
        userColorInfluence: colorInfluence,
      });
      const base = {
        id,
        title: finalTitle,
        artist: artist.trim(),
        artistHandle: slugify(artist.trim()) || "artist",
        coverDataUrl,
        seed: seedFromId(id),
        hasVocals,
        bands,
        createdAt: Date.now(),
        moods,
        detectedKey: detectedKeyStr ?? undefined,
        sourceType,
        pitchCenter: pitchCenter ?? undefined,
        keyConfidence: keyDetection?.confidence,
        detectedEnergy: features?.energy,
        ...aura,
      };
      if (!audio) return;
      const audioUrl = URL.createObjectURL(audio);
      const probe = document.createElement("audio");
      if (audio.type && probe.canPlayType(audio.type) === "") {
        toast.error(
          "This audio format may not be supported by your browser. Try MP3 or WAV.",
        );
      }
      setSessionAudio(id, audio, audioUrl);
      if (!user) await putGuestAudio(id, audio).catch(() => {});

      // Upload to persistent storage (best effort — playback still works locally if it fails)
      let uploaded: Awaited<ReturnType<typeof uploadAuraAudio>> | null = null;
      if (user) {
        try {
          setUploadPct(0);
          setCompressionStatus(null);
          uploaded = await uploadAuraAudio({
            authUserId: user.id,
            auraId: id,
            file: audio,
            rawRecording: mode === "raw",
            onProgress: (pct) => setUploadPct(pct),
            onStatus: setCompressionStatus,
          });
        } catch (e) {
          console.error("audio upload", e);
          toast.error(e instanceof Error ? e.message : "Upload failed. Please try again.");
          setBusy(false);
          setUploadPct(null);
          return;
        }
      }

      const fullTrack = {
        ...base,
        hasLocalAudio: true,
        audioStoragePath: uploaded?.storagePath,
        audioPublicUrl: uploaded?.publicUrl,
        audioFileName: uploaded?.fileName,
        audioMimeType: uploaded?.mimeType,
        audioSizeBytes: uploaded?.sizeBytes,
        audioDurationSeconds: uploaded?.durationSeconds ?? undefined,
        uploadStatus: uploaded ? ("complete" as const) : ("failed" as const),
      };
      saveTrack(fullTrack);
      // Persist to cloud (owner-only). Single-aura flow.
      if (profile) {
        const saved = saveAuraFromTrack(fullTrack as Parameters<typeof saveAuraFromTrack>[0]);
        await saveAuraToCloud({
          saved, userId: profile.id,
          visibilityMode: identity.mode,
          artistProfileId: identity.artistProfileId,
          publicArtistName: identity.mode === "anonymous" ? null : resolvedIdentity.publicArtistName || null,
          publicHandle: identity.mode === "anonymous" ? null : resolvedIdentity.publicHandle || null,
        }).catch((e) => {
          console.error("cloud save aura", e);
          toast.error("We couldn't save your Aura to the cloud. Try again.");
        });
      } else if (isGuest) {
        // Guest path: keep local-only, mark as pending so we can claim post-signup.
        saveAuraFromTrack(fullTrack as Parameters<typeof saveAuraFromTrack>[0]);
        setPendingAura({ id, createdAt: Date.now() });
      }
      nav({ to: "/generating", search: { id } });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong preparing your track.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-xl px-5 sm:px-8 py-8 sm:py-16 pb-8 sm:pb-20">
        <div className="text-center animate-fade-up">
          <h1 className="font-display text-4xl sm:text-5xl">
            {mode === "auracle" ? (
              <>Create an <span className="text-aura-gradient">Auracle.</span></>
            ) : (
              <>Create an <span className="text-aura-gradient">Aura.</span></>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {mode === "auracle"
              ? "Upload multiple tracks at once. We'll turn each into an Aura and group them into a living project."
              : "Upload a sound or record a Raw Aura. Auragram turns it into a living visual identity you can share."}
          </p>
          <div className="mt-3 flex justify-center">
            <HelpLink hash="creating-auras" />
          </div>
        </div>

        {isGuest && (
          <div className="mt-6 mx-auto max-w-md glass rounded-2xl px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground animate-fade-up">
            <span className="text-foreground">Try one Aura free.</span>{" "}
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Sign up
            </Link>{" "}
            to save it and build your music-first AuraLink. Guest previews expire after 72 hours.
          </div>
        )}

        <div className="mt-7 space-y-5 animate-fade-up sm:mt-9">
          {/* Mode toggle — only show if any alt mode is enabled */}
          {(flags.enableRawRecording || (flags.enableAuracle && !isGuest)) && (
            <div className={`glass rounded-full p-1 grid text-sm gap-0.5`} style={{ gridTemplateColumns: `repeat(${1 + (flags.enableRawRecording ? 1 : 0) + (flags.enableAuracle && !isGuest ? 1 : 0)}, minmax(0,1fr))` }}>
              <ModeTab active={mode === "file"} onClick={() => setMode("file")}>
                <UploadCloud className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">File</span>
              </ModeTab>
              {flags.enableRawRecording && (
                <ModeTab active={mode === "raw"} onClick={() => setMode("raw")}>
                  <Mic className="h-4 w-4" />
                  <span className="hidden sm:inline">Raw Aura</span>
                  <span className="sm:hidden">Raw</span>
                </ModeTab>
              )}
              {flags.enableAuracle && !isGuest && (
                <ModeTab active={mode === "auracle"} onClick={() => setMode("auracle")}>
                  <Layers className="h-4 w-4" /> Auracle
                </ModeTab>
              )}
            </div>
          )}


          {mode === "auracle" ? (
            <>
              {/* Multi-file uploader */}
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  onPickAuracleFiles(e.dataTransfer.files);
                }}
                className={`relative block cursor-pointer rounded-3xl p-6 sm:p-10 text-center transition-all glass ${
                  drag ? "shadow-[0_0_60px_-10px_oklch(0.7_0.2_310/0.7)] border-foreground/30" : ""
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="audio/*,.mp3,.wav,.m4a,.ogg"
                  className="hidden"
                  onChange={(e) => onPickAuracleFiles(e.target.files)}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="grid place-items-center h-12 w-12 rounded-full glass-strong">
                    <Layers className="h-5 w-5 text-foreground/85" />
                  </div>
                  <p className="font-display text-base">
                    {auracleFiles.length
                      ? `${auracleFiles.length} track${auracleFiles.length === 1 ? "" : "s"} added`
                      : "Drop multiple tracks here"}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    Tap to choose · .mp3 · .wav
                  </p>
                </div>
              </label>

              {/* Tracklist */}
              {auracleFiles.length > 0 && (
                <div className="glass rounded-3xl p-3 space-y-2">
                  {auracleFiles.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-3 rounded-2xl bg-background/40 border border-border/60 px-3 py-2"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground w-6 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm">{f.name.replace(/\.[^.]+$/, "")}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(f.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => moveAuracleFile(i, -1)}
                        disabled={i === 0}
                        className="rounded-full p-1.5 hover:bg-foreground/10 disabled:opacity-30 transition-colors"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveAuracleFile(i, 1)}
                        disabled={i === auracleFiles.length - 1}
                        className="rounded-full p-1.5 hover:bg-foreground/10 disabled:opacity-30 transition-colors"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAuracleFile(i)}
                        className="rounded-full p-1.5 hover:bg-foreground/10 transition-colors"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Project type */}
              <div className="glass rounded-2xl p-2 flex flex-wrap gap-1">
                {(Object.keys(PROJECT_TYPE_LABELS) as AuracleProjectType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAuracleType(t)}
                    className={`rounded-full px-3 h-8 text-xs transition-colors ${
                      auracleType === t
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {PROJECT_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              {/* Project fields */}
              <div className="grid sm:grid-cols-2 gap-3">
                <Field
                  label="Project title"
                  value={title}
                  onChange={setTitle}
                  placeholder="Midnight EP"
                />
                <Field
                  label="Artist name"
                  value={artist}
                  onChange={setArtist}
                  placeholder="Your name"
                />
              </div>

              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">
                  Description · optional
                </span>
                <textarea
                  value={auracleDesc}
                  onChange={(e) => setAuracleDesc(e.target.value)}
                  rows={2}
                  placeholder="A few words about the project"
                  className="mt-1.5 w-full glass rounded-2xl px-4 py-3 text-sm outline-none focus:border-foreground/25 transition-shadow resize-none"
                />
              </label>
            </>
          ) : (
            <>
              {mode === "file" ? (
                <>
                  <StepSection number="1" title="Add your track" description="Choose the audio that will shape this Aura.">
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDrag(false);
                      onPick(e.dataTransfer.files?.[0]);
                    }}
                    className={`relative block cursor-pointer rounded-2xl p-7 sm:p-10 text-center transition-all glass-strong press-depth ${
                      drag
                        ? "shadow-[0_0_60px_-10px_oklch(0.7_0.2_310/0.7)] border-foreground/30"
                        : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.ogg"
                      className="hidden"
                      onChange={(e) => onPick(e.target.files?.[0])}
                    />
                    {!audio ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="grid place-items-center h-12 w-12 rounded-full glass-strong">
                          <UploadCloud className="h-5 w-5 text-foreground/85" />
                        </div>
                        <p className="font-display text-base">Drop your track here</p>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                          .mp3 · .wav · 100 MB limit
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-left">
                        <div className="grid place-items-center h-11 w-11 rounded-2xl bg-aura-gradient text-primary-foreground">
                          <Music2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{audio.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatAudioSize(audio.size)}
                            {audio.size > MAX_AUDIO_BYTES ? " · will compress" : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setAudio(null);
                            resetAudioAnalysis();
                          }}
                          className="rounded-full p-2 hover:bg-foreground/10 transition-colors"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </label>
                  {audio && <AnalysisRail analyzing={analyzing} error={analysisError} />}
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    MP3, WAV, M4A, AAC, or OGG · 100 MB maximum. Larger files compress after you generate.
                  </p>
                  {isGuest && (
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      This preview expires after 72 hours. Sign up to keep it permanently.
                    </p>
                  )}
                  </StepSection>
                </>
              ) : (
                <RawAuraRecorder file={audio} onReady={onRawRecorded} onClear={onRawClear} />
              )}

              {/* Fields */}
              <StepSection number="2" title="Song details" description="Add the title and choose how your identity appears.">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field
                  label={mode === "raw" ? "Title · optional" : "Track title"}
                  value={title}
                  onChange={setTitle}
                  placeholder={mode === "raw" ? "Untitled Raw Aura" : "Midnight Echoes"}
                />
                <Field
                  label="Artist name"
                  value={artist}
                  onChange={setArtist}
                  placeholder="Your name"
                />
              </div>


              {/* Public Identity (signed-in only) */}
              {!isGuest && (
                <>
                  <IdentitySelector value={identity} onChange={setIdentity} onResolve={setResolvedIdentity} />
                  {identity.mode === "anonymous" && (
                    <p className="px-2 text-[11px] text-muted-foreground">
                      Your AuraLink will not show your artist name or username. The Aura page itself stays publicly viewable by anyone with the link.
                    </p>
                  )}
                </>
              )}
              <p className={`flex items-center gap-2 px-1 text-xs ${ready ? "text-foreground" : "text-muted-foreground"}`} role="status">
                {ready ? <CheckCircle2 className="h-4 w-4 text-primary" /> : analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {readinessMessage}
              </p>
              </StepSection>

              {/* Mood picker + live preview */}
              <StepSection number="3" title="Shape the Aura" description="Review the detected character, then refine only what matters to you.">
              <div className="space-y-5">
                <MoodPicker
                  value={moods}
                  onChange={setMoods}
                  glowColor={preview.colors?.glow}
                  onDetect={handleDetectMood}
                  detectLabel={moods.length > 0 ? "Re-detect" : "Detect Mood"}
                  canDetect={canDetect}
                  compact
                />

                <BandCustomizer
                  value={bands}
                  onChange={setBands}
                  swatches={preview.colors?.swatches}
                  hasVocals={hasVocals}
                  onHasVocalsChange={setHasVocals}
                />

                {flags.enableColorInfluence && (
                  <ColorInfluence value={colorInfluence} onChange={setColorInfluence} />
                )}

                <div className="glass-hero grid grid-cols-[88px_1fr] items-center gap-4 rounded-2xl p-4">
                  <div className="grid place-items-center">
                    <Aurascope
                      aura={{
                        id: "create-preview",
                        palette: preview.palette,
                        seed: seedFromId(title + artist || "create-preview"),
                        colors: preview.colors,
                        moods,
                        energy: features?.energy,
                        hasVocals,
                        bands,
                      }}
                      size="mini"
                      mode="card"
                      showLabel={false}
                      animate={!analyzing}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-muted-foreground">Aura preview</div>
                    <div className="mt-1 truncate font-display text-base text-foreground">Name unrevealed</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {[detectedKeyStr, features ? `${Math.round(features.energy * 100)}% energy` : null, moods.slice(0, 2).join(" · ")]
                        .filter(Boolean)
                        .join(" · ") || "Add a track to reveal its musical character."}
                    </p>
                  </div>
                </div>
              </div>
              </StepSection>

              {/* Optional cover */}
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate text-muted-foreground">
                  {cover ? cover.name : "Cover image · optional"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="cover-input"
                  onChange={(e) => setCover(e.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="cover-input"
                  className="cursor-pointer text-xs rounded-full border border-border/70 px-3 py-1.5 hover:bg-foreground/5 transition-colors"
                >
                  Choose
                </label>
              </div>
            </>
          )}

          <button
            disabled={!ready || busy}
            onClick={submit}
            className="hidden sm:inline-flex w-full items-center justify-center gap-2 rounded-full h-13 py-4 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)] transition-shadow"
          >
            {actionLabel}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>

      <div
        aria-hidden
        className={`sm:hidden ${isGuest ? "create-mobile-clearance--guest" : "create-mobile-clearance--signed-in"}`}
      />
      {/* Mobile action dock sits above signed-in navigation or the guest safe area. */}
      <div className={`fixed inset-x-3 z-40 sm:hidden ${isGuest ? "create-mobile-dock--guest" : "create-mobile-dock--signed-in"}`}>
        <div className="glass-nav mx-auto max-w-md rounded-2xl border border-border/60 p-2 shadow-[var(--shadow-3)]">
        <Button
          disabled={!ready || busy}
          onClick={submit}
          className="h-12 w-full rounded-xl bg-aura-gradient text-sm text-primary-foreground shadow-[0_0_40px_-12px_var(--aura-pink)]"
        >
          {(busy || analyzing) && <Loader2 className="h-4 w-4 animate-spin" />}
          {actionLabel}
          {!busy && !analyzing && <ArrowRight className="h-4 w-4" />}
        </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 h-10 rounded-full transition-all ${
        active
          ? "bg-foreground/10 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.1)]"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full glass rounded-2xl px-4 h-12 text-sm outline-none focus:border-foreground/25 focus:shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.7)] transition-shadow"
      />
    </label>
  );
}

function StepSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border/70 bg-background/40 text-xs font-medium text-foreground">
          {number}
        </span>
        <div>
          <h2 className="font-display text-lg text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function AnalysisRail({
  analyzing,
  error,
}: {
  analyzing: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto mt-4 max-w-md" aria-live="polite">
      <Progress value={analyzing ? 62 : error ? 100 : 100} />
      <p className={`mt-2 flex items-center justify-center gap-2 text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {analyzing ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading key, energy, pitch, and mood…</>
        ) : error ? (
          error
        ) : (
          <><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Track analysis complete</>
        )}
      </p>
    </div>
  );
}
