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
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      <div
        className="aura-ambient-field absolute rounded-full"
        style={{
          top: "-30%",
          left: "-20%",
          width: "90vmax",
          height: "90vmax",
          background: `radial-gradient(circle, ${p.atmosphere}, transparent 65%)`,
          filter: "blur(90px)",
          opacity: 0.62,
        }}
      />
      <div
        className="aura-ambient-field aura-ambient-field-slow absolute rounded-full"
        style={{
          bottom: "-30%",
          right: "-25%",
          width: "100vmax",
          height: "100vmax",
          background: `radial-gradient(circle, ${p.glow}, transparent 65%)`,
          filter: "blur(110px)",
          opacity: 0.45,
        }}
      />
      <div
        className="aura-ambient-field absolute rounded-full"
        style={{
          top: "32%",
          right: "6%",
          width: "54vmax",
          height: "54vmax",
          background: `radial-gradient(circle, ${p.stops[2]}, transparent 68%)`,
          filter: "blur(120px)",
          opacity: 0.1,
          animationDuration: "42s",
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
