import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getPersonality, type PaletteKey, type AuraPalette, type PitchCenter, type SourceType } from "@/lib/aura";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<SourceType, string> = {
  upload: "Uploaded Audio",
  platform_link: "Platform Link",
  raw_recording: "Raw Aura",
};

export function AuraProfileCard({
  name,
  moods,
  energy,
  description,
  palette,
  musicalKey,
  tempoBand,
  density,
  paletteName,
  vibeDescription,
  motionKeywords,
  colors,
  keyDetected,
  pitchCenter,
  sourceType,
}: {
  name: string;
  moods: string[];
  energy: number;
  description: string;
  palette: PaletteKey;
  musicalKey?: string;
  tempoBand?: string;
  density?: string;
  paletteName?: string;
  vibeDescription?: string;
  motionKeywords?: string[];
  colors?: AuraPalette;
  keyDetected?: boolean;
  pitchCenter?: PitchCenter;
  sourceType?: SourceType;
}) {
  const p = getPersonality(palette);
  const swatches = colors?.swatches ?? p.swatches;
  const grad = colors
    ? `linear-gradient(90deg, ${colors.primary}, ${colors.accent} 50%, ${colors.glow})`
    : `linear-gradient(90deg, ${p.stops[0]}, ${p.stops[1]} 50%, ${p.stops[2]})`;

  const showPitch = !!pitchCenter && (musicalKey === "Unknown" || sourceType === "raw_recording");
  const isRaw = sourceType === "raw_recording";

  return (
    <div className="glass-strong rounded-3xl p-6 sm:p-7 text-left">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          Aura Profile
        </div>
        {sourceType && (
          <span
            className={cn(
              "rounded-full px-2.5 h-6 inline-flex items-center text-[10px] uppercase tracking-[0.24em]",
              isRaw
                ? "bg-aura-gradient text-primary-foreground"
                : "border border-border/60 bg-background/30 text-muted-foreground",
            )}
          >
            {SOURCE_LABEL[sourceType]}
          </span>
        )}
      </div>
      <h3 className="mt-2 font-display text-2xl sm:text-3xl tracking-tight">
        <span className="text-aura-gradient">{name}</span>
      </h3>

      {moods.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {moods.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border/70 bg-background/30 px-2.5 h-6 inline-flex items-center text-[11px] text-foreground/85"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Trait label="Key" value={musicalKey ?? "Unknown"} hint={keyDetected ? "detected" : undefined} />
        <Trait label="Energy" value={`${energy}%`} />
        {showPitch && <Trait label="Pitch Center" value={pitchCenter!.note} hint={`${Math.round(pitchCenter!.hz)} Hz`} />}
        {!showPitch && tempoBand && <Trait label="Tempo" value={tempoBand} />}
        {density && <Trait label="Density" value={density} />}
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5">
          <span>Energy</span>
          <span className="tabular-nums text-foreground/85">{energy}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${energy}%`, background: grad }} />
        </div>
      </div>

      <Section title="Vibe" defaultOpen>
        <p className="text-sm leading-relaxed text-foreground/85">{description}</p>
        {vibeDescription && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground italic">
            “{vibeDescription}”
          </p>
        )}
        {motionKeywords && motionKeywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {motionKeywords.map((m) => (
              <span
                key={m}
                className="rounded-full bg-foreground/5 border border-border/50 px-2 h-5 inline-flex items-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title={paletteName ? `Palette · ${paletteName}` : "Palette"}>
        <div className="flex items-center gap-2 flex-wrap">
          {swatches.map((c, i) => (
            <span
              key={i}
              className="h-6 w-6 rounded-full ring-1 ring-foreground/15"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Trait({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/30 px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-[8px] text-foreground/60">{hint}</span>}
      </div>
      <div className="mt-0.5 text-sm font-medium capitalize">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-5 border-t border-border/40 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{title}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
