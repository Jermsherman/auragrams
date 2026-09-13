// Compact social card used in Discover and on public profiles.

import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Aurascope } from "./Aurascope";
import { profileLabel, type FeedAura } from "@/lib/social";
import type { AuraPalette } from "@/lib/aura";

export function FeedAuraCard({ aura }: { aura: FeedAura }) {
  const anon = aura.visibility_mode === "anonymous";
  const byline = anon
    ? "Anonymous Artist"
    : aura.public_artist_name || profileLabel(aura.owner);

  return (
    <article className="group glass-card rounded-2xl p-4 flex gap-4 items-center transition-transform hover:-translate-y-0.5">
      <Link
        to="/aura/$id"
        params={{ id: aura.id }}
        className="shrink-0"
        aria-label={`Open ${aura.aura_name || aura.track_title}`}
      >
        <Aurascope
          aura={{
            id: aura.id,
            palette: aura.palette_name || "euphoric",
            auraName: aura.aura_name ?? undefined,
            colors: (aura.color_palette as AuraPalette) ?? undefined,
            moods: aura.mood_tags ?? [],
            energy: aura.energy_level ?? undefined,
          }}
          size="mini"
          mode="minimal"
          showLabel={false}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to="/aura/$id"
          params={{ id: aura.id }}
          className="block truncate text-sm font-medium hover:text-primary transition-colors"
        >
          {aura.aura_name || aura.track_title}
        </Link>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {aura.track_title}
          {" · "}
          {!anon && aura.owner?.username ? (
            <Link
              to="/u/$username"
              params={{ username: aura.owner.username }}
              className="hover:text-foreground transition-colors"
            >
              {byline}
            </Link>
          ) : (
            byline
          )}
        </div>
        {aura.vibe_description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground/80 italic">
            “{aura.vibe_description}”
          </p>
        )}
      </div>

      <div className="shrink-0 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Heart className="h-3.5 w-3.5" />
        <span className="tabular-nums">{aura.reactions ?? 0}</span>
      </div>
    </article>
  );
}
