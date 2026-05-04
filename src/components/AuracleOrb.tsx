import { Aurascope } from "./Aurascope";
import { getPersonality, type PaletteKey } from "@/lib/aura";

type Member = { palette: PaletteKey; seed: number };

/**
 * Blended "project Aurascope" — Aurascope in dominant palette, with soft conic
 * overlays drawn from member palettes for a curated, multi-aura feeling.
 */
export function AuracleOrb({
  members,
  dominant,
  size = 320,
  className,
}: {
  members: Member[];
  dominant: PaletteKey;
  size?: number | string;
  className?: string;
}) {
  const stops = members
    .slice(0, 5)
    .map((m) => getPersonality(m.palette).glow)
    .filter(Boolean);

  const conic =
    stops.length >= 2
      ? `conic-gradient(from 90deg, ${[...stops, stops[0]].join(", ")})`
      : undefined;

  return (
    <div
      className={"relative grid place-items-center " + (className ?? "")}
      style={{ width: size, height: size }}
    >
      {conic && (
        <div
          aria-hidden
          className="absolute inset-[-6%] rounded-[28%] blur-2xl opacity-50 mix-blend-screen animate-spin-slow"
          style={{ background: conic, animationDuration: "32s" }}
        />
      )}
      <Aurascope
        aura={{ palette: dominant }}
        size="large"
        mode="minimal"
        className="w-full"
        showLabel={false}
      />
    </div>
  );
}
