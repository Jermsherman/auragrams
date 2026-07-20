// The AI-written "Song Personality Profile" panel — the emotional layer that
// sits between the orb and the deterministic Trait Sheet. Rendered only when
// the Aura has a cached `insight` on its row.

import { useEffect, useState } from "react";
import { Sparkles, Heart, User, MapPin, Palette, RefreshCw } from "lucide-react";
import type { AuraInsight } from "@/lib/auraInsight";

const SECTIONS = 5; // story · dna · traits · moment · visual

export function SongPersonalityProfile({
  insight,
  reveal = false,
  hideHeader = false,
  className = "",
}: {
  insight: AuraInsight;
  reveal?: boolean;
  hideHeader?: boolean;
  className?: string;
}) {
  // Staged fade-in: 0 = hidden name, 1 = name, 2..6 = each section
  const [stage, setStage] = useState<number>(reveal ? 0 : 99);

  useEffect(() => {
    if (!reveal) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStage(1), 80));
    for (let i = 0; i < SECTIONS; i++) {
      timers.push(window.setTimeout(() => setStage(2 + i), 260 + i * 220));
    }
    return () => timers.forEach((t) => clearTimeout(t));
  }, [reveal]);

  return (
    <section
      aria-label="Song personality profile"
      className={`w-full max-w-md mx-auto text-left ${className}`}
    >
      <div className="rounded-3xl glass-strong p-6 sm:p-7 relative overflow-hidden">
        {/* Aura Name — hidden when the reveal hero already displays it */}
        {!hideHeader && (
          <div
            className={`text-center transition-all duration-500 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
          >
            <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Aura Name
            </div>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl tracking-tight text-aura-gradient">
              {insight.auraName}
            </h2>
          </div>
        )}

        {/* Story */}
        <Section
          visible={stage >= 2}
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="Aura Story"
        >
          <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/90 italic">
            &ldquo;{insight.story}&rdquo;
          </p>
        </Section>

        {/* Emotional DNA */}
        <Section
          visible={stage >= 3}
          icon={<Heart className="h-3.5 w-3.5" />}
          label="Emotional DNA"
        >
          <ul className="space-y-2.5">
            {insight.emotionalDNA.map((e) => (
              <li key={e.emotion} className="flex gap-3">
                <span className="mt-0.5 shrink-0 inline-flex items-center rounded-full bg-aura-gradient/25 border border-foreground/15 px-2.5 h-6 text-[10px] uppercase tracking-[0.22em] text-foreground/90">
                  {e.emotion}
                </span>
                <span className="text-[13px] leading-relaxed text-muted-foreground">
                  {e.why}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Personality Traits */}
        <Section
          visible={stage >= 4}
          icon={<User className="h-3.5 w-3.5" />}
          label="Personality Traits"
        >
          <ul className="space-y-2.5">
            {insight.personalityTraits.map((t) => (
              <li key={t.trait} className="flex gap-3">
                <span className="mt-0.5 shrink-0 inline-flex items-center rounded-full border border-foreground/20 bg-background/30 px-2.5 h-6 text-[10px] uppercase tracking-[0.22em] text-foreground/90">
                  {t.trait}
                </span>
                <span className="text-[13px] leading-relaxed text-muted-foreground">
                  {t.why}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Listener Moment */}
        {insight.listenerMoment && (
          <Section
            visible={stage >= 5}
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Listener Moment"
          >
            <p className="text-sm leading-relaxed text-foreground/85">
              &ldquo;{insight.listenerMoment}&rdquo;
            </p>
          </Section>
        )}

        {/* Visual Meaning */}
        {insight.visualMeaning && (
          <Section
            visible={stage >= 6}
            icon={<Palette className="h-3.5 w-3.5" />}
            label="Visual Meaning"
          >
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {insight.visualMeaning}
            </p>
          </Section>
        )}
      </div>
    </section>
  );
}

function Section({
  visible,
  icon,
  label,
  children,
}: {
  visible: boolean;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mt-5 pt-4 border-t border-border/50 transition-all duration-600 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2.5">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

// Compact loading/empty state shown while the insight is being generated.
export function SongPersonalityProfilePending({
  onRetry,
  canRetry = false,
  className = "",
}: {
  onRetry?: () => void;
  canRetry?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label="Song personality profile — pending"
      className={`w-full max-w-md mx-auto text-center ${className}`}
    >
      <div className="rounded-3xl glass-strong p-6 sm:p-7 relative overflow-hidden">
        <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          Aura Name
        </div>
        <div className="mt-2 inline-block h-7 w-40 rounded bg-foreground/10 animate-pulse" />
        <p className="mt-4 text-xs text-muted-foreground">
          Writing your song's personality profile…
        </p>
        {canRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 h-8 text-[11px] hover:bg-foreground/5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry story
          </button>
        )}
      </div>
    </section>
  );
}
