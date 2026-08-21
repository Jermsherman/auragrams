import { useEffect, useState } from "react";
import { ChevronDown, Pencil, Sparkles, Loader2, Check, X, Heart, User, Palette as PaletteIcon } from "lucide-react";
import { getPersonality, type PaletteKey, type AuraPalette, type PitchCenter, type SourceType } from "@/lib/aura";
import type { AuraInsight } from "@/lib/auraInsight";
import { useCursorLight } from "@/hooks/useCursorLight";
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
  editable = false,
  onSaveVibe,
  onRegenerateVibe,
  colorGuided = false,
  insight,
  onSaveStory,
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
  editable?: boolean;
  onSaveVibe?: (text: string) => Promise<void> | void;
  onRegenerateVibe?: () => Promise<void> | void;
  colorGuided?: boolean;
  /** AI reading of the song — merged into this one profile card. */
  insight?: AuraInsight | null;
  /** Artist-written Aura Story. Omit to hide the editor. */
  onSaveStory?: (text: string) => Promise<void> | void;
}) {
  const p = getPersonality(palette);
  const swatches = colors?.swatches ?? p.swatches;
  const grad = colors
    ? `linear-gradient(90deg, ${colors.primary}, ${colors.accent} 50%, ${colors.glow})`
    : `linear-gradient(90deg, ${p.stops[0]}, ${p.stops[1]} 50%, ${p.stops[2]})`;

  const light = useCursorLight<HTMLDivElement>({ tilt: 2.5 });

  const showPitch = !!pitchCenter && (musicalKey === "Unknown" || sourceType === "raw_recording");
  const isRaw = sourceType === "raw_recording";

  return (
    <div
      ref={light.ref}
      onPointerMove={light.onPointerMove}
      onPointerLeave={light.onPointerLeave}
      className="glass-card hairline-aura cursor-light reveal-up rounded-3xl p-6 sm:p-7 text-left"
      style={{
        ["--surface-light" as string]: colors?.glow ?? p.glow,
        transform:
          "perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
      }}
    >
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
        <span className="text-aura-gradient-live">{name}</span>
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
        <VibeEditor
          vibeDescription={vibeDescription}
          editable={editable}
          onSaveVibe={onSaveVibe}
          onRegenerateVibe={onRegenerateVibe}
        />
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

      {(onSaveStory || insight?.story) && (
        <Section title="Aura Story" defaultOpen>
          <StoryEditor story={insight?.story} onSaveStory={onSaveStory} />
        </Section>
      )}

      {insight && insight.emotionalDNA.length > 0 && (
        <Section title="Emotional DNA" icon={<Heart className="h-3.5 w-3.5" />} defaultOpen>
          <ul className="space-y-2.5">
            {insight.emotionalDNA.map((e) => (
              <li key={e.emotion} className="flex gap-3">
                <span className="mt-0.5 shrink-0 inline-flex items-center rounded-full bg-aura-gradient/25 border border-foreground/15 px-2.5 h-6 text-[10px] uppercase tracking-[0.22em] text-foreground/90">
                  {e.emotion}
                </span>
                <span className="text-[13px] leading-relaxed text-muted-foreground">{e.why}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {insight && insight.personalityTraits.length > 0 && (
        <Section title="Personality" icon={<User className="h-3.5 w-3.5" />}>
          <ul className="space-y-2.5">
            {insight.personalityTraits.map((t) => (
              <li key={t.trait} className="flex gap-3">
                <span className="mt-0.5 shrink-0 inline-flex items-center rounded-full border border-foreground/20 bg-background/30 px-2.5 h-6 text-[10px] uppercase tracking-[0.22em] text-foreground/90">
                  {t.trait}
                </span>
                <span className="text-[13px] leading-relaxed text-muted-foreground">{t.why}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {insight?.visualMeaning && (
        <Section title="Aura Meaning" icon={<PaletteIcon className="h-3.5 w-3.5" />}>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{insight.visualMeaning}</p>
        </Section>
      )}

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
        {colorGuided && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-aura-gradient/40 border border-foreground/15 px-2.5 h-6 text-[10px] uppercase tracking-[0.24em] text-foreground/90">
            <Sparkles className="h-3 w-3" /> Color-guided
          </div>
        )}
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
  icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-5 border-t border-border/40 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function VibeEditor({
  vibeDescription,
  editable,
  onSaveVibe,
  onRegenerateVibe,
}: {
  vibeDescription?: string;
  editable: boolean;
  onSaveVibe?: (text: string) => Promise<void> | void;
  onRegenerateVibe?: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(vibeDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(vibeDescription ?? "");
  }, [vibeDescription, editing]);

  if (editing) {
    return (
      <div className="mt-3 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 240))}
          rows={3}
          maxLength={240}
          placeholder="Describe the vibe in your own words…"
          className="w-full rounded-xl bg-background/40 border border-border/60 px-3 py-2 text-sm italic outline-none focus:border-foreground/25 resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {draft.length}/240
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(vibeDescription ?? "");
              }}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 h-8 px-3 text-[11px] hover:bg-foreground/5 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const t = draft.trim();
                if (!t || !onSaveVibe) return;
                setSaving(true);
                try {
                  await onSaveVibe(t);
                  setEditing(false);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-aura-gradient text-primary-foreground h-8 px-3.5 text-[11px] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save vibe
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {vibeDescription && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground italic">
          “{vibeDescription}”
        </p>
      )}
      {editable && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 h-8 px-3 text-[11px] hover:bg-foreground/5 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit the vibe
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!onRegenerateVibe) return;
              setGenerating(true);
              try {
                await onRegenerateVibe();
              } finally {
                setGenerating(false);
              }
            }}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 h-8 px-3 text-[11px] hover:bg-foreground/5 transition-colors disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate the vibe
          </button>
        </div>
      )}
    </>
  );
}

// Artist-written Aura Story. The model never writes this.
function StoryEditor({
  story,
  onSaveStory,
}: {
  story?: string;
  onSaveStory?: (text: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(story ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(story ?? "");
  }, [story, editing]);

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 420))}
          rows={4}
          maxLength={420}
          placeholder="What is this song about? Write it in your own words…"
          className="w-full rounded-xl bg-background/40 border border-border/60 px-3 py-2 text-sm outline-none focus:border-foreground/25 resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {draft.length}/420
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(story ?? "");
              }}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 h-8 px-3 text-[11px] hover:bg-foreground/5 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const t = draft.trim();
                if (!t || !onSaveStory) return;
                setSaving(true);
                try {
                  await onSaveStory(t);
                  setEditing(false);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-aura-gradient text-primary-foreground h-8 px-3.5 text-[11px] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save story
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {story ? (
        <p className="text-sm leading-relaxed text-foreground/90">{story}</p>
      ) : (
        onSaveStory && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            No story yet. Tell people what this song is about — in your words.
          </p>
        )
      )}
      {onSaveStory && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 h-8 px-3 text-[11px] hover:bg-foreground/5 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> {story ? "Edit your story" : "Write your story"}
        </button>
      )}
    </>
  );
}
