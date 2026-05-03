import type { StreamingLinks } from "@/lib/tracks";

const META: Record<keyof StreamingLinks, { label: string; color: string }> = {
  spotify: { label: "Spotify", color: "oklch(0.78 0.18 145)" },
  apple: { label: "Apple Music", color: "oklch(0.78 0.18 0)" },
  soundcloud: { label: "SoundCloud", color: "oklch(0.78 0.18 50)" },
};

export function StreamingChips({ links }: { links?: StreamingLinks }) {
  if (!links) return null;
  const entries = (Object.keys(META) as Array<keyof StreamingLinks>)
    .map((k) => [k, links[k]] as const)
    .filter(([, v]) => !!v);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {entries.map(([k, url]) => (
        <a
          key={k}
          href={url!}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full glass px-4 h-9 text-xs hover:bg-foreground/10 transition-colors"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: META[k].color, boxShadow: `0 0 8px ${META[k].color}` }}
          />
          {META[k].label}
        </a>
      ))}
    </div>
  );
}
