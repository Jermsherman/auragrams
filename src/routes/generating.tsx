import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OrbVisual } from "@/components/OrbVisual";
import { Logo } from "@/components/Logo";
import { z } from "zod";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/generating")({
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [{ title: "Creating your aura…" }],
  }),
  component: GeneratingPage,
});

const MESSAGES = [
  "Analyzing your sound…",
  "Mapping motion, color, and energy…",
  "Creating your aura…",
];

function GeneratingPage() {
  const { id } = Route.useSearch();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const tA = setTimeout(() => setStep(1), 1100);
    const tB = setTimeout(() => setStep(2), 2200);
    const tGo = setTimeout(() => {
      if (id) nav({ to: "/aura/$id", params: { id } });
      else nav({ to: "/" });
    }, 3300);
    return () => {
      clearTimeout(tA);
      clearTimeout(tB);
      clearTimeout(tGo);
    };
  }, [id, nav]);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6">
      <div className="absolute top-6 left-6 opacity-80">
        <Logo />
      </div>

      <div className="relative grid place-items-center">
        <OrbVisual size="min(80vw, 420px)" />
        {/* particles */}
        <div className="pointer-events-none absolute inset-0">
          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-foreground/60 animate-float-y"
              style={{
                top: `${50 + Math.sin(i) * 38}%`,
                left: `${50 + Math.cos(i * 1.7) * 42}%`,
                animationDelay: `${(i % 7) * 0.3}s`,
                opacity: 0.4 + (i % 5) * 0.1,
                filter: "blur(0.5px)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-12 text-center min-h-[3rem]">
        <p
          key={step}
          className="font-display text-lg sm:text-xl tracking-wide text-foreground/90 animate-fade-up"
        >
          {MESSAGES[step]}
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.32em] text-muted-foreground">
          A living identity is forming
        </p>
      </div>
    </div>
  );
}
