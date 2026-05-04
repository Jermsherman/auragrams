import { generateAura, slugify, type PaletteKey, type SourceType, type PitchCenter, type UserColorInfluence } from "./aura";

export type Provider =
  | "spotify"
  | "youtube"
  | "youtube-music"
  | "soundcloud"
  | "apple"
  | "audiomack"
  | "bandcamp"
  | "tidal"
  | "deezer"
  | "amazon"
  | "pandora"
  | "boomplay"
  | "audius"
  | "smartlink"
  | "external";

export type StreamingLinks = {
  spotify?: string;
  apple?: string;
  soundcloud?: string;
};

import type { AuraPalette } from "./aura";

export type Track = {
  id: string;
  title: string;
  artist: string;
  artistHandle: string;
  hasLocalAudio?: boolean;
  /** @deprecated legacy data URLs from older sessions; no longer written. */
  audioDataUrl?: string;
  streamUrl?: string;
  provider?: Provider;
  embedUrl?: string;
  coverDataUrl?: string;
  seed: number;
  createdAt: number;

  // Phase 2
  moods: string[];
  palette: PaletteKey;
  auraName: string;
  energy: number;
  description: string;
  streaming?: StreamingLinks;
  musicalKey?: string;
  tempoBand?: string;
  density?: string;

  // Phase 3 — Aura Engine v3
  paletteName?: string;
  vibeDescription?: string;
  motionKeywords?: string[];
  tonic?: string;
  mode?: "major" | "minor";
  keyDetected?: boolean;
  detectedKey?: string;
  colors?: AuraPalette;

  // Phase 4 — Raw Aura + improved detection
  sourceType?: SourceType;
  pitchCenter?: PitchCenter;
  keyConfidence?: number;
  detectedEnergy?: number;

  // Phase 5 — Color Influence
  userColorInfluence?: UserColorInfluence;
  colorGuided?: boolean;

  // Phase 6 — Influence Aura
  visibilityMode?: "artist" | "username" | "anonymous";
  influenceSettings?: {
    moodTags: string[];
    userColorInfluence: UserColorInfluence;
    vibeNote: string;
    visibilityMode: "artist" | "username" | "anonymous";
    updatedAt: string;
  };

  // Phase 7 — Persistent audio storage
  audioStoragePath?: string;
  audioPublicUrl?: string;
  audioFileName?: string;
  audioMimeType?: string;
  audioSizeBytes?: number;
  audioDurationSeconds?: number;
  uploadStatus?: "pending" | "uploading" | "complete" | "failed";
};

export type ArtistProfile = {
  handle: string;
  name: string;
  bio?: string;
};

const KEY = "auragram:tracks";
const ARTIST_KEY = "auragram:artists";

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // RFC4122 v4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 360;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function readAll(): Record<string, Track> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** Backfill engine fields for older tracks. */
function hydrate(t: Partial<Track> & { id: string; title: string; artist: string }): Track {
  const moods = t.moods ?? [];
  // Always run the engine so v3 fields (colors, vibe, etc) are present.
  const gen = generateAura({
    id: t.id, title: t.title, artist: t.artist, moods,
    detectedKey: t.detectedKey ?? null,
  });
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    artistHandle: t.artistHandle ?? slugify(t.artist),
    hasLocalAudio: t.hasLocalAudio,
    audioDataUrl: t.audioDataUrl,
    streamUrl: t.streamUrl,
    provider: t.provider,
    embedUrl: t.embedUrl,
    coverDataUrl: t.coverDataUrl,
    seed: t.seed ?? seedFromId(t.id),
    createdAt: t.createdAt ?? Date.now(),
    moods,
    palette: (t.palette as PaletteKey) ?? gen.palette,
    auraName: t.auraName ?? gen.auraName,
    energy: t.energy ?? gen.energy,
    description: t.description ?? gen.description,
    streaming: t.streaming,
    musicalKey: t.musicalKey ?? gen.musicalKey,
    tempoBand: t.tempoBand ?? gen.tempoBand,
    density: t.density ?? gen.density,
    paletteName: t.paletteName ?? gen.paletteName,
    vibeDescription: t.vibeDescription ?? gen.vibeDescription,
    motionKeywords: t.motionKeywords ?? gen.motionKeywords,
    tonic: t.tonic ?? gen.tonic,
    mode: t.mode ?? gen.mode,
    keyDetected: t.keyDetected ?? gen.keyDetected,
    detectedKey: t.detectedKey,
    colors: t.colors ?? gen.colors,
    sourceType: t.sourceType,
    pitchCenter: t.pitchCenter,
    keyConfidence: t.keyConfidence,
    detectedEnergy: t.detectedEnergy,
    userColorInfluence: t.userColorInfluence,
    colorGuided: t.colorGuided ?? gen.colorGuided,
    visibilityMode: t.visibilityMode,
    influenceSettings: t.influenceSettings,
    audioStoragePath: t.audioStoragePath,
    audioPublicUrl: t.audioPublicUrl,
    audioFileName: t.audioFileName,
    audioMimeType: t.audioMimeType,
    audioSizeBytes: t.audioSizeBytes,
    audioDurationSeconds: t.audioDurationSeconds,
    uploadStatus: t.uploadStatus,
  };
}

export function saveTrack(t: Track) {
  const all = readAll();
  all[t.id] = t;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getTrack(id: string): Track | null {
  const raw = readAll()[id];
  return raw ? hydrate(raw) : null;
}

export function listTracks(): Track[] {
  return Object.values(readAll())
    .map((t) => hydrate(t))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function listTracksByHandle(handle: string): Track[] {
  return listTracks().filter((t) => t.artistHandle === handle);
}

export function updateTrack(id: string, patch: Partial<Track>) {
  const t = getTrack(id);
  if (!t) return;
  saveTrack({ ...t, ...patch });
}

// ----- Artist profile (bio etc.) -----
function readArtists(): Record<string, ArtistProfile> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ARTIST_KEY) || "{}");
  } catch {
    return {};
  }
}
export function getArtist(handle: string): ArtistProfile | null {
  return readArtists()[handle] ?? null;
}
export function saveArtist(p: ArtistProfile) {
  const all = readArtists();
  all[p.handle] = p;
  localStorage.setItem(ARTIST_KEY, JSON.stringify(all));
}

export type ProviderInfo = {
  provider: Provider;
  platformName: string;
  embedUrl?: string;
};

const PROVIDER_LABELS: Record<Provider, string> = {
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
};

export function providerLabel(p?: Provider | string | null): string {
  if (!p) return "External Link";
  return PROVIDER_LABELS[p as Provider] ?? "External Link";
}

const SMARTLINK_HOSTS = [
  "linkfire.com",
  "lnk.to",
  "ffm.to",
  "fanlink.to",
  "hyperfollow.com",
  "distrokid.com",
  "toneden.io",
  "smarturl.it",
  "solo.to",
  "beacons.ai",
  "linktr.ee",
];

export function detectProvider(url: string): ProviderInfo | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const make = (provider: Provider, embedUrl?: string): ProviderInfo => ({
    provider,
    platformName: PROVIDER_LABELS[provider],
    embedUrl,
  });

  if (host.endsWith("spotify.com")) {
    const m = u.pathname.match(/\/(track|album|episode|playlist|artist)\/([A-Za-z0-9]+)/);
    if (m) {
      return make(
        "spotify",
        `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`,
      );
    }
    return make("spotify");
  }

  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (id) return make("youtube", `https://www.youtube.com/embed/${id}`);
  }
  if (host === "music.youtube.com") {
    const id = u.searchParams.get("v");
    if (id) return make("youtube-music", `https://www.youtube.com/embed/${id}`);
    return make("youtube-music");
  }
  if (host.endsWith("youtube.com")) {
    const id = u.searchParams.get("v");
    if (id) return make("youtube", `https://www.youtube.com/embed/${id}`);
    const m = u.pathname.match(/^\/(embed|shorts)\/([\w-]+)/);
    if (m) return make("youtube", `https://www.youtube.com/embed/${m[2]}`);
    return make("youtube");
  }

  if (host.endsWith("soundcloud.com")) {
    return make(
      "soundcloud",
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        url,
      )}&color=%23a855f7&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`,
    );
  }

  if (host.endsWith("music.apple.com")) {
    return make("apple", url.replace("music.apple.com", "embed.music.apple.com"));
  }

  if (host.endsWith("audiomack.com")) return make("audiomack");
  if (host.endsWith("bandcamp.com")) return make("bandcamp");
  if (host.endsWith("tidal.com")) return make("tidal");
  if (host.endsWith("deezer.com")) return make("deezer");
  if (host.endsWith("music.amazon.com") || host.endsWith("amazon.com"))
    return make("amazon");
  if (host.endsWith("pandora.com")) return make("pandora");
  if (host.endsWith("boomplay.com")) return make("boomplay");
  if (host.endsWith("audius.co")) return make("audius");

  if (SMARTLINK_HOSTS.some((h) => host === h || host.endsWith("." + h))) {
    return make("smartlink");
  }

  return make("external");
}
