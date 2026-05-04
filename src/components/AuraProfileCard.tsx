import { getPersonality, type PaletteKey } from "@/lib/aura";

export function AuraProfileCard({
  name,
  moods,
  energy,
  description,
  palette,
  musicalKey,
  tempoBand,
  density,
}: {
  name: string;
  moods: string[];
  energy: number;
  description: string;
  palette: PaletteKey;
  musicalKey?: string;
  tempoBand?: string;
  density?: string;
}) {
  const p = getPersonality(palette);
  const traits: { label: string; value: string }[] = [];
  if (musicalKey) traits.push({ label: "Key", value: musicalKey });
  if (tempoBand) traits.push({ label: "Tempo", value: tempoBand });
  if (density) traits.push({ label: "Density", value: density });
  traits.push({ label: "Motion", value: p.motion });

  return (
    <div className="glass-strong rounded-3xl p-6 sm:p-7 text-left">
      <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
        Aura Profile
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

      <div className="mt-5">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-1.5">
          <span>Energy</span>
          <span className="tabular-nums text-foreground/85">{energy}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${energy}%`,
              background: `linear-gradient(90deg, ${p.stops[0]}, ${p.stops[1]} 50%, ${p.stops[2]})`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {traits.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-border/60 bg-background/30 px-3 py-2.5"
          >
            <div className="text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
              {t.label}
            </div>
            <div className="mt-0.5 text-sm font-medium capitalize">{t.value}</div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-5 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mr-1">
          Palette
        </span>
        {p.swatches.map((c, i) => (
          <span
            key={i}
            className="h-4 w-4 rounded-full ring-1 ring-foreground/10"
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}
