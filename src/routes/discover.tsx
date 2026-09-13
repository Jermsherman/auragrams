import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FeedAuraCard } from "@/components/FeedAuraCard";
import { useAuth } from "@/hooks/useAuth";
import { listFeedAuras, listFollowingIds, type FeedAura } from "@/lib/social";

type Tab = "trending" | "recent" | "following";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Auras — Artists & Music | Auragram" },
      {
        name: "description",
        content:
          "Browse trending and brand-new Auras — living visual identities built from real songs by artists on Auragram.",
      },
      { property: "og:title", content: "Discover Auras — Artists & Music | Auragram" },
      {
        property: "og:description",
        content: "Trending and new Auras from artists building their sound on Auragram.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://auragrams.lovable.app/discover" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://auragrams.lovable.app/discover" }],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("trending");
  const [auras, setAuras] = useState<FeedAura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let ownerIds: string[] | undefined;
      if (tab === "following") {
        ownerIds = profile?.id ? await listFollowingIds(profile.id) : [];
      }
      const rows = await listFeedAuras({
        sort: tab === "trending" ? "trending" : "recent",
        ownerIds,
      }).catch(() => [] as FeedAura[]);
      if (cancelled) return;
      setAuras(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, profile?.id]);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "trending", label: "Trending" },
    { key: "recent", label: "New" },
    { key: "following", label: "Following" },
  ];

  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-8 py-10">
        <h1 className="text-3xl sm:text-4xl tracking-tight">Discover</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Living Auras from artists across Auragram. React, comment, follow.
        </p>

        <div className="mt-6 inline-flex rounded-full border border-border/60 p-1 bg-card/40">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`h-8 px-4 rounded-full text-xs tracking-wide transition-colors ${
                tab === t.key ? "bg-aura-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {loading && (
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Loading…</p>
          )}
          {!loading && !auras.length && (
            <div className="glass-card rounded-2xl p-6 text-sm text-muted-foreground">
              {tab !== "following"
                ? "Nothing here yet — be the first to share an Aura."
                : profile?.id
                  ? "You're not following anyone yet. Find artists in Trending and follow them."
                  : "Sign in to follow artists and build your own feed."}
            </div>
          )}
          {auras.map((a) => (
            <FeedAuraCard key={a.id} aura={a} />
          ))}
        </div>

        <div className="mt-10">
          <Link
            to="/create"
            className="inline-flex items-center h-11 px-6 rounded-full bg-aura-gradient text-primary-foreground text-sm font-medium"
          >
            Create your own Aura
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
