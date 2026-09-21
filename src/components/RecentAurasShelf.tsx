import { Link, useHydrated } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyAuras } from "@/hooks/useMyAuras";
import { Aurascope } from "./Aurascope";
import { AuraStatusBadge } from "./AuraStatusControl";

export function RecentAurasShelf() {
  const { user, profile } = useAuth();
  const hydrated = useHydrated();
  const { auras } = useMyAuras(profile?.id);
  if (!hydrated || !user || !auras?.length) return null;

  return (
    <section aria-labelledby="recent-auras-title" className="mx-auto max-w-6xl overflow-hidden px-5 sm:px-8 pb-14 sm:pb-18">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Back in your collection</p>
          <h2 id="recent-auras-title" className="mt-1 font-display text-2xl sm:text-3xl">Recent Auras</h2>
        </div>
        <Link to="/farm" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-5 flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {auras.slice(0, 8).map((aura) => (
          <Link
            key={aura.id}
            to="/aura/$id"
            params={{ id: aura.id }}
            className="glass-card press-depth w-[68vw] max-w-[250px] shrink-0 snap-start rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <Aurascope
                aura={{ id: aura.id, palette: aura.palette, colors: aura.colors, seed: aura.seed, auraName: aura.auraName, hasVocals: aura.hasVocals, bands: aura.bands }}
                size="mini"
                mode="minimal"
                animate={false}
              />
              {aura.status && <AuraStatusBadge status={aura.status} className="px-2 text-[9px]" />}
            </div>
            <h3 className="mt-4 truncate font-display text-base">{aura.auraName}</h3>
            <p className="mt-0.5 truncate text-sm text-foreground/85">{aura.trackTitle}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{aura.artistName || "Anonymous artist"}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}