import { ExternalLink, Music2 } from "lucide-react";
import type { Provider } from "@/lib/tracks";

const ACCENTS: Partial<Record<Provider, string>> = {
  spotify: "oklch(0.78 0.18 145)",
  apple: "oklch(0.78 0.18 0)",
  soundcloud: "oklch(0.78 0.18 50)",
  youtube: "oklch(0.7 0.22 25)",
  "youtube-music": "oklch(0.7 0.22 25)",
  audiomack: "oklch(0.78 0.18 30)",
  bandcamp: "oklch(0.7 0.16 200)",
  tidal: "oklch(0.78 0.04 250)",
  deezer: "oklch(0.78 0.18 320)",
  amazon: "oklch(0.78 0.18 200)",
  pandora: "oklch(0.7 0.16 250)",
  boomplay: "oklch(0.78 0.18 30)",
  audius: "oklch(0.7 0.18 290)",
  smartlink: "oklch(0.7 0.16 290)",
  external: "oklch(0.7 0.04 290)",
};

export function PlatformCard({
  platformName,
  url,
  provider,
}: {
  platformName: string;
  url: string;
  provider?: Provider;
}) {
  const accent = (provider && ACCENTS[provider]) || "oklch(0.7 0.18 290)";
  return (
    <div className="mx-auto w-full max-w-md">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group glass-strong rounded-2xl px-5 py-5 flex items-center gap-4 hover:bg-foreground/[0.06] transition-colors"
      >
        <div
          className="grid place-items-center h-12 w-12 rounded-2xl shrink-0"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${accent}, oklch(0.18 0.04 290))`,
            boxShadow: `0 0 24px -6px ${accent}`,
          }}
        >
          <Music2 className="h-5 w-5 text-foreground/95" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Listen on
          </div>
          <div className="font-display text-base sm:text-lg truncate">{platformName}</div>
          <div className="text-[11px] text-muted-foreground truncate">{url}</div>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </a>
    </div>
  );
}
