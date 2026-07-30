import { useMemo, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { OrbVisual } from "./OrbVisual";
import { getPersonality, type AuraProfile, type AuraPalette } from "@/lib/aura";
import type { AudioMetrics } from "@/hooks/useAudioAnalyser";
import type { Track } from "@/lib/tracks";
import type { BandsConfig } from "@/lib/auraBands";
import { pickAuraEffect, type AuraEffect } from "@/lib/auraEffects";

export type AurascopeSize = "large" | "medium" | "small" | "mini";
export type AurascopeMode = "full" | "minimal" | "card" | "story";

export type AurascopeAura = {
  id?: string;
  palette: string;
  seed?: number;
  auraName?: string;
  trackTitle?: string;
  artistName?: string;
  colors?: AuraPalette;
  profile?: AuraProfile;
  isAnonymous?: boolean;
  hasVocals?: boolean;
  bands?: BandsConfig | null;
  moods?: string[];
  energy?: number;
};

type AudioAnalysisData = {
  analyser?: React.RefObject<AnalyserNode | null>;
  metricsRef?: React.RefObject<AudioMetrics> | React.MutableRefObject<AudioMetrics>;
};

type Props = {
  aura: AurascopeAura;
  size?: AurascopeSize;
  mode?: AurascopeMode;
  isPlaying?: boolean;
  audioAnalysisData?: AudioAnalysisData;
  showLabel?: boolean;
  showControls?: boolean;
  interactive?: boolean;
  hero?: boolean;
  className?: string;
  style?: CSSProperties;
};

const SIZE_PX: Record<AurascopeSize, number | string> = {
  large: "min(82vw, 460px)",
  medium: 220,
  small: 140,
  mini: 72,
};

// Inner orb is sized as a percentage of the lens.
const ORB_INSET: Record<AurascopeSize, string> = {
  large: "12%",
  medium: "13%",
  small: "14%",
  mini: "10%",
};

/**
 * Build the Aura → Aurascope aura adapter from a Track-shaped object.
 */
export function aurascopeAuraFromTrack(t: Track): AurascopeAura {
  return {
    id: t.id,
    palette: t.palette,
    seed: t.seed,
    hasVocals: t.hasVocals,
    bands: t.bands,
    moods: t.moods,
    energy: t.energy,
    auraName: t.auraName,
    trackTitle: t.title,
    artistName: t.artist,
    colors: t.colors,
    profile: t.colors
      ? {
          palette: t.palette,
          auraName: t.auraName,
          paletteName: t.paletteName ?? "",
          energy: t.energy,
          description: t.description,
          vibeDescription: t.vibeDescription ?? "",
          motionKeywords: t.motionKeywords ?? [],
          musicalKey: t.musicalKey ?? "",
          tonic: t.tonic,
          mode: t.mode,
          keyDetected: t.keyDetected,
          tempoBand: (t.tempoBand as "Slow" | "Mid" | "Fast") ?? "Mid",
          density: (t.density as "Sparse" | "Lush" | "Dense") ?? "Lush",
          colors: t.colors,
        }
      : undefined,
  };
}

export function Aurascope({
  aura,
  size = "large",
  mode = "full",
  isPlaying = false,
  audioAnalysisData,
  showLabel,
  hero = false,
  interactive = false,
  className,
  style,
}: Props) {
  const personality = useMemo(() => getPersonality(aura.palette), [aura.palette]);
  const colors: AuraPalette = useMemo(() => {
    if (aura.colors) return aura.colors;
    const stops = personality.stops;
    return {
      primary: stops[0],
      secondary: stops[1],
      accent: stops[2],
      shadow: personality.atmosphere,
      glow: personality.glow,
      particle: stops[3],
      swatches: personality.swatches,
    };
  }, [aura.colors, personality]);

  // One deterministic atmosphere per Aura (smoke / water / ember / lightning).
  const effect = useMemo(
    () =>
      pickAuraEffect({
        moods: aura.moods,
        energy: aura.energy ?? aura.profile?.energy,
        palette: aura.palette,
        seed: aura.seed,
      }),
    [aura.moods, aura.energy, aura.profile?.energy, aura.palette, aura.seed],
  );



  // Ensure OrbVisual uses the saved per-aura colors at every call site, not
  // just where a full AuraProfile was built. Without this, cards/story/etc.
  // fall back to the generic mood swatches.
  const effectiveProfile = useMemo<AuraProfile | undefined>(() => {
    if (aura.profile) return aura.profile;
    if (!aura.colors) return undefined;
    return { palette: aura.palette, colors: aura.colors } as AuraProfile;
  }, [aura.profile, aura.colors, aura.palette]);

  const dim = SIZE_PX[size];
  const dimCss = typeof dim === "number" ? `${dim}px` : dim;
  const isCompact = size === "small" || size === "mini";
  const showGrid = mode !== "minimal" && size !== "mini";
  const showLabelResolved =
    showLabel ?? (mode === "full" || mode === "story");

  const styleVars: CSSProperties = {
    width: dimCss,
    ["--aura-primary" as string]: colors.primary,
    ["--aura-secondary" as string]: colors.secondary,
    ["--aura-accent" as string]: colors.accent,
    ["--aura-shadow" as string]: colors.shadow,
    ["--aura-glow" as string]: colors.glow,
    ["--aura-particle" as string]: colors.particle,
    ...style,
  };

  // Story mode: 9:16 frame around the lens.
  if (mode === "story") {
    return (
      <div
        className={cn(
          "relative aspect-[9/16] w-full max-w-[360px] rounded-[36px] overflow-hidden",
          "bg-gradient-to-b from-background/60 via-background/40 to-background/80",
          "ring-1 ring-foreground/10 backdrop-blur-2xl",
          className,
        )}
        style={styleVars}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 30%, color-mix(in oklab, var(--aura-glow) 50%, transparent), transparent 70%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <AurascopeLens
            size="large"
            mode="full"
            aura={{ ...aura, profile: effectiveProfile }}
            personality={personality}
            isPlaying={isPlaying}
            hero={hero}
            audioAnalysisData={audioAnalysisData}
            isCompact={false}
            showGrid
            colors={colors}
          />
          {showLabelResolved && <Label aura={aura} mode={mode} />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0",
        interactive && "transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
      style={styleVars}
    >
      <AurascopeLens
        size={size}
        mode={mode}
        aura={{ ...aura, profile: effectiveProfile }}
        personality={personality}
        isPlaying={isPlaying}
        hero={hero}
        audioAnalysisData={audioAnalysisData}
        isCompact={isCompact}
        showGrid={showGrid}
        colors={colors}
      />
      {showLabelResolved && <Label aura={aura} mode={mode} />}
    </div>
  );
}

function AurascopeLens({
  size,
  mode,
  aura,
  personality,
  isPlaying,
  hero,
  audioAnalysisData,
  isCompact,
  showGrid,
  colors,
}: {
  size: AurascopeSize;
  mode: AurascopeMode;
  aura: AurascopeAura;
  personality: ReturnType<typeof getPersonality>;
  isPlaying: boolean;
  hero: boolean;
  audioAnalysisData?: AudioAnalysisData;
  isCompact: boolean;
  showGrid: boolean;
  colors: AuraPalette;
}) {
  const dim = SIZE_PX[size];
  const dimCss = typeof dim === "number" ? `${dim}px` : dim;
  const radius = size === "mini" ? "rounded-[22%]" : size === "small" ? "rounded-[26%]" : "rounded-[28%]";

  return (
    <div
      className={cn(
        "relative aspect-square w-full",
        radius,
        "overflow-hidden",
        // Glass shell
        "bg-[oklch(0.10_0.04_290_/_0.55)]",
        "ring-1 ring-foreground/10",
        "shadow-[inset_0_1px_0_oklch(1_0_0_/_0.06),inset_0_-30px_60px_oklch(0.05_0.02_290_/_0.6)]",
        "backdrop-blur-xl",
      )}
      style={{ width: dimCss, height: dimCss }}
      aria-label={aura.auraName ? `Aurascope of ${aura.auraName}` : "Aurascope"}
    >
      {/* Outer halo tint based on aura glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--aura-glow) 28%, transparent) 0%, transparent 65%)",
        }}
      />

      {/* Rim highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--aura-accent) 16%, transparent), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Oscilloscope grid */}
      {showGrid && <AurascopeGrid faint={size === "small"} />}

      {/* Scope lens (slightly darker inner circle) */}
      <div
        className="absolute rounded-full pointer-events-none"
        aria-hidden
        style={{
          inset: "8%",
          background:
            "radial-gradient(circle at 50% 55%, oklch(0.08 0.03 290 / 0.55), oklch(0.10 0.03 290 / 0.15) 60%, transparent 80%)",
          boxShadow:
            "inset 0 0 1px oklch(1 0 0 / 0.08), inset 0 0 24px oklch(0 0 0 / 0.45)",
        }}
      />

      {/* Inner orb — uses existing OrbVisual */}
      <div
        className="absolute"
        style={{
          inset: ORB_INSET[size],
        }}
      >
        <OrbVisual
          size="100%"
          hueShift={aura.seed ?? 0}
          isPlaying={isPlaying}
          analyser={audioAnalysisData?.analyser}
          metricsRef={audioAnalysisData?.metricsRef}
          palette={aura.palette}
          profile={aura.profile}
          particles={!isCompact}
          hero={hero}
          hasVocals={aura.hasVocals !== false}
          bands={aura.bands}
          className={isPlaying || hero ? "" : "animate-breathe"}
        />
      </div>

      {/* Subtle equator line in compact mode (suggests the oscilloscope) */}
      {isCompact && (
        <div
          className="absolute left-[10%] right-[10%] top-1/2 h-px pointer-events-none"
          aria-hidden
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, var(--aura-glow) 60%, transparent), transparent)",
            opacity: 0.55,
          }}
        />
      )}

      {/* Tiny "Aurascope" caption for full/story */}
      {(mode === "full" || mode === "story") && size === "large" && (
        <div className="absolute bottom-2.5 left-0 right-0 text-center pointer-events-none">
          <span className="text-[8.5px] uppercase tracking-[0.36em] text-foreground/40">
            Aurascope
          </span>
        </div>
      )}
    </div>
  );
}

function AurascopeGrid({ faint = false }: { faint?: boolean }) {
  const stroke = "currentColor";
  const op = faint ? 0.06 : 0.1;
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none text-foreground"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <g stroke={stroke} strokeWidth="0.18" opacity={op} fill="none">
        {/* center cross */}
        <line x1="0" y1="50" x2="100" y2="50" />
        <line x1="50" y1="0" x2="50" y2="100" />
        {/* concentric measurement rings */}
        <circle cx="50" cy="50" r="22" />
        <circle cx="50" cy="50" r="34" />
        <circle cx="50" cy="50" r="44" />
        {/* tick marks along center axes */}
        {Array.from({ length: 9 }, (_, i) => 10 + i * 10).map((x) => (
          <line key={`tx-${x}`} x1={x} y1="49" x2={x} y2="51" />
        ))}
        {Array.from({ length: 9 }, (_, i) => 10 + i * 10).map((y) => (
          <line key={`ty-${y}`} x1="49" y1={y} x2="51" y2={y} />
        ))}
      </g>
    </svg>
  );
}

function Label({ aura, mode }: { aura: AurascopeAura; mode: AurascopeMode }) {
  if (mode === "card") {
    return (
      <div className="mt-2 text-center min-w-0">
        <div className="font-display text-sm truncate text-aura-gradient">
          {aura.auraName ?? aura.trackTitle ?? "Aura"}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-4 text-center min-w-0">
      <div className="font-display text-2xl sm:text-3xl tracking-tight truncate text-aura-gradient">
        {aura.auraName ?? aura.trackTitle ?? "Aura"}
      </div>
      {aura.trackTitle && aura.auraName && (
        <div className="mt-1 text-sm font-medium truncate">{aura.trackTitle}</div>
      )}
      {aura.artistName && !aura.isAnonymous && (
        <div className="text-xs text-muted-foreground truncate">{aura.artistName}</div>
      )}
    </div>
  );
}

export default Aurascope;
