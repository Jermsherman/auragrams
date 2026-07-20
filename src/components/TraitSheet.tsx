import { useState } from "react";
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
export function TraitSheet({ traits }: { traits: AuraTraits }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section
      aria-label="Aura Traits"
      className="mt-10 w-full max-w-md mx-auto animate-fade-up"
    >
      <div
        className="rounded-2xl glass-strong p-5 sm:p-6 relative overflow-hidden text-left"
        style={{
          boxShadow: `inset 0 0 40px -20px ${traits.tierColor}55, 0 0 40px -20px ${traits.tierColor}33`,
          borderColor: `${traits.tierColor}55`,
        }}
      >
        {/* Tier ribbon */}
        <div className="flex items-center justify-between gap-3">
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
            {traits.serial}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Signature
          </div>
          <div className="mt-1 font-display text-xl text-aura-gradient">
            {traits.signature}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {traits.traits.map((t) => {
            const isRare = t.rarity >= 0.55;
            const open = expanded === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setExpanded(open ? null : t.id)}
                className="text-left rounded-xl glass px-3 py-2.5 hover:bg-foreground/10 transition-colors"
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

        <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70 text-center">
          Traits are derived from your track. One song, one sheet — forever.
        </p>
      </div>
    </section>
  );
}
