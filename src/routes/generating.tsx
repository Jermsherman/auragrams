import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OrbVisual } from "@/components/OrbVisual";
import { Logo } from "@/components/Logo";
import { z } from "zod";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/generating")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [{ title: "Shaping your Aura… — Auragram" }],
  }),
  component: GeneratingPage,
});

const STEPS = [
  { label: "Reading your track's shape…", sub: "Frequency, key, and transient character" },
  { label: "Finding the color it lives in…", sub: "Mapping sound to hue and motion" },
  { label: "Locking the signature…", sub: "One song, one canonical Aura" },
  { label: "Revealing your Aura…", sub: "Deterministic — the same song, always" },
];

const TOTAL_MS = 1500;

function GeneratingPage() {
  const { id } = Route.useSearch();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / TOTAL_MS);
      setProgress(p);
      const idx = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
      setStep(idx);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const tGo = setTimeout(() => {
      if (id) nav({ to: "/aura/$id", params: { id }, search: { reveal: "1" as const } });
      else nav({ to: "/" });
    }, TOTAL_MS + 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(tGo);
    };
  }, [id, nav]);

  const pct = Math.round(progress * 100);
  const ringSize = 320;
  const stroke = 2;
  const r = ringSize / 2 - stroke * 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, oklch(0.32 0.18 310 / 0.55), transparent 55%), radial-gradient(ellipse at 50% 80%, oklch(0.3 0.16 25 / 0.35), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen opacity-40 animate-spin-slow"
        style={{
          background:
            "conic-gradient(from 0deg, oklch(0.7 0.2 310 / 0.35), oklch(0.78 0.18 25 / 0.25), oklch(0.72 0.18 220 / 0.3), oklch(0.7 0.2 310 / 0.35))",
          filter: "blur(60px)",
        }}
      />

      <div className="absolute top-6 left-6 opacity-80 z-10">
        <Logo />
      </div>

      <div className="relative grid place-items-center">
        {/* progress ring */}
        <svg
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          className="absolute -rotate-90"
          style={{ filter: "drop-shadow(0 0 20px oklch(0.7 0.2 310 / 0.4))" }}
        >
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.78 0.18 310)" />
              <stop offset="50%" stopColor="oklch(0.82 0.15 25)" />
              <stop offset="100%" stopColor="oklch(0.78 0.18 220)" />
            </linearGradient>
          </defs>
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke="oklch(1 0 0 / 0.06)"
            strokeWidth={stroke}
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={stroke + 1}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 80ms linear" }}
          />
        </svg>

        <div className="animate-breathe">
          <OrbVisual size="min(72vw, 280px)" />
        </div>

        {/* orbiting motes */}
        <div className="pointer-events-none absolute inset-0 animate-spin-slow">
          {[...Array(8)].map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-foreground/80"
                style={{
                  top: `calc(50% + ${Math.sin(a) * 150}px)`,
                  left: `calc(50% + ${Math.cos(a) * 150}px)`,
                  filter: "blur(0.5px)",
                  opacity: 0.5 + (i % 3) * 0.15,
                  boxShadow: "0 0 8px oklch(0.85 0.15 310 / 0.8)",
                }}
              />
            );
          })}
        </div>

        {/* floating particles */}
        <div className="pointer-events-none absolute inset-0">
          {[...Array(14)].map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-foreground/60 animate-float-y"
              style={{
                top: `${50 + Math.sin(i * 1.3) * 38}%`,
                left: `${50 + Math.cos(i * 1.7) * 42}%`,
                animationDelay: `${(i % 7) * 0.35}s`,
                opacity: 0.35 + (i % 5) * 0.1,
                filter: "blur(0.5px)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-12 text-center min-h-[5rem] relative z-10">
        <p
          key={step}
          className="font-display text-lg sm:text-xl tracking-wide text-foreground/95 animate-fade-up"
        >
          {STEPS[step].label}
        </p>
        <p
          key={`s-${step}`}
          className="mt-2 text-xs uppercase tracking-[0.32em] text-muted-foreground animate-fade-up"
        >
          {STEPS[step].sub}
        </p>
        <p className="mt-4 text-[10px] tabular-nums tracking-[0.4em] text-muted-foreground/70">
          {String(pct).padStart(2, "0")}%
        </p>
      </div>
    </div>
  );
}
