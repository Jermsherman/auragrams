import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  size?: number | string;
  hueShift?: number;
  intensity?: number;
  className?: string;
  analyser?: React.RefObject<AnalyserNode | null>;
  isPlaying?: boolean;
};

export function OrbVisual({
  size = 320,
  hueShift = 0,
  intensity = 1,
  className,
  analyser,
  isPlaying = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analyser?.current || !ref.current) return;
    const a = analyser.current;
    const data = new Uint8Array(a.frequencyBinCount);
    let raf = 0;
    let smooth = 0;
    const tick = () => {
      a.getByteFrequencyData(data);
      // bass-weighted average
      let sum = 0;
      const n = Math.min(48, data.length);
      for (let i = 0; i < n; i++) sum += data[i];
      const avg = sum / n / 255; // 0..1
      smooth += (avg - smooth) * 0.18;
      const el = ref.current;
      if (el) {
        el.style.setProperty("--orb-scale", String(1 + smooth * 0.18));
        el.style.setProperty("--orb-glow", String(0.5 + smooth * 1.2));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser, isPlaying]);

  const dim = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      ref={ref}
      className={cn(
        "relative shrink-0",
        isPlaying ? "" : "animate-breathe",
        className,
      )}
      style={
        {
          width: dim,
          height: dim,
          transform: "scale(var(--orb-scale, 1))",
          transition: "transform 0.08s linear",
          ["--hue" as string]: `${hueShift}deg`,
        } as React.CSSProperties
      }
    >
      {/* outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.74 0.2 0 / 0.7), oklch(0.6 0.22 295 / 0.5) 40%, transparent 70%)",
          opacity: `calc(0.55 * ${intensity} * var(--orb-glow, 1))`,
          filter: `hue-rotate(var(--hue))`,
        }}
      />
      {/* conic core */}
      <div
        className="absolute inset-[8%] rounded-full animate-spin-slow"
        style={{
          background: "var(--gradient-aura)",
          filter: `hue-rotate(var(--hue)) blur(2px)`,
        }}
      />
      {/* soft inner highlight */}
      <div
        className="absolute inset-[14%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, oklch(0.95 0.08 60 / 0.85), oklch(0.74 0.2 0 / 0.4) 40%, oklch(0.45 0.2 295 / 0.3) 70%, transparent 90%)",
          mixBlendMode: "screen",
          filter: `hue-rotate(var(--hue))`,
        }}
      />
      {/* sheen */}
      <div
        className="absolute inset-[18%] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 35% 25%, oklch(1 0 0 / 0.6), transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      {/* rim */}
      <div
        className="absolute inset-[6%] rounded-full pointer-events-none"
        style={{
          boxShadow:
            "inset 0 0 60px oklch(0.2 0.05 290 / 0.6), inset 0 -20px 40px oklch(0.15 0.03 290 / 0.7)",
        }}
      />
    </div>
  );
}
