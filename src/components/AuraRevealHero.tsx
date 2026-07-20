// Cinematic hero for the Aura reveal moment. Renders the Aura Name as the
// primary focus, above the orb. Pure presentation — no data fetching.

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { AuraPalette } from "@/lib/aura";
import type { AuraInsight } from "@/lib/auraInsight";

type Props = {
  auraName: string;
  trackTitle: string;
  artist: string;
  colors?: AuraPalette;
  insight?: AuraInsight | null;
  reveal?: boolean;
};

// Pull the first sentence out of the story, capped for one-line-ish display.
function firstSentence(s: string): string {
  const m = s.match(/^[^.!?]+[.!?]/);
  const out = (m ? m[0] : s).trim();
  return out.length > 180 ? out.slice(0, 179).replace(/\s+\S*$/, "") + "…" : out;
}

export function AuraRevealHero({
  auraName,
  trackTitle,
  artist,
  colors,
  insight,
  reveal = false,
}: Props) {
  // Stage: 0=idle, 1=eyebrow, 2=name, 3=subtitle, 4=pullquote
  const [stage, setStage] = useState<number>(reveal ? 0 : 99);

  useEffect(() => {
    if (!reveal) return;
    const t: number[] = [];
    t.push(window.setTimeout(() => setStage(1), 60));
    t.push(window.setTimeout(() => setStage(2), 260));
    t.push(window.setTimeout(() => setStage(3), 900));
    t.push(window.setTimeout(() => setStage(4), 1400));
    return () => t.forEach(clearTimeout);
  }, [reveal]);

  // Backdrop from palette (falls back to design tokens).
  const c1 = colors?.[0] ?? "oklch(0.7 0.2 310)";
  const c2 = colors?.[2] ?? colors?.[1] ?? "oklch(0.5 0.2 260)";
  const backdrop = `radial-gradient(ellipse 60% 40% at 50% 20%, ${c1} 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, ${c2} 0%, transparent 60%)`;

  const chars = auraName.split("");
  const pull = insight?.story ? firstSentence(insight.story) : null;

  return (
    <div className="relative w-full max-w-2xl mx-auto text-center">
      {/* Cinematic backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -top-16 -bottom-8 opacity-70 blur-2xl"
        style={{ background: backdrop }}
      />

      <div className="relative">
        {/* Eyebrow */}
        <div
          className={`inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.32em] text-foreground/80 transition-all duration-500 ${
            stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          Aura Uncovered
        </div>

        {/* Aura Name — HERO */}
        <h1
          aria-label={auraName}
          className="mt-4 font-display tracking-tight text-aura-gradient leading-[1.05] text-[clamp(2.25rem,7vw,4.25rem)]"
        >
          {chars.map((ch, i) => (
            <span
              key={i}
              className={`inline-block transition-all duration-500 ${
                stage >= 2 ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-3 blur-[6px]"
              }`}
              style={{ transitionDelay: `${stage >= 2 ? i * 35 : 0}ms` }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </h1>

        {/* Song subtitle */}
        <p
          className={`mt-3 text-sm sm:text-base text-foreground/80 tracking-wide transition-all duration-500 ${
            stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          <span className="font-medium text-foreground/95">{trackTitle}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="text-muted-foreground">{artist}</span>
        </p>

        {/* Story pull-quote */}
        {pull && (
          <p
            className={`mt-6 max-w-xl mx-auto font-display italic text-base sm:text-lg leading-relaxed text-foreground/85 transition-all duration-700 ${
              stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            &ldquo;{pull}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
