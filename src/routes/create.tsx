import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { UploadCloud, Music2, ArrowRight, X, Image as ImageIcon } from "lucide-react";
import { fileToDataUrl, makeId, saveTrack, seedFromId } from "@/lib/tracks";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create your Auragram" },
      { name: "description", content: "Upload your track and begin the transformation." },
      { property: "og:title", content: "Create your Auragram" },
      {
        property: "og:description",
        content: "Upload your track and turn it into a living visual aura.",
      },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (f: File | undefined | null) => {
    if (!f) return;
    if (!/^audio\//.test(f.type) && !/\.(mp3|wav|m4a|ogg)$/i.test(f.name)) {
      toast.error("Please upload an audio file (.mp3, .wav)");
      return;
    }
    setAudio(f);
  };

  const ready = title.trim() && artist.trim() && audio;

  const submit = async () => {
    if (!ready || !audio) return;
    setBusy(true);
    try {
      const id = makeId();
      const audioDataUrl = await fileToDataUrl(audio);
      const coverDataUrl = cover ? await fileToDataUrl(cover) : undefined;
      saveTrack({
        id,
        title: title.trim(),
        artist: artist.trim(),
        audioDataUrl,
        coverDataUrl,
        seed: seedFromId(id),
        createdAt: Date.now(),
      });
      nav({ to: "/generating", search: { id } });
    } catch (e) {
      console.error(e);
      toast.error("Could not read that file. Try a smaller one.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-8 py-12 sm:py-20">
        <div className="text-center animate-fade-up">
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">
            Offer your <span className="text-aura-gradient">sound.</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Upload your track and begin the transformation.
          </p>
        </div>

        <div className="mt-10 space-y-5 animate-fade-up">
          {/* Drop zone */}
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
            className={`relative block cursor-pointer rounded-2xl border border-dashed p-8 sm:p-12 text-center transition-all glass ${
              drag
                ? "border-foreground/40 shadow-[0_0_60px_-10px_oklch(0.7_0.2_310/0.7)]"
                : "border-border/70 hover:border-foreground/25"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
            {!audio ? (
              <div className="flex flex-col items-center gap-3">
                <div className="grid place-items-center h-14 w-14 rounded-full bg-aura-gradient/10 border border-border/70">
                  <UploadCloud className="h-6 w-6 text-foreground/80" />
                </div>
                <p className="font-display text-lg">Drop your track here</p>
                <p className="text-xs text-muted-foreground">.mp3 · .wav — up to ~20MB</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-left">
                <div className="grid place-items-center h-12 w-12 rounded-xl bg-aura-gradient text-primary-foreground">
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
                  className="rounded-full p-2 hover:bg-foreground/10"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </label>

          {/* Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
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

          {/* Optional cover */}
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cover image · optional
            </span>
            <div className="mt-2 flex items-center gap-3 glass rounded-xl px-4 py-3">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">
                {cover ? cover.name : "No image selected"}
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
                className="cursor-pointer text-xs rounded-full border border-border/70 px-3 py-1.5 hover:bg-foreground/5"
              >
                Choose
              </label>
            </div>
          </label>

          <button
            disabled={!ready || busy}
            onClick={submit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full h-13 py-4 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)]"
          >
            {busy ? "Preparing…" : "Generate Aura"} <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Your track stays on your device for now.
          </p>
        </div>
      </main>
      <Footer />
    </div>
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
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full glass rounded-xl px-4 h-12 text-sm bg-background/30 outline-none focus:border-foreground/30 focus:shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.7)]"
      />
    </label>
  );
}
