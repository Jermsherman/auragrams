// Aura Farm: a saved collection of generated auras. Stored in localStorage.
// We never store full audio file blobs here — only metadata.

import type { Track, Provider } from "./tracks";
import type { PaletteKey, AuraPalette, PitchCenter, UserColorInfluence } from "./aura";

export type SourceType = "upload" | "platform_link" | "external_link" | "raw_recording";

export type SavedAura = {
  id: string;
  createdAt: number;
  trackTitle: string;
  artistName: string;
  artistHandle: string;
  sourceType: SourceType;
  platformName?: string;
  platformUrl?: string;
  embedUrl?: string;
  provider?: Provider;
  moodTags: string[];
  auraName: string;
  auraDescription: string;
  energyLevel: number;
  palette: PaletteKey;
  seed: number;
  coverDataUrl?: string;
  musicalKey?: string;
  tempoBand?: string;
  density?: string;
  paletteName?: string;
  vibeDescription?: string;
  motionKeywords?: string[];
  colors?: AuraPalette;
  keyDetected?: boolean;
  pitchCenter?: PitchCenter;
  keyConfidence?: number;
};

const KEY = "auragram_farm_auras";

function read(): Record<string, SavedAura> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(map: Record<string, SavedAura>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getSavedAuras(): SavedAura[] {
  return Object.values(read()).sort((a, b) => b.createdAt - a.createdAt);
}

export function isAuraSaved(id: string): boolean {
  return !!read()[id];
}

export function deleteAura(id: string) {
  const all = read();
  delete all[id];
  write(all);
}

export function saveAuraFromTrack(t: Track): SavedAura {
  const sourceType: SourceType = t.sourceType === "raw_recording"
    ? "raw_recording"
    : t.hasLocalAudio
      ? "upload"
      : t.provider === "external" || !t.provider
        ? t.streamUrl
          ? "external_link"
          : "upload"
        : "platform_link";

  const aura: SavedAura = {
    id: t.id,
    createdAt: Date.now(),
    trackTitle: t.title,
    artistName: t.artist,
    artistHandle: t.artistHandle,
    sourceType,
    platformName:
      t.provider && t.provider !== "external" ? prettyProvider(t.provider) : undefined,
    platformUrl: t.streamUrl,
    embedUrl: t.embedUrl,
    provider: t.provider,
    moodTags: t.moods ?? [],
    auraName: t.auraName,
    auraDescription: t.description,
    energyLevel: t.energy,
    palette: t.palette,
    seed: t.seed,
    coverDataUrl: t.coverDataUrl,
    musicalKey: t.musicalKey,
    tempoBand: t.tempoBand,
    density: t.density,
    paletteName: t.paletteName,
    vibeDescription: t.vibeDescription,
    motionKeywords: t.motionKeywords,
    colors: t.colors,
    keyDetected: t.keyDetected,
    pitchCenter: t.pitchCenter,
    keyConfidence: t.keyConfidence,
  };

  const all = read();
  all[t.id] = aura;
  write(all);
  return aura;
}

function prettyProvider(p: Provider): string {
  return (
    {
      spotify: "Spotify",
      youtube: "YouTube",
      "youtube-music": "YouTube Music",
      soundcloud: "SoundCloud",
      apple: "Apple Music",
      audiomack: "Audiomack",
      bandcamp: "Bandcamp",
      tidal: "Tidal",
      deezer: "Deezer",
      amazon: "Amazon Music",
      pandora: "Pandora",
      boomplay: "Boomplay",
      audius: "Audius",
      smartlink: "Smart Link",
      external: "External Link",
    }[p] ?? "External Link"
  );
}
