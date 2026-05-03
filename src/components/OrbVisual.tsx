import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { PALETTES, type PaletteKey } from "@/lib/aura";

type Props = {
  size?: number | string;
  hueShift?: number;
  intensity?: number;
  className?: string;
  analyser?: React.RefObject<AnalyserNode | null>;
  isPlaying?: boolean;
  palette?: PaletteKey;
  particles?: boolean;
};

export function OrbVisual({
  size = 320,
  hueShift = 0,
  intensity = 1,
  className,
  analyser,
  isPlaying = false,
  palette = "warm-nostalgic",
  particles = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const p = PALETTES[palette];

  useEffect(() => {
    if (!analyser?.current || !ref.current) return;
    const a = analyser.current;
    const data = new Uint8Array(a.frequencyBinCount);
    let raf = 0;
    let smooth = 0;
    let bassSmooth = 0;
    const tick = () => {
      a.getByteFrequencyData(data);
      let sum = 0;
      let bass = 0;
      const n = Math.min(48, data.length);
      for (let i = 0; i < n; i++) {
        sum += data[i];
        if (i < 8) bass += data[i];
      }
      const avg = sum / n / 255;
      const b = bass / 8 / 255;
      smooth += (avg - smooth) * 0.18;
      bassSmooth += (b - bassSmooth) * 0.22;
      const el = ref.current;
      if (el) {
        el.style.setProperty("--orb-scale", String(1 + smooth * 0.18));
        el.style.setProperty("--orb-glow", String(0.5 + smooth * 1.2));
        el.style.setProperty("--orb-bass", String(1 + bassSmooth * 0.15));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser, isPlaying]);

  const dim = typeof size === "number" ? `${size}px` : size;

  const conic = `conic-gradient(from 180deg at 50% 50%, ${p.stops[0]}, ${p.stops[1]}, ${p.stops[2]}, ${p.stops[3]}, ${p.stops[0]})`;
  const innerHighlight = `radial-gradient(circle at 35% 30%, ${p.stops[3]} 0%, ${p.stops[1]} 35%, ${p.stops[0]} 70%, transparent 92%)`;
  const outerGlow = `radial-gradient(circle at 50% 50%, ${p.glow}, ${p.stops[0]} 38%, transparent 70%)`;

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
          ["--hue" as string]: `${hueShift + p.hueShift}deg`,
        } as React.CSSProperties
      }
    >
      {/* outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: outerGlow,
          opacity: `calc(0.6 * ${intensity} * var(--orb-glow, 1))`,
          filter: `hue-rotate(var(--hue))`,
          transform: "scale(var(--orb-bass, 1))",
        }}
      />
      {/* conic core */}
      <div
        className="absolute inset-[8%] rounded-full animate-spin-slow"
        style={{
          background: conic,
          filter: `hue-rotate(var(--hue)) blur(2px)`,
        }}
      />
      {/* soft inner highlight */}
      <div
        className="absolute inset-[14%] rounded-full"
        style={{
          background: innerHighlight,
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
      {/* rim shadow */}
      <div
        className="absolute inset-[6%] rounded-full pointer-events-none"
        style={{
          boxShadow:
            "inset 0 0 60px oklch(0.2 0.05 290 / 0.55), inset 0 -20px 40px oklch(0.1 0.03 290 / 0.65)",
        }}
      />
      {/* particles */}
      {particles && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-foreground/70 animate-float-y"
              style={{
                top: `${50 + Math.sin(i * 1.4) * 44}%`,
                left: `${50 + Math.cos(i * 1.7) * 46}%`,
                animationDelay: `${(i % 6) * 0.45}s`,
                opacity: 0.25 + ((i % 4) * 0.12) * intensity,
                filter: "blur(0.5px)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
