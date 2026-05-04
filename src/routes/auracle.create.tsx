import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { OrbVisual } from "@/components/OrbVisual";
import { getSavedAuras, type SavedAura } from "@/lib/farm";
import {
  PROJECT_TYPE_LABELS,
  saveAuracle,
  type AuracleProjectType,
} from "@/lib/auracle";

type Search = { seed?: string };

export const Route = createFileRoute("/auracle/create")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    seed: typeof s.seed === "string" ? s.seed : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create Auracle — Auragram" },
      {
        name: "description",
        content:
          "Group Auras from your Farm into a living album, EP, playlist, or rollout.",
      },
      { property: "og:title", content: "Create Auracle — Auragram" },
      {
        property: "og:description",
        content:
          "Group Auras from your Farm into a living album, EP, playlist, or rollout.",
      },
    ],
  }),
  component: CreateAuraclePage,
});

const TYPES: AuracleProjectType[] = [
  "album",
  "ep",
  "playlist",
  "demo_pack",
  "rollout",
];

function CreateAuraclePage() {
  const nav = useNavigate();
  const { seed } = Route.useSearch();
  const [auras, setAuras] = useState<SavedAura[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [projectType, setProjectType] = useState<AuracleProjectType>("ep");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const list = getSavedAuras();
    setAuras(list);
    if (list[0] && !artist) setArtist(list[0].artistName);
    if (seed && list.some((a) => a.id === seed)) {
      setSelected((prev) => (prev.includes(seed) ? prev : [seed, ...prev]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const auraMap = useMemo(
    () => new Map(auras.map((a) => [a.id, a])),
    [auras],
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const move = (id: string, dir: -1 | 1) =>
    setSelected((prev) => {
      const i = prev.indexOf(id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const ready =
    title.trim().length > 0 &&
    artist.trim().length > 0 &&
    selected.length >= 2;

  const submit = () => {
    if (!ready) return;
    const a = saveAuracle({
      title: title.trim(),
      artistName: artist.trim(),
      projectType,
      description: description.trim() || undefined,
      auraIds: selected,
    });
    toast.success("Auracle created.");
    nav({ to: "/auracle/$id", params: { id: a.id } });
  };

  if (auras.length < 2) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav showCta={false} />
        <main className="flex-1 mx-auto w-full max-w-md px-5 sm:px-8 py-16 sm:py-24 text-center">
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            Create <span className="text-aura-gradient">Auracle.</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-sm">
            Save at least 2 Auras to your Farm first.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-medium text-primary-foreground bg-aura-gradient"
          >
            Gain Aura <ArrowRight className="h-4 w-4" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-8 py-12 sm:py-20 pb-32 sm:pb-20">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <Layers className="h-3 w-3" /> Auracle
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl tracking-tight">
            Create <span className="text-aura-gradient">Auracle.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Group Auras from your Farm into a living album, EP, playlist, or rollout.
          </p>
        </div>

        <div className="mt-10 space-y-5 animate-fade-up">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Auracle title" value={title} onChange={setTitle} placeholder="Midnight Volume One" />
            <Field label="Artist name" value={artist} onChange={setArtist} placeholder="Your name" />
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Project type
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setProjectType(t)}
                  className={`rounded-full px-3.5 h-8 text-xs uppercase tracking-[0.2em] transition-colors ${
                    projectType === t
                      ? "bg-aura-gradient text-primary-foreground"
                      : "border border-border/60 bg-background/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {PROJECT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">
                Description · optional
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="A few words about this project…"
                className="mt-1.5 w-full glass rounded-2xl px-4 py-3 text-sm outline-none focus:border-foreground/25"
              />
            </label>
          </div>

          {/* Aura selection */}
          <div className="glass-strong rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Select Auras from Farm
              </div>
              <span className="text-[11px] text-muted-foreground">
                {selected.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {auras.map((a) => {
                const sel = selected.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggle(a.id)}
                    className={`relative rounded-2xl p-3 flex flex-col items-center gap-2 transition-all ${
                      sel
                        ? "bg-aura-gradient/10 ring-2 ring-foreground/40 shadow-[0_0_30px_-10px_oklch(0.7_0.2_310/0.9)]"
                        : "border border-border/60 bg-background/30 hover:bg-foreground/5"
                    }`}
                  >
                    {sel && (
                      <span className="absolute top-2 right-2 h-5 w-5 grid place-items-center rounded-full bg-aura-gradient text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <OrbVisual size={56} palette={a.palette} hueShift={a.seed} particles={false} />
                    <div className="w-full min-w-0 text-center">
                      <div className="text-xs font-medium truncate">{a.trackTitle}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {a.auraName}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order */}
          {selected.length > 0 && (
            <div className="glass rounded-3xl p-5 sm:p-6 space-y-2">
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Order
              </div>
              <ul className="space-y-2">
                {selected.map((id, i) => {
                  const a = auraMap.get(id);
                  if (!a) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/30 p-2.5"
                    >
                      <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <OrbVisual size={36} palette={a.palette} hueShift={a.seed} particles={false} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{a.trackTitle}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {a.auraName}
                        </div>
                      </div>
                      <button
                        onClick={() => move(id, -1)}
                        aria-label="Move up"
                        disabled={i === 0}
                        className="rounded-full p-2 hover:bg-foreground/10 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => move(id, 1)}
                        aria-label="Move down"
                        disabled={i === selected.length - 1}
                        className="rounded-full p-2 hover:bg-foreground/10 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggle(id)}
                        aria-label="Remove"
                        className="rounded-full p-2 hover:bg-foreground/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <button
            disabled={!ready}
            onClick={submit}
            className="hidden sm:inline-flex w-full items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)]"
          >
            <Sparkles className="h-4 w-4" /> Create Auracle
          </button>
        </div>
      </main>

      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 backdrop-blur-xl bg-background/80 border-t border-border/40 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          disabled={!ready}
          onClick={submit}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" /> Create Auracle
        </button>
        {!ready && (
          <p className="mt-1.5 text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Add a title, artist, and at least 2 Auras
          </p>
        )}
      </div>
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
      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full glass rounded-2xl px-4 h-12 text-sm outline-none focus:border-foreground/25"
      />
    </label>
  );
}
