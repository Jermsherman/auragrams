import { useEffect, useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import type { AuraTraits } from "@/lib/auraTraits";

// Compact chip strip (used on Farm/AuraLink cards)
export function TraitChipStrip({
  traits,
  className = "",
}: {
  traits: AuraTraits;
  className?: string;
}) {
  const top = [...traits.traits].sort((a, b) => b.rarity - a.rarity).slice(0, 2);
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className="inline-flex items-center rounded-full px-2 h-6 text-[10px] uppercase tracking-[0.18em] font-medium"
        style={{
          background: `${traits.tierColor}22`,
          color: traits.tierColor,
          border: `1px solid ${traits.tierColor}55`,
        }}
      >
        {traits.tier}
      </span>
      {top.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center rounded-full glass px-2 h-6 text-[10px] uppercase tracking-[0.16em] text-foreground/80"
        >
          {t.value}
        </span>
      ))}
    </div>
  );
}

// Full trait card — reveal panel on aura.$id
export function TraitSheet({
  traits,
  reveal = false,
}: {
  traits: AuraTraits;
  /** When true, play the collectible reveal sequence (staggered tiles + serial count-up). */
  reveal?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Staged reveal: 0 = hidden, 1 = ribbon, 2 = signature, 3+ = tiles
  const [stage, setStage] = useState<number>(reveal ? 0 : 99);
  const [serialDisplay, setSerialDisplay] = useState<string>(
    reveal ? "#000000" : traits.serial,
  );

  useEffect(() => {
    if (!reveal) return;
    const timers: number[] = [];
    // ribbon
    timers.push(window.setTimeout(() => setStage(1), 100));
    // signature
    timers.push(window.setTimeout(() => setStage(2), 500));
    // tiles: 7 traits, ~150ms apart, starting at 900ms
    for (let i = 0; i < traits.traits.length; i++) {
      timers.push(window.setTimeout(() => setStage(3 + i), 900 + i * 150));
    }
    // serial count-up over ~600ms starting at 700ms
    const start = performance.now() + 700;
    let raf = 0;
    const target = traits.serial.replace(/[^0-9]/g, "");
    const targetNum = parseInt(target, 10) || 0;
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - start) / 600));
      const v = Math.floor(targetNum * (p * p * (3 - 2 * p))); // smoothstep
      setSerialDisplay(`#${String(v).padStart(6, "0")}`);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setSerialDisplay(traits.serial);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      timers.forEach((t) => clearTimeout(t));
      cancelAnimationFrame(raf);
    };
  }, [reveal, traits.serial, traits.traits.length]);

  const combinationCallout =
    traits.tier === "Radiant" || traits.tier === "Mythic";

  return (
    <section
      aria-label="Aura Traits"
      className="mt-10 w-full max-w-md mx-auto animate-fade-up"
    >
      <div
        className="rounded-2xl glass-strong p-5 sm:p-6 relative overflow-hidden text-left transition-shadow"
        style={{
          boxShadow: `inset 0 0 40px -20px ${traits.tierColor}55, 0 0 40px -20px ${traits.tierColor}33`,
          borderColor: `${traits.tierColor}55`,
        }}
      >
        {/* Tier ribbon */}
        <div
          className={`flex items-center justify-between gap-3 transition-opacity duration-500 ${stage >= 1 ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" style={{ color: traits.tierColor }} />
            <span
              className="text-[10px] uppercase tracking-[0.32em] font-medium"
              style={{ color: traits.tierColor }}
            >
              {traits.tier} Aura
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground tabular-nums">
            {serialDisplay}
          </span>
        </div>

        <div
          className={`mt-3 transition-all duration-500 ${stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
        >
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Signature
          </div>
          <div className="mt-1 font-display text-xl text-aura-gradient">
            {traits.signature}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {traits.traits.map((t, i) => {
            const isRare = t.rarity >= 0.55;
            const visible = stage >= 3 + i;
            const open = expanded === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setExpanded(open ? null : t.id)}
                className={`text-left rounded-xl glass px-3 py-2.5 hover:bg-foreground/10 transition-all duration-500 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                }`}
                style={
                  isRare && visible
                    ? {
                        boxShadow: `0 0 24px -8px ${traits.tierColor}88, inset 0 0 20px -12px ${traits.tierColor}66`,
                        borderColor: `${traits.tierColor}66`,
                      }
                    : undefined
                }
                aria-expanded={open}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                    {t.label}
                  </span>
                  {isRare && (
                    <span
                      className="text-[9px] uppercase tracking-[0.18em]"
                      style={{ color: traits.tierColor }}
                    >
                      Rare
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground/90 truncate">
                    {t.value}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </div>
                {open && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    {t.detail}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {combinationCallout && (
          <p
            className={`mt-4 text-center text-[10px] uppercase tracking-[0.32em] transition-opacity duration-700 ${stage >= 3 + traits.traits.length ? "opacity-100" : "opacity-0"}`}
            style={{ color: traits.tierColor }}
          >
            {traits.tier} combination
          </p>
        )}

        <div className="mt-4 space-y-1 text-center">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80">
            One song, one sheet — for anyone, forever.
          </p>
          <p className="text-[10px] tracking-[0.18em] text-muted-foreground/60">
            Deterministic. No rerolls. No packs. No paid rarity.
          </p>
        </div>
      </div>
    </section>
  );
}
