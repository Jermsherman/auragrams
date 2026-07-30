import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BAND_DRIVE,
  BAND_LABELS,
  BAND_ORDER,
  type BandKey,
  type BandsConfig,
} from "@/lib/auraBands";

type Props = {
  /** When provided, each row shows whether the band is on for this Aura. */
  bands?: BandsConfig | null;
  hasVocals?: boolean;
  defaultOpen?: boolean;
  className?: string;
  title?: string;
};

/** Shared explainer: what audio actually drives each band on the orb. */
export function BandDriveInfo({
  bands,
  hasVocals = true,
  defaultOpen = false,
  className,
  title = "How your song drives the orb",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const stateFor = (key: BandKey): string | null => {
    if (!bands) return null;
    if (key === "vocal" && !hasVocals) return "Off — instrumental";
    return bands[key].enabled ? "On" : "Off";
  };

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-background/30 p-4", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="block text-[11px] text-muted-foreground">
            Four bands, four different parts of the mix
          </span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className="mt-3 space-y-2">
          {BAND_ORDER.map((key) => {
            const d = BAND_DRIVE[key];
            const state = stateFor(key);
            const off = state !== null && state !== "On";
            return (
              <li
                key={key}
                className={cn(
                  "rounded-xl border border-border/50 bg-background/40 p-3",
                  off && "opacity-60",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{BAND_LABELS[key]}</span>
                  {state && (
                    <span className="ml-auto rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {state}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] text-foreground/80">
                    {d.source}
                  </span>
                  <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {d.range}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{d.behaviour}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default BandDriveInfo;
