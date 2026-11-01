import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BAND_DRIVE,
  BAND_HINTS,
  BAND_LABELS,
  BAND_ORDER,
  DEFAULT_BANDS,
  type BandIntensity,
  type BandKey,
  type BandsConfig,
  type VocalShape,
} from "@/lib/auraBands";

const INTENSITIES: { value: BandIntensity; label: string }[] = [
  { value: "subtle", label: "Subtle" },
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
];

const VOCAL_SHAPES: { value: VocalShape; label: string; hint: string }[] = [
  { value: "core", label: "Core pulse", hint: "A circle in the middle of the orb" },
  { value: "equator", label: "Equator streak", hint: "A line across the sphere" },
];

type Props = {
  value: BandsConfig;
  onChange: (next: BandsConfig) => void;
  /** Palette swatches offered as per-band colors. */
  swatches?: string[];
  hasVocals?: boolean | null;
  onHasVocalsChange?: (value: boolean | null) => void;
};

export function BandCustomizer({
  value,
  onChange,
  swatches = [],
  hasVocals = null,
  onHasVocalsChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const setBand = (key: BandKey, patch: Partial<BandsConfig[BandKey]>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });

  return (
    <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="flex-1">
          <span className="block text-sm font-medium">Aura bands</span>
          <span className="block text-[11px] text-muted-foreground">
            Customize each reactive band, or match your palette
          </span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-border/50 bg-background/40 p-3">
            <div className="text-xs font-medium">Does this track have vocals?</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Auragram does not detect vocals. The default is Not sure. A Yes or No is saved as artist-reported.
            </p>
            {onHasVocalsChange && (
              <div className="mt-3 flex gap-2">
                {([
                  { label: "Not sure", value: null },
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ] as const).map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => onHasVocalsChange(option.value)}
                    aria-pressed={hasVocals === option.value}
                    className={cn(
                      "min-h-11 rounded-full px-5 text-xs font-medium transition-colors",
                      hasVocals === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {hasVocals == null ? "Not sure" : hasVocals ? "Yes · artist-reported" : "No · artist-reported"}
            </p>
          </div>

          {BAND_ORDER.map((key) => {
            const b = value[key];
            const dimmed = key === "vocal";
            return (
              <div
                key={key}
                className={cn(
                  "rounded-xl border border-border/50 bg-background/40 p-3",
                  dimmed && "opacity-50",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{BAND_LABELS[key]}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] text-foreground/80">
                        {BAND_DRIVE[key].source}
                      </span>
                      <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {BAND_DRIVE[key].range}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {dimmed ? "Off — track marked as instrumental" : BAND_HINTS[key]}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBand(key, { enabled: !b.enabled })}
                    aria-label={b.enabled ? `Hide ${BAND_LABELS[key]}` : `Show ${BAND_LABELS[key]}`}
                    aria-pressed={b.enabled}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {b.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>

                {b.enabled && (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBand(key, { color: "auto" })}
                        aria-pressed={b.color === "auto"}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] transition-colors",
                          b.color === "auto"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        Match palette
                      </button>
                      {swatches.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBand(key, { color: c })}
                          aria-label={`Use color ${c}`}
                          aria-pressed={b.color === c}
                          className={cn(
                            "h-5 w-5 rounded-full ring-1 ring-foreground/15 transition-transform",
                            b.color === c && "scale-110 ring-2 ring-foreground/60",
                          )}
                          style={{ background: c }}
                        />
                      ))}
                    </div>

                    <div className="mt-2 flex gap-1.5">
                      {INTENSITIES.map((i) => (
                        <button
                          key={i.value}
                          type="button"
                          onClick={() => setBand(key, { intensity: i.value })}
                          aria-pressed={b.intensity === i.value}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] transition-colors",
                            b.intensity === i.value
                              ? "bg-foreground/10 text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {i.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_BANDS, vocalShape: value.vocalShape })}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Match Aura palette
          </button>
        </div>
      )}
    </div>
  );
}

export default BandCustomizer;
