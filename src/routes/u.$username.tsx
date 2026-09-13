import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FeedAuraCard } from "@/components/FeedAuraCard";
import { useAuth } from "@/hooks/useAuth";
import {
  getFollowState,
  getPublicProfileByUsername,
  listFeedAuras,
  profileLabel,
  toggleFollow,
  type FeedAura,
  type PublicProfile,
} from "@/lib/social";

export const Route = createFileRoute("/u/$username")({
  loader: async ({ params }) => {
    const profile = await getPublicProfileByUsername(params.username).catch(() => null);
    if (!profile) throw notFound();
    return { profile };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.profile
      ? profileLabel(loaderData.profile)
      : `@${params.username}`;
    const title = `${name} — Auras & Music | Auragram`;
    const description = `Listen to ${name}'s Auras — living visual identities built from their songs on Auragram.`;
    const url = `https://auragrams.lovable.app/u/${params.username}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: () => (
    <div className="min-h-dvh grid place-items-center text-sm text-muted-foreground">
      We couldn't load this profile.
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center text-sm text-muted-foreground">
      No artist with that username.
    </div>
  ),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile } = Route.useLoaderData() as { profile: PublicProfile };
  const { profile: viewer } = useAuth();
  const [auras, setAuras] = useState<FeedAura[]>([]);
  const [state, setState] = useState({ followers: 0, following: 0, isFollowing: false });
  const [busy, setBusy] = useState(false);

  const isSelf = viewer?.id === profile.id;

  useEffect(() => {
    let cancelled = false;
    listFeedAuras({ ownerIds: [profile.id], limit: 50 })
      .then((rows) => !cancelled && setAuras(rows))
      .catch(() => {});
    getFollowState(profile.id, viewer?.id)
      .then((s) => !cancelled && setState(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile.id, viewer?.id]);

  const onFollow = async () => {
    if (!viewer?.id) {
      toast("Sign in to follow artists.");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !state.isFollowing;
    setState((s) => ({
      ...s,
      isFollowing: next,
      followers: Math.max(0, s.followers + (next ? 1 : -1)),
    }));
    try {
      await toggleFollow(viewer.id, profile.id, !next);
    } catch {
      setState((s) => ({
        ...s,
        isFollowing: !next,
        followers: Math.max(0, s.followers + (next ? -1 : 1)),
      }));
      toast.error("Couldn't update follow — try again.");
    } finally {
      setBusy(false);
    }
  };

  const initial = (profile.display_name || profile.username || "A").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 sm:px-8 py-10">
        <header className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${profileLabel(profile)} profile picture`}
              className="h-20 w-20 rounded-full object-cover ring-1 ring-foreground/10"
            />
          ) : (
            <div className="h-20 w-20 rounded-full grid place-items-center bg-aura-gradient text-primary-foreground text-xl">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl tracking-tight truncate">{profileLabel(profile)}</h1>
            {profile.username && (
              <div className="text-xs text-muted-foreground">@{profile.username}</div>
            )}
            <div className="mt-1.5 flex gap-4 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground tabular-nums">{state.followers}</strong> followers
              </span>
              <span>
                <strong className="text-foreground tabular-nums">{state.following}</strong> following
              </span>
              <span>
                <strong className="text-foreground tabular-nums">{auras.length}</strong> Auras
              </span>
            </div>
          </div>
          {!isSelf && (
            <button
              type="button"
              onClick={onFollow}
              disabled={busy}
              className={`h-10 px-5 rounded-full text-xs font-medium transition-transform hover:-translate-y-0.5 ${
                state.isFollowing
                  ? "border border-border/70 text-muted-foreground"
                  : "bg-aura-gradient text-primary-foreground"
              }`}
            >
              {state.isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </header>

        <div className="mt-8 space-y-3">
          {auras.map((a) => (
            <FeedAuraCard key={a.id} aura={a} />
          ))}
          {!auras.length && (
            <p className="text-sm text-muted-foreground">No public Auras yet.</p>
          )}
        </div>

        <div className="mt-10">
          <Link
            to="/discover"
            className="text-xs uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Discover more artists →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
