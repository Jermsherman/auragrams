// AuraLink page data model + localStorage persistence.
// Structured so it can migrate to a Supabase `auralinks` table later
// without changing call sites.

export type AuraLinkMode = "streaming_links" | "auras" | "mixed";
export type AuraLinkTheme =
  | "midnight"
  | "sunset"
  | "ocean"
  | "velvet"
  | "minimal";

export type AuraLinkLinkType = "streaming" | "custom" | "aura";

export type AuraLinkLink = {
  id: string;
  type: AuraLinkLinkType;
  platformName?: string;
  label: string;
  url?: string;
  auraId?: string;
  order: number;
  icon?: string;
  isFeatured?: boolean;
};

export type AuraLinkPage = {
  id: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  artistName: string;
  handleSlug: string;
  description?: string;
  profileImageUrl?: string;
  mode: AuraLinkMode;
  selectedAuraIds: string[];
  links: AuraLinkLink[];
  theme: AuraLinkTheme;
  visibility: "public" | "unlisted";
  publicUrl?: string;
};

const KEY = "auragram_auralinks";

function read(): Record<string, AuraLinkPage> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function write(map: Record<string, AuraLinkPage>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch (e: unknown) {
    const err = e as { name?: string };
    if (err?.name === "QuotaExceededError") {
      throw new Error(
        "Local storage is full. Try a smaller cover image or remove old AuraLinks.",
      );
    }
    throw e as Error;
  }
}

export function getAuraLinks(): AuraLinkPage[] {
  return Object.values(read()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getAuraLink(id: string): AuraLinkPage | null {
  return read()[id] ?? null;
}

export function getAuraLinkBySlug(slug: string): AuraLinkPage | null {
  const all = read();
  return Object.values(all).find((p) => p.handleSlug === slug) ?? null;
}

export function saveAuraLink(page: AuraLinkPage) {
  const all = read();
  all[page.id] = { ...page, updatedAt: Date.now() };
  write(all);
  return all[page.id];
}

export function updateAuraLink(
  id: string,
  patch: Partial<AuraLinkPage>,
): AuraLinkPage | null {
  const all = read();
  const cur = all[id];
  if (!cur) return null;
  const next: AuraLinkPage = { ...cur, ...patch, updatedAt: Date.now() };
  all[id] = next;
  write(all);
  return next;
}

export function deleteAuraLink(id: string) {
  const all = read();
  delete all[id];
  write(all);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48) || "link";
}

export function ensureUniqueSlug(base: string, ignoreId?: string): string {
  const all = read();
  const taken = new Set(
    Object.values(all)
      .filter((p) => p.id !== ignoreId)
      .map((p) => p.handleSlug),
  );
  let s = base;
  let i = 2;
  while (taken.has(s)) {
    s = `${base}-${i++}`;
  }
  return s;
}

export function newAuraLinkId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

// ------- Platform catalog -------
export type PlatformDef = {
  key: string;
  label: string;
  hint?: string;
};

export const PLATFORMS: PlatformDef[] = [
  { key: "spotify", label: "Spotify", hint: "https://open.spotify.com/…" },
  { key: "apple", label: "Apple Music", hint: "https://music.apple.com/…" },
  { key: "soundcloud", label: "SoundCloud", hint: "https://soundcloud.com/…" },
  { key: "youtube", label: "YouTube", hint: "https://youtube.com/…" },
  { key: "youtube-music", label: "YouTube Music", hint: "https://music.youtube.com/…" },
  { key: "bandcamp", label: "Bandcamp", hint: "https://…bandcamp.com/…" },
  { key: "audiomack", label: "Audiomack", hint: "https://audiomack.com/…" },
  { key: "tidal", label: "Tidal", hint: "https://tidal.com/…" },
  { key: "deezer", label: "Deezer", hint: "https://deezer.com/…" },
  { key: "amazon", label: "Amazon Music", hint: "https://music.amazon.com/…" },
  { key: "pandora", label: "Pandora", hint: "https://pandora.com/…" },
  { key: "boomplay", label: "Boomplay", hint: "https://boomplay.com/…" },
  { key: "audius", label: "Audius", hint: "https://audius.co/…" },
  { key: "website", label: "Website" },
  { key: "merch", label: "Merch" },
  { key: "tickets", label: "Tickets" },
  { key: "presave", label: "Presave" },
  { key: "other", label: "Other" },
];

export function platformLabel(key?: string): string {
  if (!key) return "Link";
  return PLATFORMS.find((p) => p.key === key)?.label ?? key;
}

// ------- Themes -------
export type ThemeDef = {
  key: AuraLinkTheme;
  name: string;
  bg: string; // CSS background
  accent: string; // primary text/accent color
  buttonBg: string;
  glow: string;
};

export const THEMES: Record<AuraLinkTheme, ThemeDef> = {
  midnight: {
    key: "midnight",
    name: "Midnight Glass",
    bg: "radial-gradient(ellipse at top, oklch(0.28 0.08 280) 0%, oklch(0.12 0.04 270) 60%, oklch(0.08 0.02 260) 100%)",
    accent: "oklch(0.85 0.15 290)",
    buttonBg: "oklch(0.18 0.04 270 / 0.7)",
    glow: "0 0 40px -10px oklch(0.7 0.2 290 / 0.6)",
  },
  sunset: {
    key: "sunset",
    name: "Sunset Pulse",
    bg: "radial-gradient(ellipse at top, oklch(0.55 0.22 30) 0%, oklch(0.25 0.12 350) 55%, oklch(0.12 0.05 320) 100%)",
    accent: "oklch(0.92 0.18 60)",
    buttonBg: "oklch(0.22 0.08 20 / 0.65)",
    glow: "0 0 50px -8px oklch(0.7 0.22 30 / 0.7)",
  },
  ocean: {
    key: "ocean",
    name: "Ocean Glow",
    bg: "radial-gradient(ellipse at top, oklch(0.45 0.18 220) 0%, oklch(0.18 0.08 240) 60%, oklch(0.08 0.04 250) 100%)",
    accent: "oklch(0.88 0.16 200)",
    buttonBg: "oklch(0.18 0.06 230 / 0.7)",
    glow: "0 0 50px -10px oklch(0.65 0.2 220 / 0.7)",
  },
  velvet: {
    key: "velvet",
    name: "Velvet Neon",
    bg: "radial-gradient(ellipse at top, oklch(0.4 0.25 320) 0%, oklch(0.2 0.12 300) 55%, oklch(0.1 0.05 290) 100%)",
    accent: "oklch(0.9 0.22 320)",
    buttonBg: "oklch(0.2 0.1 310 / 0.7)",
    glow: "0 0 60px -8px oklch(0.75 0.25 320 / 0.8)",
  },
  minimal: {
    key: "minimal",
    name: "Minimal Dark",
    bg: "linear-gradient(180deg, oklch(0.12 0 0), oklch(0.08 0 0))",
    accent: "oklch(0.95 0 0)",
    buttonBg: "oklch(0.2 0 0 / 0.65)",
    glow: "0 0 30px -12px oklch(0.6 0 0 / 0.5)",
  },
};

export const THEME_LIST: ThemeDef[] = [
  THEMES.midnight,
  THEMES.sunset,
  THEMES.ocean,
  THEMES.velvet,
  THEMES.minimal,
];
