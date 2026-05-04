import { getPersonality, type AuraPersonality, type MoodKey } from "@/lib/aura";

type Props = {
  personality?: AuraPersonality | MoodKey | string;
  className?: string;
};

/**
 * Full-bleed ambient atmosphere placed behind the orb. Two oversized
 * blurred radial gradients drift slowly to give the page a "scene".
 */
export function AuraAtmosphere({ personality, className = "" }: Props) {
  const p: AuraPersonality =
    typeof personality === "object" && personality
      ? personality
      : getPersonality(personality as string | undefined);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      <div
        className="absolute"
        style={{
          top: "-30%",
          left: "-20%",
          width: "90vmax",
          height: "90vmax",
          background: `radial-gradient(circle, ${p.atmosphere}, transparent 65%)`,
          filter: "blur(60px)",
          animation: "atmosphere-drift 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: "-30%",
          right: "-25%",
          width: "100vmax",
          height: "100vmax",
          background: `radial-gradient(circle, ${p.glow}, transparent 65%)`,
          filter: "blur(80px)",
          opacity: 0.7,
          animation: "atmosphere-drift 28s ease-in-out infinite reverse",
        }}
      />
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, oklch(0.08 0.02 290 / 0.6) 100%)",
        }}
      />
    </div>
  );
}
