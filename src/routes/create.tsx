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
} from "lucide-react";
import {
  detectProvider,
  fileToDataUrl,
  makeId,
  saveTrack,
  seedFromId,
} from "@/lib/tracks";
import { setSessionAudio } from "@/lib/session";
import { generateAura, slugify } from "@/lib/aura";
import { MoodPicker } from "@/components/MoodPicker";
import { OrbVisual } from "@/components/OrbVisual";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create an Aura — Auragram" },
      {
        name: "description",
        content:
          "Upload a sound or paste a music link. Auragram turns it into a living visual identity you can share.",
      },
      { property: "og:title", content: "Create an Aura — Auragram" },
      {
        property: "og:description",
        content:
          "Upload a sound or paste a music link. Auragram turns it into a living visual identity you can share.",
      },
    ],
  }),
  component: CreatePage,
});

type Mode = "file" | "link";

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

  const onPick = (f: File | undefined | null) => {
    if (!f) return;
    const okType = f.type.startsWith("audio/");
    const okExt = /\.(mp3|wav|m4a|aac|ogg)$/i.test(f.name);
    if (!okType && !okExt) {
      toast.error("Please upload an audio file (.mp3, .wav, .m4a, .aac, .ogg)");
      return;
    }
    console.log("Selected file:", f);
    console.log("File type:", f.type);
    setAudio(f);
  };

  const linkInfo = link.trim() ? detectProvider(link.trim()) : null;
  const ready =
    title.trim() &&
    artist.trim() &&
    (mode === "file" ? !!audio : !!linkInfo);

  // Live preview of generated aura
  const preview = useMemo(
    () =>
      generateAura({
        id: title + artist,
        title: title || "Untitled",
        artist: artist || "Unknown",
        moods,
      }),
    [title, artist, moods],
  );

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      const id = makeId();
      const coverDataUrl = cover ? await fileToDataUrl(cover) : undefined;
      const aura = generateAura({ id, title: title.trim(), artist: artist.trim(), moods });
      const base = {
        id,
        title: title.trim(),
        artist: artist.trim(),
        artistHandle: slugify(artist.trim()) || "artist",
        coverDataUrl,
        seed: seedFromId(id),
        createdAt: Date.now(),
        moods,
        ...aura,
      };
      if (mode === "file") {
        if (!audio) return;
        // Create a temporary object URL — do NOT read or persist the file.
        const audioUrl = URL.createObjectURL(audio);
        console.log("Audio URL:", audioUrl);

        // Validate the browser can decode this format before continuing.
        const probe = document.createElement("audio");
        const canPlay =
          probe.canPlayType(audio.type || "") ||
          probe.canPlayType("audio/mpeg") ||
          "";
        if (audio.type && probe.canPlayType(audio.type) === "") {
          toast.error(
            "This audio format may not be supported by your browser. Try MP3 or WAV.",
          );
        }
        void canPlay;

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
            Create an <span className="text-aura-gradient">Aura.</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Upload a sound or paste a music link. Auragram turns it into a living visual identity you can share.
          </p>
        </div>

        <div className="mt-10 space-y-5 animate-fade-up">
          {/* Mode toggle */}
          <div className="glass rounded-full p-1 grid grid-cols-2 text-sm">
            <ModeTab active={mode === "file"} onClick={() => setMode("file")}>
              <UploadCloud className="h-4 w-4" /> Upload File
            </ModeTab>
            <ModeTab active={mode === "link"} onClick={() => setMode("link")}>
              <LinkIcon className="h-4 w-4" /> Paste Music Link
            </ModeTab>
          </div>

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
            <MoodPicker value={moods} onChange={setMoods} />

            <div className="flex items-center gap-4 pt-1">
              <OrbVisual size={72} palette={preview.palette} particles={false} />
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

          <button
            disabled={!ready || busy}
            onClick={submit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full h-13 py-4 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)] transition-shadow"
          >
            {busy ? "Preparing…" : "Generate Aura"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
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
