// Energy is an integer percent, 0–100.
// The analyzer writes that scale. Some older rows stored a 0–1 fraction
// (0.33 meaning 33%). A value strictly between 0 and 1 is that legacy fraction.
// 0 and 1 stay 0% and 1% so a genuinely quiet track is not inflated.

export function toEnergyPercent(value: number | null | undefined, fallback = 0): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  const percent = value > 0 && value < 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(percent)));
}
