import { useEffect, useRef, useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getPersonality, type AuraPersonality, type MoodKey, type AuraProfile } from "@/lib/aura";
import type { AudioMetrics } from "@/hooks/useAudioAnalyser";

type Props = {
  size?: number | string;
  hueShift?: number;
  intensity?: number;
  className?: string;
  analyser?: React.RefObject<AnalyserNode | null>;
  metricsRef?: React.RefObject<AudioMetrics> | React.MutableRefObject<AudioMetrics>;
  isPlaying?: boolean;
  /** Either a new MoodKey or a legacy palette key. */
  palette?: string;
  personality?: AuraPersonality | MoodKey;
  /** Full AuraProfile — when provided, palette colors come from profile.colors. */
  profile?: AuraProfile;
  particles?: boolean;
};

function shapeStyle(shape: AuraPersonality["shape"]): React.CSSProperties {
  switch (shape) {
    case "oval":
      return { borderRadius: "50%", transform: "scaleY(0.86)" };
    case "tall":
      return { borderRadius: "48% 52% 46% 54% / 60% 60% 40% 40%" };
    case "wide":
      return { borderRadius: "50%", transform: "scaleX(1.12) scaleY(0.92)" };
    case "soft-blob":
      return { borderRadius: "58% 42% 54% 46% / 50% 56% 44% 50%" };
    default:
      return { borderRadius: "50%" };
  }
}

function motionAnimation(motion: AuraPersonality["motion"], speed: number, playing: boolean) {
  // Returns a base animation for the outer shell.
  const dur = 24 / speed;
  switch (motion) {
    case "pulse":
      return playing ? `aura-pulse ${6 / speed}s ease-in-out infinite` : `aura-breathe 6s ease-in-out infinite`;
    case "tide":
      return `aura-tide ${10 / speed}s ease-in-out infinite, aura-spin ${dur}s linear infinite`;
    case "shimmer":
      return `aura-spin ${dur * 0.6}s linear infinite`;
    case "drift":
      return `aura-drift ${12 / speed}s ease-in-out infinite, aura-spin ${dur * 1.4}s linear infinite`;
    case "smoke":
      return `aura-spin ${dur * 1.4}s linear infinite, aura-smoke ${9 / speed}s ease-in-out infinite`;
    case "breathe":
    default:
      return `aura-spin ${dur}s linear infinite`;
  }
}

export function OrbVisual({
  size = 320,
  hueShift = 0,
  intensity = 1,
  className,
  analyser,
  metricsRef,
  isPlaying = false,
  palette,
  personality,
  profile,
  particles = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const textureRef = useRef<HTMLDivElement>(null);
  const ringCanvasRef = useRef<HTMLCanvasElement>(null);
  const filterId = useId().replace(/:/g, "");

  const p: AuraPersonality = useMemo(() => {
    const base =
      typeof personality === "object"
        ? personality!
        : getPersonality(
            (typeof personality === "string" ? personality : undefined) ?? palette ?? profile?.palette,
          );
    if (!profile) return base;
    const c = profile.colors;
    return {
      ...base,
      stops: [c.primary, c.secondary, c.accent, c.glow, c.primary] as AuraPersonality["stops"],
      swatches: c.swatches,
      glow: c.glow,
      atmosphere: c.shadow,
    };
  }, [personality, palette, profile]);

  // Drive CSS vars from metrics (preferred) or analyser (fallback).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!metricsRef && !analyser?.current) return;

    let raf = 0;
    // smoothed values for var output
    let scale = 1;
    let glow = 0.6;
    let bassHalo = 1;
    let shimmer = 0.5;
    let deform = 0;
    let burst = 0;

    // fallback analyser-only state
    const a = analyser?.current ?? null;
    const freq = a ? new Uint8Array(a.frequencyBinCount) : null;
    const wave = a ? new Uint8Array(a.fftSize) : null;

    const tick = () => {
      let vol = 0;
      let bass = 0;
      let mid = 0;
      let treble = 0;
      let peak = 0;
      let trans = 0;

      if (metricsRef?.current?.ready) {
        const m = metricsRef.current;
        vol = m.volume;
        bass = m.bass;
        mid = m.mid;
        treble = m.treble;
        peak = m.peak;
        trans = m.transient;
      } else if (a && freq && wave) {
        a.getByteTimeDomainData(wave);
        a.getByteFrequencyData(freq);
        let min = 255;
        let max = 0;
        let sumSq = 0;
        for (let i = 0; i < wave.length; i += 4) {
          const v = wave[i];
          if (v < min) min = v;
          if (v > max) max = v;
          const c = (v - 128) / 128;
          sumSq += c * c;
        }
        peak = (max - min) / 255;
        vol = Math.sqrt(sumSq / (wave.length / 4));
        const n = freq.length;
        const bEnd = Math.floor(n * 0.08);
        const mEnd = Math.floor(n * 0.35);
        let bs = 0;
        let ms = 0;
        let ts = 0;
        for (let i = 0; i < bEnd; i++) bs += freq[i];
        for (let i = bEnd; i < mEnd; i++) ms += freq[i];
        for (let i = mEnd; i < n; i++) ts += freq[i];
        bass = bs / Math.max(1, bEnd) / 255;
        mid = ms / Math.max(1, mEnd - bEnd) / 255;
        treble = ts / Math.max(1, n - mEnd) / 255;
      }

      // Targets
      const tScale = 1 + Math.min(0.22, vol * 0.55 + peak * 0.1);
      const tGlow = 0.55 + (vol * 0.8 + mid * 0.6);
      const tBass = 1 + Math.min(0.36, bass * 0.55);
      const tShim = 0.4 + treble * 1.8;
      const tDeform = Math.min(22, peak * 22);

      // Lerp envelopes
      scale += (tScale - scale) * 0.18;
      glow += (tGlow - glow) * 0.18;
      bassHalo += (tBass - bassHalo) * 0.22;
      shimmer += (tShim - shimmer) * 0.2;
      deform += (tDeform - deform) * 0.28;
      burst = Math.max(burst * 0.86, trans);

      el.style.setProperty("--orb-scale", scale.toFixed(3));
      el.style.setProperty("--orb-glow", glow.toFixed(3));
      el.style.setProperty("--orb-bass", bassHalo.toFixed(3));
      el.style.setProperty("--orb-shimmer", shimmer.toFixed(3));
      el.style.setProperty("--orb-deform", deform.toFixed(2));
      el.style.setProperty("--orb-burst", burst.toFixed(3));

      // Pull waveform once
      const waveData =
        metricsRef?.current?.waveform ??
        (a && wave ? (a.getByteTimeDomainData(wave!), wave) : null);

      // Edge clip-path deformation on the shell + texture (oscilloscope silhouette)
      if (waveData && waveData.length > 0 && (shellRef.current || textureRef.current)) {
        const N = 36;
        const step = waveData.length / N;
        const amp = 0.05 + Math.min(0.18, vol * 0.45 + peak * 0.18);
        let pts = "";
        for (let i = 0; i < N; i++) {
          const v = (waveData[Math.floor(i * step)] - 128) / 128;
          const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
          const r = 0.5 + v * amp;
          const x = (50 + Math.cos(angle) * r * 100).toFixed(2);
          const y = (50 + Math.sin(angle) * r * 100).toFixed(2);
          pts += `${x}% ${y}%${i < N - 1 ? "," : ""}`;
        }
        const clip = `polygon(${pts})`;
        if (shellRef.current) shellRef.current.style.clipPath = clip;
        if (textureRef.current) textureRef.current.style.clipPath = clip;
      }

      // Draw oscilloscope rings
      const canvas = ringCanvasRef.current;
      if (canvas && waveData && waveData.length > 0) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const rect = canvas.getBoundingClientRect();
          const need =
            canvas.width !== Math.floor(rect.width * dpr) ||
            canvas.height !== Math.floor(rect.height * dpr);
          if (need) {
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
          }
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          const cx = w / 2;
          const cy = h / 2;
          const baseR = Math.min(w, h) * 0.42;
          const deformGain = baseR * 0.32 + deform * 1.1;
          const samples = 220;
          const step2 = waveData.length / samples;

          // Ring 1: primary oscilloscope
          ctx.lineWidth = 2.2 * dpr;
          ctx.strokeStyle = `${p.stops[3]}`;
          ctx.shadowBlur = 14 * dpr;
          ctx.shadowColor = p.glow;
          ctx.globalAlpha = 0.4 + Math.min(0.55, vol * 1.8);
          ctx.beginPath();
          for (let i = 0; i <= samples; i++) {
            const idx = Math.floor((i % samples) * step2);
            const v = (waveData[idx] - 128) / 128;
            const angle = (i / samples) * Math.PI * 2;
            const r = baseR + v * deformGain;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();

          // Ring 2: bass-driven outer halo ring
          ctx.lineWidth = 1.2 * dpr;
          ctx.strokeStyle = p.stops[1];
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.18 + Math.min(0.4, bass * 1.4);
          const baseR2 = baseR * (1.06 + bass * 0.12);
          ctx.beginPath();
          for (let i = 0; i <= samples; i++) {
            const idx = Math.floor((i % samples) * step2);
            const v = (waveData[idx] - 128) / 128;
            const angle = (i / samples) * Math.PI * 2 + 0.12;
            const r = baseR2 + v * deformGain * 0.6;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();

          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser, metricsRef, isPlaying, p.motion, p.stops, p.glow]);

  const dim = typeof size === "number" ? `${size}px` : size;
  const [s0, s1, s2, s3, s4] = p.stops;

  const conic = `conic-gradient(from 180deg at 50% 50%, ${s0}, ${s1}, ${s2}, ${s3}, ${s4}, ${s0})`;
  const innerHighlight = `radial-gradient(circle at 35% 30%, ${s4} 0%, ${s2} 38%, ${s0} 72%, transparent 92%)`;
  const outerGlow = `radial-gradient(circle at 50% 50%, ${p.glow}, ${s0} 38%, transparent 72%)`;

  const shape = shapeStyle(p.shape);
  const motionAnim = motionAnimation(p.motion, p.speed, isPlaying);

  const particleCount = Math.max(0, Math.min(28, p.particleCount));

  return (
    <div
      ref={ref}
      className={cn("relative shrink-0", className)}
      style={
        {
          width: dim,
          height: dim,
          transform: "scale(var(--orb-scale, 1))",
          transition: "transform 0.08s linear",
          ["--hue" as string]: `${hueShift * 0.05 + p.hueShift}deg`,
        } as React.CSSProperties
      }
    >
      {/* SVG filters (texture overlays) */}
      <svg className="absolute -z-10" width="0" height="0" aria-hidden>
        <defs>
          <filter id={`grain-${filterId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id={`silk-${filterId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="14" />
          </filter>
          <filter id={`mist-${filterId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" />
            <feGaussianBlur stdDeviation="6" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <filter id={`smoke-${filterId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="22" />
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <filter id={`ripple-${filterId}`}>
            <feTurbulence type="turbulence" baseFrequency="0.018 0.04" numOctaves="2" seed="5" />
            <feDisplacementMap in="SourceGraphic" scale="10" />
          </filter>
        </defs>
      </svg>

      {/* outer glow halo */}
      <div
        className="absolute inset-0 blur-3xl"
        style={{
          ...shape,
          background: outerGlow,
          opacity: `calc(0.65 * ${intensity} * var(--orb-glow, 1))`,
          transform: "scale(var(--orb-bass, 1))",
        }}
      />

      {/* outer shell (conic) */}
      <div
        ref={shellRef}
        className="absolute inset-[7%]"
        style={{
          ...shape,
          background: conic,
          filter: `blur(2px) hue-rotate(var(--hue))`,
          animation: motionAnim,
        }}
      />

      {/* texture overlay */}
      {p.texture !== "smooth" && (
        <div
          ref={textureRef}
          className="absolute inset-[8%] pointer-events-none"
          style={{
            ...shape,
            background: conic,
            filter: `url(#${p.texture}-${filterId}) hue-rotate(var(--hue))`,
            mixBlendMode: "overlay",
            opacity: 0.7,
          }}
        />
      )}

      {/* inner highlight core */}
      <div
        className="absolute inset-[14%]"
        style={{
          ...shape,
          background: innerHighlight,
          mixBlendMode: "screen",
          filter: `hue-rotate(var(--hue))`,
        }}
      />

      {/* sheen */}
      <div
        className="absolute inset-[18%] opacity-70"
        style={{
          ...shape,
          background:
            "radial-gradient(ellipse 50% 30% at 35% 25%, oklch(1 0 0 / 0.6), transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* rim shadow */}
      <div
        className="absolute inset-[6%] pointer-events-none"
        style={{
          ...shape,
          boxShadow:
            "inset 0 0 60px oklch(0.18 0.05 290 / 0.55), inset 0 -22px 44px oklch(0.08 0.03 290 / 0.7)",
        }}
      />

      {/* oscilloscope waveform ring (uploads only) */}
      {(metricsRef || analyser) && (
        <canvas
          ref={ringCanvasRef}
          className="pointer-events-none absolute inset-0 w-full h-full"
          aria-hidden
        />
      )}

      {/* transient burst flash */}
      {(metricsRef || analyser) && (
        <div
          className="pointer-events-none absolute inset-0 blur-2xl"
          style={{
            ...shape,
            background: outerGlow,
            opacity: "calc(var(--orb-burst, 0) * 0.55)",
            transform: "scale(calc(1 + var(--orb-burst, 0) * 0.18))",
            transition: "opacity 0.08s linear",
          }}
        />
      )}

      {/* particles */}
      {particles && particleCount > 0 && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ ...shape, opacity: "var(--orb-shimmer, 1)" }}
        >
          {Array.from({ length: particleCount }).map((_, i) => (
            <Particle key={i} index={i} kind={p.particle} speed={p.speed} stops={p.stops} />
          ))}
        </div>
      )}
    </div>
  );
}

function Particle({
  index,
  kind,
  speed,
  stops,
}: {
  index: number;
  kind: AuraPersonality["particle"];
  speed: number;
  stops: AuraPersonality["stops"];
}) {
  const top = `${50 + Math.sin(index * 1.4) * 44}%`;
  const left = `${50 + Math.cos(index * 1.7) * 46}%`;
  const delay = `${(index % 8) * 0.35}s`;
  const dur = `${(5 + (index % 5)) / Math.max(0.5, speed)}s`;

  switch (kind) {
    case "smoke":
      return (
        <span
          className="absolute rounded-full"
          style={{
            top,
            left,
            width: 14,
            height: 14,
            background: stops[0],
            filter: "blur(8px)",
            opacity: 0.35,
            animation: `aura-float ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "shimmer":
      return (
        <span
          className="absolute"
          style={{
            top,
            left,
            width: 2,
            height: 8,
            background: stops[3],
            boxShadow: `0 0 6px ${stops[3]}`,
            transform: `rotate(${index * 23}deg)`,
            opacity: 0.85,
            animation: `aura-twinkle ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "mist":
      return (
        <span
          className="absolute rounded-full"
          style={{
            top,
            left,
            width: 22,
            height: 22,
            background: stops[2],
            filter: "blur(12px)",
            opacity: 0.28,
            animation: `aura-float ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "embers":
      return (
        <span
          className="absolute rounded-full"
          style={{
            top,
            left,
            width: 3,
            height: 3,
            background: stops[1],
            boxShadow: `0 0 8px ${stops[1]}, 0 0 16px ${stops[1]}`,
            opacity: 0.85,
            animation: `aura-rise ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "tide":
      return (
        <span
          className="absolute"
          style={{
            top,
            left,
            width: 18,
            height: 1.5,
            background: `linear-gradient(90deg, transparent, ${stops[0]}, transparent)`,
            opacity: 0.6,
            animation: `aura-tide-streak ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
    case "dust":
    default:
      return (
        <span
          className="absolute rounded-full bg-foreground/70"
          style={{
            top,
            left,
            width: 3,
            height: 3,
            opacity: 0.35,
            filter: "blur(0.5px)",
            animation: `aura-float ${dur} ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      );
  }
}
