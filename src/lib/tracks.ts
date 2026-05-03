export type Provider = "spotify" | "youtube" | "soundcloud" | "apple" | "other";

export type Track = {
  id: string;
  title: string;
  artist: string;
  // File-based source (data URL)
  audioDataUrl?: string;
  // Streaming link source
  streamUrl?: string;
  provider?: Provider;
  embedUrl?: string;
  coverDataUrl?: string;
  seed: number;
  createdAt: number;
};

const KEY = "auragram:tracks";

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

export function saveTrack(t: Track) {
  const all = readAll();
  all[t.id] = t;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getTrack(id: string): Track | null {
  return readAll()[id] ?? null;
}

export function detectProvider(url: string): { provider: Provider; embedUrl?: string } | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");

  // Spotify: open.spotify.com/track/<id> → embed at /embed/track/<id>
  if (host.endsWith("spotify.com")) {
    const m = u.pathname.match(/\/(track|album|episode|playlist)\/([A-Za-z0-9]+)/);
    if (m) {
      return {
        provider: "spotify",
        embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`,
      };
    }
  }

  // YouTube
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

  // SoundCloud — use widget API
  if (host.endsWith("soundcloud.com")) {
    return {
      provider: "soundcloud",
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        url,
      )}&color=%23a855f7&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`,
    };
  }

  // Apple Music — embed.music.apple.com
  if (host.endsWith("music.apple.com")) {
    const embed = url.replace("music.apple.com", "embed.music.apple.com");
    return { provider: "apple", embedUrl: embed };
  }

  return { provider: "other" };
}
