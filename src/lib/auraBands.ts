// Per-Aura configuration for the reactive "bands" drawn on the orb canvas.

export type BandKey = "waveform" | "bass" | "radar" | "vocal";
export type BandIntensity = "subtle" | "normal" | "bold";
export type VocalShape = "core" | "equator";

export type BandSetting = {
  enabled: boolean;
  /** "auto" = derive from the aura palette. Otherwise a css color string. */
  color: string;
  intensity: BandIntensity;
};

export type BandsConfig = {
  waveform: BandSetting;
  bass: BandSetting;
  radar: BandSetting;
  vocal: BandSetting;
  vocalShape: VocalShape;
};

const band = (over: Partial<BandSetting> = {}): BandSetting => ({
  enabled: true,
  color: "auto",
  intensity: "normal",
  ...over,
});

/** Defaults for newly created Auras — vocal band renders as a centered core. */
export const DEFAULT_BANDS: BandsConfig = {
  waveform: band(),
  bass: band(),
  radar: band(),
  vocal: band(),
  vocalShape: "core",
};

/** Legacy behaviour for Auras saved before bands were configurable. */
export const LEGACY_BANDS: BandsConfig = {
  ...DEFAULT_BANDS,
  vocalShape: "equator",
};

export const BAND_LABELS: Record<BandKey, string> = {
  waveform: "Waveform ring",
  bass: "Bass halo",
  radar: "Radar rings",
  vocal: "Vocal band",
};

export const BAND_HINTS: Record<BandKey, string> = {
  waveform: "Full mix — traces the live waveform around the sphere",
  bass: "Low end below 200 Hz — a slow, wide swell on the kick",
  radar: "Beat onsets — a ring pings outward on each transient",
  vocal: "Voice range 200 Hz - 4 kHz, with the low end ducked out",
};

export const BAND_ORDER: BandKey[] = ["waveform", "bass", "radar", "vocal"];

const INTENSITY_GAIN: Record<BandIntensity, { alpha: number; width: number; glow: number }> = {
  subtle: { alpha: 0.55, width: 0.7, glow: 0.5 },
  normal: { alpha: 1, width: 1, glow: 1 },
  bold: { alpha: 1.45, width: 1.5, glow: 1.6 },
};

export function bandGain(intensity: BandIntensity) {
  return INTENSITY_GAIN[intensity] ?? INTENSITY_GAIN.normal;
}

function isBandSetting(v: unknown): v is Partial<BandSetting> {
  return !!v && typeof v === "object";
}

/**
 * Normalise anything read from storage into a full BandsConfig.
 * `undefined`/`null` means the Aura predates this feature → legacy look.
 */
export function resolveBands(raw: unknown, fallback: BandsConfig = LEGACY_BANDS): BandsConfig {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Partial<Record<BandKey, unknown>> & { vocalShape?: unknown };
  const pick = (k: BandKey): BandSetting => {
    const v = r[k];
    if (!isBandSetting(v)) return fallback[k];
    return {
      enabled: v.enabled !== false,
      color: typeof v.color === "string" && v.color ? v.color : "auto",
      intensity:
        v.intensity === "subtle" || v.intensity === "bold" || v.intensity === "normal"
          ? v.intensity
          : "normal",
    };
  };
  return {
    waveform: pick("waveform"),
    bass: pick("bass"),
    radar: pick("radar"),
    vocal: pick("vocal"),
    vocalShape: r.vocalShape === "equator" ? "equator" : r.vocalShape === "core" ? "core" : fallback.vocalShape,
  };
}
