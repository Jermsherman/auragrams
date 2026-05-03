import { forwardRef } from "react";
import { OrbVisual } from "./OrbVisual";
import mark from "@/assets/auragram-mark.png";
import { PALETTES, type PaletteKey } from "@/lib/aura";

type Props = {
  title: string;
  artist: string;
  mood?: string;
  palette: PaletteKey;
};

/** Vertical 9:16 story canvas. Forwarded ref is the node we rasterize. */
export const StoryCanvas = forwardRef<HTMLDivElement, Props>(function StoryCanvas(
  { title, artist, mood, palette },
  ref,
) {
  const p = PALETTES[palette];
  return (
    <div
      ref={ref}
      className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl"
      style={{
        background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${p.stops[0]}, transparent 60%), radial-gradient(ellipse 80% 60% at 50% 110%, ${p.stops[2]}, transparent 60%), oklch(0.09 0.02 290)`,
      }}
    >
      {/* faint grain via gradient overlay */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, oklch(1 0 0 / 0.25), transparent 60%)",
        }}
      />

      {/* top brand */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-90">
        <img src={mark} alt="" className="h-5 w-5 object-contain" crossOrigin="anonymous" />
        <span className="wordmark text-[10px] text-foreground/85">Auragram</span>
      </div>

      {/* orb */}
      <div className="absolute inset-0 grid place-items-center">
        <OrbVisual size="78%" palette={palette} particles={false} />
      </div>

      {/* bottom block */}
      <div className="absolute inset-x-0 bottom-0 p-6 pb-9 flex flex-col items-center text-center">
        {mood && (
          <span className="rounded-full border border-foreground/15 bg-background/30 backdrop-blur px-3 h-6 inline-flex items-center text-[10px] uppercase tracking-[0.24em] text-foreground/85">
            {mood}
          </span>
        )}
        <h2 className="mt-3 font-display text-2xl sm:text-3xl tracking-tight max-w-[85%] line-clamp-2">
          {title}
        </h2>
        <p className="mt-1 text-sm text-foreground/75">{artist}</p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground px-5 h-9 text-[11px] font-medium uppercase tracking-[0.24em]">
          Listen now
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.32em] text-foreground/60">
          Open Auragram
        </div>
      </div>
    </div>
  );
});
