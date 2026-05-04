import { useEffect, useState } from "react";
import { ChevronDown, Plus, X, ArrowUp, ArrowDown, Palette, Sparkles, Pencil, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserColorInfluence, ColorInfluenceMode } from "@/lib/aura";

const PLACEHOLDERS = [
  "sunset orange and purple",
  "cold blue winter",
  "dusty pink bedroom",
  "neon green and black",
  "ocean teal with gold light",
];

const isValidHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);

export function ColorInfluence({
  value,
  onChange,
}: {
  value: UserColorInfluence;
  onChange: (next: UserColorInfluence) => void;
}) {
  const [open, setOpen] = useState(false);
  const [phIndex, setPhIndex] = useState(0);

  useEffect(() => {
    if (value.mode !== "description") return;
    const t = setInterval(() => setPhIndex((i) => (i + 1) % PLACEHOLDERS.length), 2400);
    return () => clearInterval(t);
  }, [value.mode]);

  const setMode = (mode: ColorInfluenceMode) => {
    if (mode === value.mode) return;
    if (mode === "surprise") onChange({ mode, colors: [], description: "" });
    else if (mode === "single")
      onChange({ mode, colors: value.colors[0] ? [value.colors[0]] : ["#A855F7"], description: "" });
    else if (mode === "palette")
      onChange({ mode, colors: value.colors.length ? value.colors.slice(0, 5) : ["#A855F7", "#FF7E47"], description: "" });
    else onChange({ mode, colors: [], description: value.description });
  };

  const summary =
    value.mode === "surprise"
      ? "Surprise me"
      : value.mode === "single"
        ? `One color · ${value.colors[0] ?? ""}`
        : value.mode === "palette"
          ? `${value.colors.length} colors`
          : value.description
            ? `“${value.description.slice(0, 28)}${value.description.length > 28 ? "…" : ""}”`
            : "Describe a vibe";

  return (
    <div className="glass rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid place-items-center h-8 w-8 rounded-full glass-strong">
            <Palette className="h-3.5 w-3.5 text-foreground/85" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Color Influence · optional
            </div>
            <div className="text-xs text-foreground/80 truncate">{summary}</div>
          </div>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground">
            Suggest a color direction, or let Auragram find one from the sound.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <ModePill icon={Sparkles} label="Surprise Me" active={value.mode === "surprise"} onClick={() => setMode("surprise")} />
            <ModePill icon={Palette} label="Pick One" active={value.mode === "single"} onClick={() => setMode("single")} />
            <ModePill icon={Wand2} label="Build Palette" active={value.mode === "palette"} onClick={() => setMode("palette")} />
            <ModePill icon={Pencil} label="Describe" active={value.mode === "description"} onClick={() => setMode("description")} />
          </div>

          {value.mode === "surprise" && (
            <p className="text-[11px] text-muted-foreground italic">
              Auragram will blend a palette from your sound.
            </p>
          )}

          {value.mode === "single" && (
            <SingleColor
              hex={value.colors[0] ?? "#A855F7"}
              onChange={(hex) => onChange({ mode: "single", colors: [hex], description: "" })}
            />
          )}

          {value.mode === "palette" && (
            <BuildPalette
              colors={value.colors}
              onChange={(cols) => onChange({ mode: "palette", colors: cols, description: "" })}
            />
          )}

          {value.mode === "description" && (
            <div className="space-y-1.5">
              <input
                value={value.description}
                onChange={(e) =>
                  onChange({ mode: "description", colors: [], description: e.target.value.slice(0, 80) })
                }
                placeholder={PLACEHOLDERS[phIndex]}
                className="w-full rounded-xl bg-background/40 border border-border/60 px-3.5 h-11 text-sm outline-none focus:border-foreground/25"
              />
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Let Auragram blend it
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModePill({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Palette;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full h-9 px-3 text-[11px] transition-colors",
        active
          ? "bg-aura-gradient text-primary-foreground"
          : "border border-border/60 bg-background/30 text-foreground/85 hover:bg-foreground/5",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function SingleColor({ hex, onChange }: { hex: string; onChange: (hex: string) => void }) {
  const safe = isValidHex(hex) ? hex : "#A855F7";
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Main glow color</div>
      <div className="flex items-center gap-2.5 rounded-xl bg-background/40 border border-border/60 px-3 h-11">
        <span
          className="h-6 w-6 rounded-full ring-1 ring-foreground/15 shrink-0"
          style={{ background: safe }}
        />
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 rounded bg-transparent border-0 cursor-pointer"
          aria-label="Choose color"
        />
        <input
          value={hex}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            onChange(v.slice(0, 7));
          }}
          className="flex-1 bg-transparent outline-none text-sm uppercase tabular-nums"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function BuildPalette({
  colors,
  onChange,
}: {
  colors: string[];
  onChange: (cols: string[]) => void;
}) {
  const setAt = (i: number, hex: string) => {
    const next = [...colors];
    next[i] = hex;
    onChange(next);
  };
  const remove = (i: number) => onChange(colors.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= colors.length) return;
    const next = [...colors];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => {
    if (colors.length >= 5) return;
    onChange([...colors, "#3DD2FF"]);
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        Blend these into the Aura · {colors.length}/5
      </div>
      <div className="space-y-1.5">
        {colors.map((c, i) => {
          const safe = isValidHex(c) ? c : "#A855F7";
          return (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl bg-background/40 border border-border/60 px-2.5 h-10"
            >
              <span
                className="h-5 w-5 rounded-full ring-1 ring-foreground/15 shrink-0"
                style={{ background: safe }}
              />
              <input
                type="color"
                value={safe}
                onChange={(e) => setAt(i, e.target.value)}
                className="h-6 w-8 rounded bg-transparent border-0 cursor-pointer"
                aria-label={`Color ${i + 1}`}
              />
              <input
                value={c}
                onChange={(e) => {
                  const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                  setAt(i, v.slice(0, 7));
                }}
                className="flex-1 bg-transparent outline-none text-xs uppercase tabular-nums"
                maxLength={7}
              />
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded-full p-1 hover:bg-foreground/10 disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === colors.length - 1}
                className="rounded-full p-1 hover:bg-foreground/10 disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={colors.length <= 2}
                className="rounded-full p-1 hover:bg-foreground/10 disabled:opacity-30"
                aria-label="Remove color"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={colors.length >= 5}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 h-8 px-3 text-[11px] hover:bg-foreground/5 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" /> Add color
      </button>
    </div>
  );
}
