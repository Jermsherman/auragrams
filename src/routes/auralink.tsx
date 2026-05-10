// AuraLink library — lists every AuraLink the user has built.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ExternalLink, Copy, Trash2, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Nav } from "@/components/Nav";
import { Logo } from "@/components/Logo";
import { Aurascope } from "@/components/Aurascope";
import {
  getAuraLinks,
  deleteAuraLink,
  resolveTheme,
  type AuraLinkPage,
} from "@/lib/auralink";
import { getSavedAuras, type SavedAura } from "@/lib/farm";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auralink")({
  head: () => ({
    meta: [
      { title: "Your AuraLinks — Auragram" },
      {
        name: "description",
        content: "Every AuraLink you've created — playable, shareable, all in one place.",
      },
    ],
  }),
  component: AuraLinkLibraryPage,
});

function AuraLinkLibraryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState<AuraLinkPage[]>([]);
  const [auras, setAuras] = useState<SavedAura[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  const refresh = () => {
    setPages(getAuraLinks());
    setAuras(getSavedAuras());
  };

  useEffect(() => {
    refresh();
  }, []);

  const aurasById = new Map(auras.map((a) => [a.id, a]));

  const onDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title || "Untitled AuraLink"}"? This cannot be undone.`)) return;
    deleteAuraLink(id);
    refresh();
    toast.success("AuraLink deleted");
  };

  const onCopy = async (slug: string) => {
    const url = `${window.location.origin}/l/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-4xl px-5 sm:px-8 py-10">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Your Library
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl tracking-tight">
              AuraLinks
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Living link pages with playable Auras, streaming links, and your
              full vibe in one place.
            </p>
          </div>
          <Link
            to="/auralink/create"
            className="inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground h-11 px-5 text-sm font-medium shadow-[0_0_30px_-8px_oklch(0.7_0.2_310/0.7)] hover:shadow-[0_0_50px_-6px_oklch(0.7_0.2_310/0.9)] transition-shadow whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> New AuraLink
          </Link>
        </div>

        {pages.length === 0 ? (
          <div className="rounded-3xl glass-strong border border-border/60 p-10 text-center">
            <Logo />
            <h2 className="mt-5 font-display text-2xl">Build your first AuraLink</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Combine your music, socials, and Auras into one shareable, playable
              page that lives outside any platform.
            </p>
            <Link
              to="/auralink/create"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground h-11 px-5 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" /> Create AuraLink
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((p) => {
              const theme = resolveTheme(p.theme);
              const featured =
                aurasById.get(p.featuredAuraId ?? p.selectedAuraIds[0] ?? "");
              const linkCount =
                (p.streamingLinks?.length ?? 0) +
                (p.customLinks?.length ?? 0) +
                (p.socialLinks?.length ?? 0);
              const auraCount = p.selectedAuraIds.length;
              return (
                <div
                  key={p.id}
                  className="group rounded-3xl glass-strong border border-border/60 hover:border-border transition-colors p-4 sm:p-5 flex items-center gap-4"
                >
                  <div
                    className="shrink-0 h-16 w-16 rounded-2xl overflow-hidden grid place-items-center"
                    style={{ background: theme.bg, boxShadow: theme.glow }}
                  >
                    {p.profileImageUrl ? (
                      <img
                        src={p.profileImageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    ) : featured ? (
                      <Aurascope
                        aura={{
                          id: featured.id,
                          palette: featured.palette,
                          seed: featured.seed,
                          auraName: featured.auraName,
                          colors: featured.colors,
                        }}
                        size="mini"
                        mode="minimal"
                        showLabel={false}
                      />
                    ) : (
                      <Link2 className="h-5 w-5" style={{ color: theme.accent }} />
                    )}
                  </div>

                  <Link
                    to="/l/$slug"
                    params={{ slug: p.handleSlug }}
                    className="flex-1 min-w-0"
                  >
                    <div className="font-medium truncate">
                      {p.title || "Untitled AuraLink"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      /l/{p.handleSlug}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <span>{auraCount} Aura{auraCount === 1 ? "" : "s"}</span>
                      <span aria-hidden>·</span>
                      <span>{linkCount} Link{linkCount === 1 ? "" : "s"}</span>
                      <span aria-hidden>·</span>
                      <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onCopy(p.handleSlug)}
                      aria-label="Copy link"
                      className="grid place-items-center h-9 w-9 rounded-full hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`/l/${p.handleSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open AuraLink"
                      className="grid place-items-center h-9 w-9 rounded-full hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => onDelete(p.id, p.title)}
                      aria-label="Delete AuraLink"
                      className="grid place-items-center h-9 w-9 rounded-full hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
