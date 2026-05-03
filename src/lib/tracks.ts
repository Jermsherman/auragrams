export type Track = {
  id: string;
  title: string;
  artist: string;
  audioDataUrl: string;
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
