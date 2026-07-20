// Screenshot-optimized Aura card. Rendered at a fixed reference size so
// html-to-image exports at platform-native resolution. Pure presentation
// from already-loaded state — no data fetching.

import { forwardRef } from "react";
import { Aurascope } from "./Aurascope";
import mark from "@/assets/auragram-mark.png";
import type { AuraPalette, PaletteKey } from "@/lib/aura";
import { PALETTES } from "@/lib/aura";
import type { AuraInsight } from "@/lib/auraInsight";

export type ShareVariant = "story" | "square";

type Props = {
  variant: ShareVariant;
  auraName: string;
  trackTitle: string;
  artist: string;
  palette: PaletteKey;
  colors?: AuraPalette;
  traits: string[]; // 3 short labels
  story?: string | null;
  insight?: AuraInsight | null;
  shareUrl?: string | null;
};

function trimStory(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : t;
}

export const AuraShareCard = forwardRef<HTMLDivElement, Props>(function AuraShareCard(
  { variant, auraName, trackTitle, artist, palette, colors, traits, story, shareUrl },
  ref,
) {
  const p = PALETTES[palette];
  const c0 = colors?.[0] ?? p.stops[0];
  const c1 = colors?.[1] ?? p.stops[1];
  const c2 = colors?.[2] ?? p.stops[2];

  const isStory = variant === "story";
  // Reference pixel dimensions — captured 1:1 by html-to-image.
  const W = isStory ? 1080 : 1080;
  const H = isStory ? 1920 : 1080;

  const bg = `radial-gradient(ellipse 90% 55% at 50% 8%, ${c0}, transparent 60%), radial-gradient(ellipse 90% 55% at 50% 95%, ${c2}, transparent 60%), linear-gradient(180deg, oklch(0.09 0.03 290), oklch(0.06 0.02 285))`;

  const storyText = story ? trimStory(story, isStory ? 220 : 160) : null;
  const takeTraits = traits.filter(Boolean).slice(0, 3);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden text-foreground"
      style={{
        width: `${W}px`,
        height: `${H}px`,
        background: bg,
        fontFamily:
          "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Soft grain / gloss */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, oklch(1 0 0 / 0.35), transparent 60%)",
        }}
      />

      {/* Top: brand */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center gap-3"
        style={{ top: isStory ? 72 : 56 }}
      >
        <img
          src={mark}
          alt=""
          crossOrigin="anonymous"
          style={{ height: isStory ? 44 : 36, width: isStory ? 44 : 36, objectFit: "contain" }}
        />
        <span
          className="uppercase text-foreground/85"
          style={{
            letterSpacing: "0.42em",
            fontSize: isStory ? 22 : 18,
            fontWeight: 600,
          }}
        >
          Auragram
        </span>
      </div>

      {/* Orb */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: isStory ? 200 : 150,
          width: isStory ? 640 : 460,
          height: isStory ? 640 : 460,
        }}
      >
        <Aurascope
          aura={{ palette, colors, auraName, artistName: artist }}
          size="large"
          mode="minimal"
          showLabel={false}
          className="w-full h-full"
        />
      </div>

      {/* Bottom stack */}
      <div
        className="absolute inset-x-0 flex flex-col items-center text-center px-16"
        style={{ bottom: isStory ? 110 : 80 }}
      >
        {/* Eyebrow */}
        <div
          className="uppercase text-foreground/70"
          style={{
            letterSpacing: "0.42em",
            fontSize: isStory ? 20 : 16,
            marginBottom: 20,
          }}
        >
          Aura Uncovered
        </div>

        {/* Aura Name — HERO */}
        <div
          className="text-aura-gradient"
          style={{
            fontFamily:
              "'Syne', 'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: isStory ? 116 : 84,
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            maxWidth: isStory ? 940 : 900,
          }}
        >
          {auraName}
        </div>

        {/* Song subtitle */}
        <div
          className="text-foreground/90"
          style={{
            marginTop: isStory ? 22 : 16,
            fontSize: isStory ? 30 : 24,
            fontWeight: 500,
            maxWidth: isStory ? 900 : 860,
          }}
        >
          <span>{trackTitle}</span>
          <span className="text-foreground/50" style={{ margin: "0 14px" }}>
            ·
          </span>
          <span className="text-foreground/70">{artist}</span>
        </div>

        {/* Traits row */}
        {takeTraits.length > 0 && (
          <div
            className="flex items-center justify-center flex-wrap"
            style={{ marginTop: isStory ? 34 : 24, gap: isStory ? 14 : 10 }}
          >
            {takeTraits.map((t) => (
              <span
                key={t}
                className="text-foreground/95"
                style={{
                  borderRadius: 999,
                  border: "1px solid oklch(1 0 0 / 0.28)",
                  background: "oklch(1 0 0 / 0.06)",
                  padding: isStory ? "14px 26px" : "10px 20px",
                  fontSize: isStory ? 22 : 18,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  backdropFilter: "blur(6px)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Story pull quote */}
        {storyText && (
          <div
            className="text-foreground/85 italic"
            style={{
              marginTop: isStory ? 40 : 26,
              fontSize: isStory ? 30 : 24,
              lineHeight: 1.45,
              fontFamily:
                "'Syne', 'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
              maxWidth: isStory ? 900 : 820,
            }}
          >
            &ldquo;{storyText}&rdquo;
          </div>
        )}

        {/* Footer */}
        <div
          className="text-foreground/60 uppercase"
          style={{
            marginTop: isStory ? 46 : 30,
            fontSize: isStory ? 20 : 16,
            letterSpacing: "0.34em",
            fontWeight: 500,
          }}
        >
          {shareUrl ? shareUrl.replace(/^https?:\/\//, "") : "auragram · discover your song's aura"}
        </div>
      </div>

      {/* Corner accent */}
      <div
        aria-hidden
        className="absolute rounded-full opacity-60 blur-3xl pointer-events-none"
        style={{
          width: isStory ? 520 : 400,
          height: isStory ? 520 : 400,
          background: c1,
          top: -100,
          right: -140,
        }}
      />
      <div
        aria-hidden
        className="absolute rounded-full opacity-50 blur-3xl pointer-events-none"
        style={{
          width: isStory ? 460 : 360,
          height: isStory ? 460 : 360,
          background: c2,
          bottom: -140,
          left: -120,
        }}
      />
    </div>
  );
});
