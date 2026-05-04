import { useEffect, useRef, useId } from "react";
import { cn } from "@/lib/utils";
import { getPersonality, type AuraPersonality, type MoodKey } from "@/lib/aura";

type Props = {
  size?: number | string;
  hueShift?: number;
  intensity?: number;
  className?: string;
  analyser?: React.RefObject<AnalyserNode | null>;
  isPlaying?: boolean;
  /** Either a new MoodKey or a legacy palette key. */
  palette?: string;
  personality?: AuraPersonality | MoodKey;
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
  isPlaying = false,
  palette,
  personality,
  particles = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const filterId = useId().replace(/:/g, "");

  const p: AuraPersonality =
    typeof personality === "object"
      ? personality!
      : getPersonality(
          (typeof personality === "string" ? personality : undefined) ?? palette,
        );

  useEffect(() => {
    if (!analyser?.current || !ref.current) return;
    const a = analyser.current;
    const freq = new Uint8Array(a.frequencyBinCount);
    const wave = new Uint8Array(a.fftSize);
    let raf = 0;
    // Smoothed envelopes
    let waveEnv = 0; // peak-to-peak waveform amplitude
    let bassEnv = 0;
    let midEnv = 0;
    let highEnv = 0;
    const tick = () => {
      a.getByteTimeDomainData(wave);
      a.getByteFrequencyData(freq);

      // Waveform peak-to-peak (oscilloscope-style)
      let min = 255;
      let max = 0;
      // Subsample for perf
      const stride = Math.max(1, Math.floor(wave.length / 256));
      for (let i = 0; i < wave.length; i += stride) {
        const v = wave[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const peak = (max - min) / 255; // 0..1

      // Frequency bands — split into bass / mid / high
      const n = freq.length;
      const bassEnd = Math.floor(n * 0.08);
      const midEnd = Math.floor(n * 0.35);
      let bassSum = 0;
      let midSum = 0;
      let highSum = 0;
      for (let i = 0; i < bassEnd; i++) bassSum += freq[i];
      for (let i = bassEnd; i < midEnd; i++) midSum += freq[i];
      for (let i = midEnd; i < n; i++) highSum += freq[i];
      const bass = bassSum / Math.max(1, bassEnd) / 255;
      const mid = midSum / Math.max(1, midEnd - bassEnd) / 255;
      const high = highSum / Math.max(1, n - midEnd) / 255;

      // Smooth (slow attack/release for premium feel)
      waveEnv += (peak - waveEnv) * 0.18;
      bassEnv += (bass - bassEnv) * 0.15;
      midEnv += (mid - midEnv) * 0.12;
      highEnv += (high - highEnv) * 0.2;

      const el = ref.current;
      if (el) {
        const pulseGain = p.motion === "pulse" ? 0.32 : 0.2;
        el.style.setProperty("--orb-scale", String(1 + waveEnv * pulseGain));
        el.style.setProperty("--orb-glow", String(0.55 + (midEnv + waveEnv * 0.5) * 1.2));
        el.style.setProperty("--orb-bass", String(1 + bassEnv * 0.22));
        el.style.setProperty("--orb-shimmer", String(0.4 + highEnv * 1.6));
        el.style.setProperty("--orb-deform", String(waveEnv * 8)); // px displacement-ish
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser, isPlaying, p.motion]);

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
