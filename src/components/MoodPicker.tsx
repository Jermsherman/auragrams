import { MOODS } from "@/lib/aura";
import { cn } from "@/lib/utils";

const MAX = 3;

export function MoodPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (m: string) => {
    if (value.includes(m)) onChange(value.filter((x) => x !== m));
    else if (value.length < MAX) onChange([...value, m]);
  };

  return (
    <div>
      <div className="flex items-end justify-between px-1 mb-2">
        <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80">
          Mood · optional
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground/70">
          {value.length}/{MAX}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
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
                  ? "bg-aura-gradient text-primary-foreground border-transparent shadow-[0_0_24px_-6px_oklch(0.7_0.2_310/0.8)] scale-[1.02]"
                  : "border-border/70 text-foreground/85 hover:bg-foreground/5 hover:border-foreground/20",
                disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}
