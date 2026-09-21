import { useState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { MOODS } from "@/lib/aura";
import { cn } from "@/lib/utils";

const MAX = 4;

export function MoodPicker({
  value,
  onChange,
  glowColor,
  onDetect,
  canDetect,
  detectLabel = "Detect Mood",
  compact = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  glowColor?: string;
  onDetect?: () => void | Promise<void>;
  canDetect?: boolean;
  detectLabel?: string;
  compact?: boolean;
}) {
  const [detecting, setDetecting] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const toggle = (m: string) => {
    if (value.includes(m)) onChange(value.filter((x) => x !== m));
    else if (value.length < MAX) onChange([...value, m]);
  };

  const handleDetect = async () => {
    if (!onDetect || detecting) return;
    setDetecting(true);
    try {
      await onDetect();
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-1 mb-2">
        <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80">
          Moods · up to {MAX}
        </span>
        <div className="flex items-center gap-2">
          {onDetect && (
            <button
              type="button"
              onClick={handleDetect}
              disabled={!canDetect || detecting}
              className="inline-flex items-center gap-1.5 rounded-full glass px-3 h-7 text-[11px] hover:bg-foreground/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {detecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {detectLabel}
            </button>

          )}
          <span className="text-[10px] tabular-nums text-muted-foreground/80">
            {value.length}/{MAX}
          </span>
        </div>
      </div>

      <div className="relative">
        {compact && value.length > 0 && !expanded && (
          <div className="flex flex-wrap gap-2 pb-3">
            {value.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggle(m)}
                className="min-h-9 rounded-full border border-transparent bg-aura-gradient px-3.5 text-xs text-primary-foreground"
                aria-label={`Remove ${m} mood`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {(!compact || expanded) && (
          <div className="flex flex-wrap gap-2 max-h-[44vh] sm:max-h-[36vh] overflow-y-auto pr-1 -mr-1 pb-2 [scrollbar-width:thin]">
          {MOODS.map((m) => {
            const active = value.includes(m);
            const disabled = !active && value.length >= MAX;
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggle(m)}
                disabled={disabled}
                className={cn(
                  "rounded-full px-3.5 min-h-9 text-xs transition-all border",
                  active
                    ? "bg-aura-gradient text-primary-foreground border-transparent scale-[1.03]"
                    : "border-border/70 text-foreground/85 hover:bg-foreground/5 hover:border-foreground/20",
                  disabled && "opacity-35 cursor-not-allowed",
                )}
                style={
                  active && glowColor
                    ? { boxShadow: `0 0 22px -4px ${glowColor}` }
                    : active
                      ? { boxShadow: "0 0 22px -6px oklch(0.7 0.2 310 / 0.85)" }
                      : undefined
                }
              >
                {m}
              </button>
            );
          })}
          </div>
        )}
        {compact && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={expanded}
          >
            {expanded ? "Done adjusting" : value.length > 0 ? "Adjust moods" : "Choose moods manually"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        )}
        {(!compact || expanded) && (
          <div className={cn("pointer-events-none absolute inset-x-0 h-6 bg-gradient-to-t from-background to-transparent", compact ? "bottom-11" : "bottom-0")} />
        )}
      </div>
    </div>
  );
}
