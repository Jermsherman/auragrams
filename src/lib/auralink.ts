// AuraLink page data model + localStorage persistence.
// Music-first link page builder: streaming links, social links, custom
// links, selected Auras, and a themed look (preset or custom).

export type AuraLinkMode = "streaming_links" | "auras" | "mixed";
export type AuraLinkThemePreset =
  | "midnight"
  | "sunset"
  | "ocean"
  | "velvet"
  | "minimal"
  | "aurora"
  | "ember"
  | "emerald"
  | "rose"
  | "onyx"
  | "custom";

export type AuraLinkLinkType = "streaming" | "custom" | "aura" | "social";

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

export type AuraLinkStreamingLink = {
  id: string;
  platformName: string; // key from PLATFORMS
  label: string;
  url: string;
  order: number;
  isFeatured?: boolean;
};

export type AuraLinkSocialLink = {
  id: string;
  platformName: string; // key from SOCIAL_PLATFORMS
  label: string;
  url: string;
  order: number;
};

export type AuraLinkCustomLink = {
  id: string;
  label: string;
  url: string;
  order: number;
};

export type AuraLinkBackgroundKind = "preset" | "solid" | "gradient" | "image" | "aura";

export type AuraLinkBackground = {
  kind: AuraLinkBackgroundKind;
  imageUrl?: string;
  auraId?: string;
  gradientAngle?: number;   // 0..360, for gradient mode
  overlayOpacity?: number;  // 0..1, image mode darkening overlay
};

export type AuraLinkButtonShape = "pill" | "rounded" | "square" | "soft" | "outline" | "glass";
export type AuraLinkButtonStyle = "solid" | "outline" | "ghost" | "gradient";
export type AuraLinkSpacing = "compact" | "comfy" | "airy";

export type AuraLinkDecorations = {
  grain?: boolean;
  stars?: boolean;
  bokeh?: boolean;
};

export type AuraLinkSectionKey = "profile" | "socials" | "streaming" | "auras" | "custom";

export type AuraLinkTheme = {
  name: string;
  mode: "preset" | "custom" | "auraMatch";
  preset?: AuraLinkThemePreset;
  /** When mode === "auraMatch", the page palette follows this Aura live. */
  sourceAuraId?: string;
  // Either preset is set, or these custom fields are used:
  backgroundColor?: string;
  primaryAccent?: string;
  secondaryAccent?: string;
  buttonColor?: string;
  glowColor?: string;


  // ---- Deep customization (all optional, backward-compatible) ----
  background?: AuraLinkBackground;
  fontHeading?: string;    // key from FONT_PAIRS
  fontBody?: string;       // key from FONT_PAIRS
  buttonShape?: AuraLinkButtonShape;
  buttonStyle?: AuraLinkButtonStyle;
  spacing?: AuraLinkSpacing;
  decorations?: AuraLinkDecorations;
  sectionOrder?: AuraLinkSectionKey[];
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
  featuredAuraId?: string;

  // New shape — split by purpose.
  streamingLinks: AuraLinkStreamingLink[];
  socialLinks: AuraLinkSocialLink[];
  customLinks: AuraLinkCustomLink[];

  /** @deprecated kept for backward compatibility with v1 pages. */
  links?: AuraLinkLink[];

  // Theme can be a string (legacy preset key) or full theme object.
  theme: AuraLinkTheme | AuraLinkThemePreset;

  visibility: "public" | "unlisted";
  publicUrl?: string;

  // SEO & social sharing (optional — fall back to derived defaults).
  seoTitle?: string;
  seoDescription?: string;
  socialPreviewImage?: string;
};

const KEY = "auragram_auralinks";

function read(): Record<string, AuraLinkPage> {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    // Migrate legacy entries on read.
    const out: Record<string, AuraLinkPage> = {};
    for (const id of Object.keys(raw)) {
      out[id] = migratePage(raw[id]);
    }
    return out;
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

/** Coerce legacy {links: [...]} pages into the split shape. */
export function migratePage(p: AuraLinkPage): AuraLinkPage {
  const next: AuraLinkPage = {
    ...p,
    streamingLinks: p.streamingLinks ?? [],
    socialLinks: p.socialLinks ?? [],
    customLinks: p.customLinks ?? [],
  };
  if ((!next.streamingLinks.length && !next.customLinks.length) && Array.isArray(p.links)) {
    let i = 0;
    let j = 0;
    for (const l of p.links) {
      if (l.type === "streaming") {
        next.streamingLinks.push({
          id: l.id,
          platformName: l.platformName ?? "other",
          label: l.label,
          url: l.url ?? "",
          order: i++,
          isFeatured: l.isFeatured,
        });
      } else if (l.type === "custom") {
        next.customLinks.push({
          id: l.id,
          label: l.label,
          url: l.url ?? "",
          order: j++,
        });
      }
    }
  }
  return next;
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
  if (page.profileImageUrl && page.profileImageUrl.startsWith("data:")) {
    throw new Error(
      "Cover image must be uploaded — data URLs are not supported.",
    );
  }
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

// ------- Streaming platform catalog -------
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
  { key: "presave", label: "Presave" },
  { key: "website", label: "Website" },
  { key: "merch", label: "Merch" },
  { key: "tickets", label: "Tickets" },
  { key: "other", label: "Other" },
];

export function platformLabel(key?: string): string {
  if (!key) return "Link";
  return PLATFORMS.find((p) => p.key === key)?.label ?? key;
}

// ------- Social platform catalog -------
export type SocialPlatformDef = {
  key: string;
  label: string;
  hint?: string;
};

export const SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  { key: "instagram", label: "Instagram", hint: "https://instagram.com/…" },
  { key: "tiktok", label: "TikTok", hint: "https://tiktok.com/@…" },
  { key: "youtube", label: "YouTube", hint: "https://youtube.com/…" },
  { key: "x", label: "X / Twitter", hint: "https://x.com/…" },
  { key: "facebook", label: "Facebook", hint: "https://facebook.com/…" },
  { key: "threads", label: "Threads", hint: "https://threads.net/@…" },
  { key: "twitch", label: "Twitch", hint: "https://twitch.tv/…" },
  { key: "discord", label: "Discord", hint: "https://discord.gg/…" },
  { key: "snapchat", label: "Snapchat", hint: "https://snapchat.com/add/…" },
  { key: "website", label: "Website", hint: "https://…" },
  { key: "email", label: "Email", hint: "you@domain.com" },
  { key: "other", label: "Other" },
];

export function socialPlatformLabel(key?: string): string {
  if (!key) return "Social";
  return SOCIAL_PLATFORMS.find((p) => p.key === key)?.label ?? key;
}

// ------- Themes -------
export type ThemeDef = {
  key: AuraLinkThemePreset;
  name: string;
  bg: string;
  accent: string;
  buttonBg: string;
  glow: string;
};

export const PRESET_THEMES: Record<Exclude<AuraLinkThemePreset, "custom">, ThemeDef> = {
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
  aurora: {
    key: "aurora",
    name: "Aurora Drift",
    bg: "radial-gradient(ellipse at top, oklch(0.55 0.2 160) 0%, oklch(0.3 0.14 220) 55%, oklch(0.1 0.05 270) 100%)",
    accent: "oklch(0.92 0.18 170)",
    buttonBg: "oklch(0.2 0.08 200 / 0.7)",
    glow: "0 0 55px -8px oklch(0.75 0.22 170 / 0.7)",
  },
  ember: {
    key: "ember",
    name: "Ember Smoke",
    bg: "radial-gradient(ellipse at top, oklch(0.45 0.2 40) 0%, oklch(0.2 0.08 30) 55%, oklch(0.1 0.03 25) 100%)",
    accent: "oklch(0.88 0.16 50)",
    buttonBg: "oklch(0.2 0.06 30 / 0.7)",
    glow: "0 0 50px -8px oklch(0.7 0.22 40 / 0.75)",
  },
  emerald: {
    key: "emerald",
    name: "Emerald Hour",
    bg: "radial-gradient(ellipse at top, oklch(0.4 0.18 150) 0%, oklch(0.18 0.08 160) 55%, oklch(0.08 0.04 170) 100%)",
    accent: "oklch(0.9 0.18 150)",
    buttonBg: "oklch(0.18 0.06 155 / 0.7)",
    glow: "0 0 50px -10px oklch(0.7 0.22 150 / 0.7)",
  },
  rose: {
    key: "rose",
    name: "Rose Quartz",
    bg: "radial-gradient(ellipse at top, oklch(0.6 0.18 10) 0%, oklch(0.3 0.1 350) 55%, oklch(0.14 0.05 340) 100%)",
    accent: "oklch(0.92 0.16 15)",
    buttonBg: "oklch(0.24 0.08 5 / 0.7)",
    glow: "0 0 55px -10px oklch(0.78 0.2 10 / 0.75)",
  },
  onyx: {
    key: "onyx",
    name: "Onyx Bloom",
    bg: "radial-gradient(ellipse at top, oklch(0.22 0.06 290) 0%, oklch(0.1 0.03 280) 60%, oklch(0.05 0.01 270) 100%)",
    accent: "oklch(0.85 0.15 295)",
    buttonBg: "oklch(0.16 0.04 285 / 0.7)",
    glow: "0 0 45px -10px oklch(0.65 0.18 295 / 0.6)",
  },
};

/** Backward-compatible map (some older imports use THEMES[key]). */
export const THEMES = {
  ...PRESET_THEMES,
} as Record<string, ThemeDef>;

export const THEME_LIST: ThemeDef[] = [
  PRESET_THEMES.midnight,
  PRESET_THEMES.sunset,
  PRESET_THEMES.ocean,
  PRESET_THEMES.velvet,
  PRESET_THEMES.aurora,
  PRESET_THEMES.ember,
  PRESET_THEMES.emerald,
  PRESET_THEMES.rose,
  PRESET_THEMES.onyx,
  PRESET_THEMES.minimal,
];

export const DEFAULT_CUSTOM_THEME: AuraLinkTheme = {
  name: "Custom",
  mode: "custom",
  backgroundColor: "#0F0A1A",
  primaryAccent: "#E0AAFF",
  secondaryAccent: "#7C8AFF",
  buttonColor: "#1A1430",
  glowColor: "#A86BC8",
};

/** Resolve any theme value (legacy preset string or full object) into a ThemeDef.
 *  The returned object also carries any "deep customization" fields the caller set,
 *  so the renderer can read them in one place. */
export function resolveTheme(t: AuraLinkPage["theme"] | undefined): ThemeDef & {
  extras: Pick<
    AuraLinkTheme,
    | "background"
    | "fontHeading"
    | "fontBody"
    | "buttonShape"
    | "buttonStyle"
    | "spacing"
    | "decorations"
    | "sectionOrder"
  >;
} {
  const blankExtras = {};
  if (!t) return { ...PRESET_THEMES.midnight, extras: blankExtras };
  if (typeof t === "string") {
    return { ...(PRESET_THEMES[t as keyof typeof PRESET_THEMES] ?? PRESET_THEMES.midnight), extras: blankExtras };
  }
  const extras = {
    background: t.background,
    fontHeading: t.fontHeading,
    fontBody: t.fontBody,
    buttonShape: t.buttonShape,
    buttonStyle: t.buttonStyle,
    spacing: t.spacing,
    decorations: t.decorations,
    sectionOrder: t.sectionOrder,
  };
  if (t.mode === "preset" && t.preset && t.preset !== "custom") {
    return { ...(PRESET_THEMES[t.preset] ?? PRESET_THEMES.midnight), extras };
  }
  const bg = t.backgroundColor || DEFAULT_CUSTOM_THEME.backgroundColor!;
  const accent = t.primaryAccent || DEFAULT_CUSTOM_THEME.primaryAccent!;
  const button = t.buttonColor || DEFAULT_CUSTOM_THEME.buttonColor!;
  const glow = t.glowColor || DEFAULT_CUSTOM_THEME.glowColor!;
  return {
    key: "custom",
    name: t.name || "Custom",
    bg: `radial-gradient(ellipse at top, ${accent}33 0%, ${bg} 65%, ${bg} 100%)`,
    accent,
    buttonBg: `${button}B3`,
    glow: `0 0 50px -10px ${glow}AA`,
    extras,
  };
  
}

// ------- Font pairs catalog -------
// Lightweight Google-Fonts-only pairs. Body falls back to system if undefined.
export type FontPair = {
  key: string;
  label: string;
  heading: string;   // Google Fonts family name
  body: string;
  /** Comma-separated Google Fonts URL query value, e.g. "Space+Grotesk:wght@500;700" */
  load: string;
};

export const FONT_PAIRS: FontPair[] = [
  { key: "default", label: "Default", heading: "", body: "", load: "" },
  { key: "space-grotesk-dm-sans", label: "Modern Tech", heading: "Space Grotesk", body: "DM Sans", load: "Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500" },
  { key: "syne-jakarta", label: "Creative", heading: "Syne", body: "Plus Jakarta Sans", load: "Syne:wght@600;800&family=Plus+Jakarta+Sans:wght@400;500" },
  { key: "instrument-work-sans", label: "Editorial", heading: "Instrument Serif", body: "Work Sans", load: "Instrument+Serif&family=Work+Sans:wght@400;500" },
  { key: "dm-serif-fira", label: "Brand", heading: "DM Serif Display", body: "Fira Sans", load: "DM+Serif+Display&family=Fira+Sans:wght@400;500" },
  { key: "cormorant-karla", label: "Luxury", heading: "Cormorant Garamond", body: "Karla", load: "Cormorant+Garamond:wght@500;700&family=Karla:wght@400;500" },
  { key: "bebas-barlow", label: "Bold Sport", heading: "Bebas Neue", body: "Barlow", load: "Bebas+Neue&family=Barlow:wght@400;500" },
  { key: "archivo-hind", label: "Activist", heading: "Archivo Black", body: "Hind", load: "Archivo+Black&family=Hind:wght@400;500" },
  { key: "abril-cabin", label: "Portfolio", heading: "Abril Fatface", body: "Cabin", load: "Abril+Fatface&family=Cabin:wght@400;500" },
  { key: "jetbrains-work", label: "Dev", heading: "JetBrains Mono", body: "Work Sans", load: "JetBrains+Mono:wght@500;700&family=Work+Sans:wght@400;500" },
  { key: "space-mono-rubik", label: "Indie", heading: "Space Mono", body: "Rubik", load: "Space+Mono:wght@700&family=Rubik:wght@400;500" },
  { key: "lora-nunito", label: "Blog", heading: "Lora", body: "Nunito Sans", load: "Lora:wght@500;700&family=Nunito+Sans:wght@400;500" },
];

export function getFontPair(key: string | undefined): FontPair {
  return FONT_PAIRS.find((p) => p.key === key) ?? FONT_PAIRS[0];
}

export const DEFAULT_SECTION_ORDER: AuraLinkSectionKey[] = [
  "profile",
  "socials",
  "streaming",
  "auras",
  "custom",
];

export function buttonShapeClass(s: AuraLinkButtonShape | undefined): string {
  switch (s) {
    case "rounded": return "rounded-2xl";
    case "square": return "rounded-md";
    case "soft": return "rounded-3xl";
    case "outline": return "rounded-2xl";
    case "glass": return "rounded-2xl backdrop-blur-xl";
    case "pill":
    default:
      return "rounded-full";
  }
}

export function buttonStyleStyle(
  style: AuraLinkButtonStyle | undefined,
  themeButtonBg: string,
  themeAccent: string,
): import("react").CSSProperties {
  switch (style) {
    case "outline":
      return { background: "transparent", border: `1px solid ${themeAccent}55`, color: themeAccent };
    case "ghost":
      return { background: "transparent", color: themeAccent };
    case "gradient":
      return {
        background: `linear-gradient(135deg, ${themeAccent}33, ${themeButtonBg})`,
        color: themeAccent,
      };
    case "solid":
    default:
      return { background: themeButtonBg, color: themeAccent };
  }
}

export function spacingClass(s: AuraLinkSpacing | undefined): string {
  switch (s) {
    case "compact": return "py-6 gap-2";
    case "airy": return "py-16 gap-5";
    case "comfy":
    default:
      return "py-12 gap-3";
  }
}
