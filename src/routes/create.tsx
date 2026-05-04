import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import {
  UploadCloud,
  Music2,
  ArrowRight,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Layers,
  GripVertical,
  Mic,
} from "lucide-react";
import {
  detectProvider,
  fileToDataUrl,
  makeId,
  saveTrack,
  seedFromId,
} from "@/lib/tracks";
import { setSessionAudio } from "@/lib/session";
import { generateAura, slugify, type PitchCenter } from "@/lib/aura";
import { detectKey, detectPitchCenter, type KeyDetection } from "@/lib/keyDetect";
import { analyzeFile, type AudioFeatures } from "@/lib/audioFeatures";
import { suggestMoods } from "@/lib/moodDetect";
import { MoodPicker } from "@/components/MoodPicker";
import { OrbVisual } from "@/components/OrbVisual";
import { RawAuraRecorder } from "@/components/RawAuraRecorder";
import { saveAuraFromTrack } from "@/lib/farm";
import {
  PROJECT_TYPE_LABELS,
  saveAuracle,
  type AuracleProjectType,
} from "@/lib/auracle";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Gain an Aura — Auragram" },
      {
        name: "description",
        content:
          "Upload a sound, paste a music link, or record a Raw Aura. Auragram turns it into a living visual identity you can share.",
      },
      { property: "og:title", content: "Gain an Aura — Auragram" },
      {
        property: "og:description",
        content:
          "Upload a sound, paste a music link, or record a Raw Aura. Auragram turns it into a living visual identity you can share.",
      },
    ],
  }),
  component: CreatePage,
});

type Mode = "file" | "link" | "raw" | "auracle";

function CreatePage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("file");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [keyDetection, setKeyDetection] = useState<KeyDetection | null>(null);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);
  const [pitchCenter, setPitchCenter] = useState<PitchCenter | null>(null);

  // Auracle (multi-file) state
  const [auracleFiles, setAuracleFiles] = useState<File[]>([]);
  const [auracleType, setAuracleType] = useState<AuracleProjectType>("ep");
  const [auracleDesc, setAuracleDesc] = useState("");

  const runAnalysis = (f: File) => {
    setKeyDetection(null);
    setFeatures(null);
    setPitchCenter(null);
    detectKey(f).then((res) => {
      if (res) {
        setKeyDetection(res);
        if (res.confidence >= 0.15) toast.success(`Key detected: ${res.key}`);
      }
    }).catch(() => {});
    analyzeFile(f).then((feat) => { if (feat) setFeatures(feat); }).catch(() => {});
    detectPitchCenter(f).then((pc) => { if (pc) setPitchCenter(pc); }).catch(() => {});
  };

  const onPick = (f: File | undefined | null) => {
    if (!f) return;
    const okType = f.type.startsWith("audio/");
    const okExt = /\.(mp3|wav|m4a|aac|ogg)$/i.test(f.name);
    if (!okType && !okExt) {
      toast.error("Please upload an audio file (.mp3, .wav, .m4a, .aac, .ogg)");
      return;
    }
    setAudio(f);
    runAnalysis(f);
  };

  const onRawRecorded = (f: File) => {
    setAudio(f);
    runAnalysis(f);
  };

  const onRawClear = () => {
    setAudio(null);
    setKeyDetection(null);
    setFeatures(null);
    setPitchCenter(null);
  };

  const linkInfo = link.trim() ? detectProvider(link.trim()) : null;
  const ready =
    mode === "auracle"
      ? title.trim().length > 0 && artist.trim().length > 0 && auracleFiles.length >= 2
      : mode === "raw"
        ? !!audio && artist.trim().length > 0
        : !!(title.trim() && artist.trim() && (mode === "file" ? !!audio : !!linkInfo));

  const detectedKeyStr = keyDetection?.key ?? null;
  const sourceType: "raw_recording" | "platform_link" | "upload" =
    mode === "raw" ? "raw_recording" : mode === "link" ? "platform_link" : "upload";

  const handleDetectMood = async () => {
    if (mode === "link") {
      const sug = suggestMoods({
        title: title.trim(),
        artist: artist.trim(),
        keyDetection,
        sourceType: "platform_link",
      });
      if (sug.length === 0) {
        toast("Couldn't detect moods yet. Pick up to 4 manually.");
        return;
      }
      setMoods(sug);
      toast.success("Moods detected. You can still adjust them.");
      return;
    }
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
      }),
    [title, artist, moods, detectedKeyStr, pitchCenter, features, keyDetection, sourceType, mode],
  );

  const canDetect = mode === "link" ? !!(title.trim() || artist.trim()) : !!audio;

  const submit = async () => {
    if (!ready) return;
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
          const track = {
            id,
            title: trackTitle,
            artist: artist.trim(),
            artistHandle: slugify(artist.trim()) || "artist",
            seed: seedFromId(id),
            createdAt: Date.now(),
            moods: [],
            hasLocalAudio: true,
            ...aura,
          };
          saveTrack(track);
          saveAuraFromTrack(track);
          auraIds.push(id);
        }
        const a = saveAuracle({
          title: title.trim(),
          artistName: artist.trim(),
          projectType: auracleType,
          description: auracleDesc.trim() || undefined,
          auraIds,
        });
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
      });
      const base = {
        id,
        title: finalTitle,
        artist: artist.trim(),
        artistHandle: slugify(artist.trim()) || "artist",
        coverDataUrl,
        seed: seedFromId(id),
        createdAt: Date.now(),
        moods,
        detectedKey: detectedKeyStr ?? undefined,
        sourceType,
        pitchCenter: pitchCenter ?? undefined,
        keyConfidence: keyDetection?.confidence,
        detectedEnergy: features?.energy,
        ...aura,
      };
      if (mode === "file" || mode === "raw") {
        if (!audio) return;
        const audioUrl = URL.createObjectURL(audio);
        const probe = document.createElement("audio");
        if (audio.type && probe.canPlayType(audio.type) === "") {
          toast.error(
            "This audio format may not be supported by your browser. Try MP3 or WAV.",
          );
        }
        setSessionAudio(id, audio, audioUrl);
        saveTrack({ ...base, hasLocalAudio: true });
      } else {
        if (!linkInfo) return;
        saveTrack({
          ...base,
          streamUrl: link.trim(),
          provider: linkInfo.provider,
          embedUrl: linkInfo.embedUrl,
        });
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
      <main className="flex-1 mx-auto w-full max-w-xl px-5 sm:px-8 py-12 sm:py-20 pb-32 sm:pb-20">
        <div className="text-center animate-fade-up">
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">
            {mode === "auracle" ? (
              <>Create an <span className="text-aura-gradient">Auracle.</span></>
            ) : (
              <>Create an <span className="text-aura-gradient">Aura.</span></>
            )}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {mode === "auracle"
              ? "Upload multiple tracks at once. We'll turn each into an Aura and group them into a living project."
              : "Upload a sound or paste a music link. Auragram turns it into a living visual identity you can share."}
          </p>
        </div>

        <div className="mt-10 space-y-5 animate-fade-up">
          {/* Mode toggle */}
          <div className="glass rounded-full p-1 grid grid-cols-3 text-sm">
            <ModeTab active={mode === "file"} onClick={() => setMode("file")}>
              <UploadCloud className="h-4 w-4" /> <span className="hidden sm:inline">Upload</span> File
            </ModeTab>
            <ModeTab active={mode === "link"} onClick={() => setMode("link")}>
              <LinkIcon className="h-4 w-4" /> <span className="hidden sm:inline">Paste</span> Link
            </ModeTab>
            <ModeTab active={mode === "auracle"} onClick={() => setMode("auracle")}>
              <Layers className="h-4 w-4" /> Auracle
            </ModeTab>
          </div>

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
                  className={`relative block cursor-pointer rounded-3xl p-8 sm:p-12 text-center transition-all glass ${
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
                        .mp3 · .wav
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
                          {(audio.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setAudio(null);
                        }}
                        className="rounded-full p-2 hover:bg-foreground/10 transition-colors"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </label>
              ) : (
                <div className="glass rounded-3xl p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-background/40 border border-border/60 px-4 h-12">
                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="Paste a Spotify, Apple Music, YouTube, or SoundCloud link"
                      className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </div>
                  <p className="text-[11px] tracking-wide text-muted-foreground px-1">
                    {linkInfo
                      ? linkInfo.embedUrl
                        ? `Detected: ${labelFor(linkInfo.provider)} · we'll embed the player.`
                        : `We'll link out to ${labelFor(linkInfo.provider)}.`
                      : link
                        ? "Doesn't look like a valid URL yet."
                        : "Spotify · Apple Music · YouTube · SoundCloud"}
                  </p>
                </div>
              )}

              {/* Fields */}
              <div className="grid sm:grid-cols-2 gap-3">
                <Field
                  label="Track title"
                  value={title}
                  onChange={setTitle}
                  placeholder="Midnight Echoes"
                />
                <Field
                  label="Artist name"
                  value={artist}
                  onChange={setArtist}
                  placeholder="Your name"
                />
              </div>

              {/* Mood picker + live preview */}
              <div className="glass-strong rounded-3xl p-5 sm:p-6 space-y-5">
                <MoodPicker value={moods} onChange={setMoods} glowColor={preview.colors?.glow} />

                <div className="flex items-center gap-4 pt-1">
                  <OrbVisual size={72} palette={preview.palette} profile={preview} particles={false} />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      Your aura
                    </div>
                    <div className="font-display text-base sm:text-lg truncate text-aura-gradient">
                      {preview.auraName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Energy {preview.energy}%
                    </div>
                  </div>
                </div>
              </div>

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
            {busy
              ? "Preparing…"
              : mode === "auracle"
                ? "Create Auracle"
                : "Generate Aura"}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>

      {/* Sticky mobile CTA */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 backdrop-blur-xl bg-background/80 border-t border-border/40 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          disabled={!ready || busy}
          onClick={submit}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_40px_-12px_oklch(0.7_0.2_310/0.9)]"
        >
          {busy
            ? "Preparing…"
            : mode === "auracle"
              ? "Create Auracle"
              : "Generate Aura"}{" "}
          <ArrowRight className="h-4 w-4" />
        </button>
        {!ready && (
          <p className="mt-1.5 text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {mode === "auracle"
              ? "Add 2+ tracks, project title, and artist"
              : "Add a track and the song details"}
          </p>
        )}
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

function labelFor(p: string) {
  return (
    {
      spotify: "Spotify",
      youtube: "YouTube",
      "youtube-music": "YouTube Music",
      soundcloud: "SoundCloud",
      apple: "Apple Music",
      audiomack: "Audiomack",
      bandcamp: "Bandcamp",
      tidal: "Tidal",
      deezer: "Deezer",
      amazon: "Amazon Music",
      pandora: "Pandora",
      boomplay: "Boomplay",
      audius: "Audius",
      smartlink: "Smart Link",
      external: "External Link",
    }[p] || "External Link"
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
