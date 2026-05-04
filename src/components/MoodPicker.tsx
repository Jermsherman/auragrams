import { MOODS } from "@/lib/aura";
import { cn } from "@/lib/utils";

const MAX = 4;

export function MoodPicker({
  value,
  onChange,
  glowColor,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  glowColor?: string;
}) {
  const toggle = (m: string) => {
    if (value.includes(m)) onChange(value.filter((x) => x !== m));
    else if (value.length < MAX) onChange([...value, m]);
  };

  return (
    <div>
      <div className="flex items-end justify-between px-1 mb-2">
        <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80">
          Moods · up to {MAX}
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground/80">
          {value.length}/{MAX}
        </span>
      </div>

      <div className="relative">
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
                  "rounded-full px-3.5 h-8 text-xs transition-all border",
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
        {/* edge fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  );
}
