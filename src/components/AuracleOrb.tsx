import { OrbVisual } from "./OrbVisual";
import { getPersonality, type PaletteKey } from "@/lib/aura";

type Member = { palette: PaletteKey; seed: number };

/**
 * Blended "project orb" — base orb in dominant palette, with soft conic
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
          className="absolute inset-0 rounded-full blur-2xl opacity-60 mix-blend-screen animate-spin-slow"
          style={{ background: conic, animationDuration: "32s" }}
        />
      )}
      <OrbVisual
        size="86%"
        palette={dominant}
        particles={true}
        className="animate-breathe"
      />
      {/* faint rim */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow: "inset 0 0 60px oklch(1 0 0 / 0.06)",
        }}
      />
    </div>
  );
}
