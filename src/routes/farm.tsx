import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Plus, Link2, Search } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AuraFarmCard } from "@/components/AuraFarmCard";
import { getSavedAuras, type SavedAura } from "@/lib/farm";
import { HelpLink } from "@/components/HelpLink";
import { useAuth } from "@/hooks/useAuth";
import { listMyAuras, mapAuraRowToSaved } from "@/lib/cloudAura";


export const Route = createFileRoute("/farm")({
  head: () => ({
    meta: [
      { title: "My Auras — Auragram" },
      {
        name: "description",
        content: "Your growing collection of sonic identities.",
      },
      { property: "og:title", content: "My Auras — Auragram" },
      {
        property: "og:description",
        content: "Your growing collection of sonic identities.",
      },
    ],
  }),
  component: () => (<RequireAuth><FarmPage /></RequireAuth>),
});

type Filter = "all" | "upload" | "raw_recording";
type SortKey = "newest" | "oldest" | "title" | "artist";

function FarmPage() {
  const { profile } = useAuth();
  const [auras, setAuras] = useState<SavedAura[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    setAuras(getSavedAuras());

    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listMyAuras(profile.id);
        if (cancelled) return;
        const merged = new Map<string, SavedAura>();
        for (const a of getSavedAuras()) merged.set(a.id, a);
        for (const r of rows) merged.set(r.id, mapAuraRowToSaved(r));
        setAuras(
          Array.from(merged.values()).sort((a, b) => b.createdAt - a.createdAt),
        );
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const removedAura = (id: string) =>
    setAuras((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));

  const filteredAuras = useMemo(() => {
    const base = (auras ?? []).filter((a) => {
      if (filter === "all") return true;
      return a.sourceType === filter;
    });
    const q = query.trim().toLowerCase();
    const searched = q
      ? base.filter((a) =>
          [a.auraName, a.trackTitle, a.artistName, ...(a.moodTags ?? [])]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(q)),
        )
      : base;
    const sorted = [...searched];
    sorted.sort((a, b) => {
      if (sort === "newest") return b.createdAt - a.createdAt;
      if (sort === "oldest") return a.createdAt - b.createdAt;
      if (sort === "title") return a.trackTitle.localeCompare(b.trackTitle);
      return a.artistName.localeCompare(b.artistName);
    });
    return sorted;
  }, [auras, filter, query, sort]);


  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-5 sm:px-8 py-12 sm:py-16">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> My Auras
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl tracking-tight">
            Your <span className="text-aura-gradient">Auras.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your growing collection of sonic identities.
          </p>
          <div className="mt-4 flex justify-center">
            <HelpLink hash="farm" label="What is My Auras?" />
          </div>
        </div>

        <div className="mt-10 sm:mt-12 animate-fade-up">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-full glass px-4 h-10 text-xs sm:text-sm hover:bg-foreground/10 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Aura
            </Link>
            <Link
              to="/auralink/create"
              className="inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground px-4 h-10 text-xs sm:text-sm shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.9)]"
            >
              <Link2 className="h-4 w-4" /> Build AuraLink
            </Link>
          </div>

          <div className="mt-8">
            {auras === null ? null : auras.length === 0 ? (
              <EmptyAuras />
            ) : (
              <>
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name, track, artist, mood…"
                      className="w-full rounded-full bg-background/40 border border-border/60 pl-9 pr-4 h-9 text-sm outline-none focus:border-foreground/25"
                    />
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="rounded-full bg-background/40 border border-border/60 px-3 h-9 text-xs outline-none focus:border-foreground/25"
                    aria-label="Sort"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="title">Track A–Z</option>
                    <option value="artist">Artist A–Z</option>
                  </select>
                </div>
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {([
                    ["all", "All"],
                    ["upload", "Uploaded Audio"],
                    ["raw_recording", "Raw Aura"],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={
                        filter === key
                          ? "rounded-full px-3 h-7 text-[11px] uppercase tracking-[0.2em] bg-foreground/10 text-foreground"
                          : "rounded-full px-3 h-7 text-[11px] uppercase tracking-[0.2em] border border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {filteredAuras.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No Auras match this filter yet.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAuras.map((a) => (
                      <AuraFarmCard key={a.id} aura={a} onDeleted={removedAura} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EmptyAuras() {
  return (
    <div className="mx-auto max-w-md text-center glass-strong rounded-3xl p-10">
      <h2 className="font-display text-2xl">No Auras yet.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your first Aura and start growing your collection.
      </p>
      <Link
        to="/create"
        className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-medium text-primary-foreground bg-aura-gradient"
      >
        Create Aura
      </Link>
    </div>
  );
}
