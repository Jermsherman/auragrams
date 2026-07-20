// Static "How your Aura was made" mapping. Non-AI, deterministic, honest.
// Sits under the Trait Sheet to close the trust gap between measured audio
// features and the AI-written story.

import { useState } from "react";
import { ChevronDown, ScanLine } from "lucide-react";

const ROWS: Array<{ label: string; from: string }> = [
  { label: "Hue", from: "Palette family from spectral centroid + dominant chroma" },
  { label: "Cadence", from: "Motion archetype from BPM + energy variance" },
  { label: "Grain", from: "Texture from high-frequency roll-off" },
  { label: "Charge", from: "RMS energy within the track" },
  { label: "Weight", from: "Onset density (how packed the spectrum is)" },
  { label: "Pulse", from: "Detected BPM (raw)" },
  { label: "Root", from: "Key + mode from chroma detection" },
  { label: "Story", from: "AI interpretation of the measurements above" },
];

export function TraitProvenance({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-2xl glass px-4 py-3 hover:bg-foreground/5 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          <ScanLine className="h-3.5 w-3.5" />
          How your Aura was made
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-2 rounded-2xl glass-strong p-4 sm:p-5">
          <ul className="space-y-2">
            {ROWS.map((r) => (
              <li
                key={r.label}
                className="grid grid-cols-[80px_1fr] gap-3 text-[12px] leading-snug"
              >
                <span className="text-[10px] uppercase tracking-[0.24em] text-foreground/90 pt-0.5">
                  {r.label}
                </span>
                <span className="text-muted-foreground">
                  <span className="opacity-60">←</span> {r.from}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground/80 border-t border-border/40 pt-3">
            Measurements come from your audio. The story is written from those
            measurements. Same song, same Aura, forever — no rerolls, no packs,
            no paid rarity.
          </p>
        </div>
      )}
    </div>
  );
}
