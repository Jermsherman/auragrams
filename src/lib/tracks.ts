import { generateAura, paletteFromMoods, slugify, type PaletteKey } from "./aura";

export type Provider = "spotify" | "youtube" | "soundcloud" | "apple" | "other";

export type StreamingLinks = {
  spotify?: string;
  apple?: string;
  soundcloud?: string;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  artistHandle: string;
  // File-based source (data URL)
  audioDataUrl?: string;
  // Streaming-link source
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
};

export type ArtistProfile = {
  handle: string;
  name: string;
  bio?: string;
};

const KEY = "auragram:tracks";
const ARTIST_KEY = "auragram:artists";

export function makeId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
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

/** Backfill Phase-2 fields for tracks created in Phase 1. */
function hydrate(t: Partial<Track> & { id: string; title: string; artist: string }): Track {
  const moods = t.moods ?? [];
  const palette = (t.palette as PaletteKey) ?? paletteFromMoods(moods);
  const gen =
    t.auraName && t.description
      ? null
      : generateAura({ id: t.id, title: t.title, artist: t.artist, moods });
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    artistHandle: t.artistHandle ?? slugify(t.artist),
    audioDataUrl: t.audioDataUrl,
    streamUrl: t.streamUrl,
    provider: t.provider,
    embedUrl: t.embedUrl,
    coverDataUrl: t.coverDataUrl,
    seed: t.seed ?? seedFromId(t.id),
    createdAt: t.createdAt ?? Date.now(),
    moods,
    palette,
    auraName: t.auraName ?? gen!.auraName,
    energy: t.energy ?? gen!.energy,
    description: t.description ?? gen!.description,
    streaming: t.streaming,
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

export function detectProvider(url: string): { provider: Provider; embedUrl?: string } | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");

  if (host.endsWith("spotify.com")) {
    const m = u.pathname.match(/\/(track|album|episode|playlist)\/([A-Za-z0-9]+)/);
    if (m) {
      return {
        provider: "spotify",
        embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`,
      };
    }
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (id) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
  }
  if (host.endsWith("youtube.com")) {
    const id = u.searchParams.get("v");
    if (id) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
    const m = u.pathname.match(/^\/(embed|shorts)\/([\w-]+)/);
    if (m) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${m[2]}` };
  }
  if (host.endsWith("soundcloud.com")) {
    return {
      provider: "soundcloud",
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        url,
      )}&color=%23a855f7&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`,
    };
  }
  if (host.endsWith("music.apple.com")) {
    return { provider: "apple", embedUrl: url.replace("music.apple.com", "embed.music.apple.com") };
  }
  return { provider: "other" };
}
