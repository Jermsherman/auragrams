// Public-facing AuraLink renderer. Used by both the builder live preview
// and the public /l/$slug page.

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Sparkles } from "lucide-react";
import { Aurascope } from "./Aurascope";
import { Logo } from "./Logo";
import { AuraLinkAuraCard } from "./AuraLinkAuraCard";
import {
  resolveTheme,
  platformLabel,
  socialPlatformLabel,
  getFontPair,
  buttonShapeClass,
  buttonStyleStyle,
  spacingClass,
  DEFAULT_SECTION_ORDER,
  type AuraLinkPage,
  type AuraLinkSectionKey,
} from "@/lib/auralink";
import type { SavedAura } from "@/lib/farm";

type Props = {
  page: AuraLinkPage;
  auras: SavedAura[];
  showLogo?: boolean;
  className?: string;
};

// Inject Google Fonts <link>s for the chosen font pair (once per pair).
const loadedFontKeys = new Set<string>();
function ensureFontPair(loadParam: string, key: string) {
  if (typeof document === "undefined" || !loadParam) return;
  if (loadedFontKeys.has(key)) return;
  loadedFontKeys.add(key);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${loadParam}&display=swap`;
  link.setAttribute("data-auralink-font", key);
  document.head.appendChild(link);
}

export function AuraLinkView({ page, auras, showLogo = true, className }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const theme = resolveTheme(page.theme);
  const extras = theme.extras;
  const featured = auras.find((a) => a.id === (page.featuredAuraId ?? page.selectedAuraIds[0]));

  // Load fonts
  const headingPair = getFontPair(extras.fontHeading);
  const bodyPair = getFontPair(extras.fontBody ?? extras.fontHeading);
  useEffect(() => {
    if (headingPair.load) ensureFontPair(headingPair.load, headingPair.key);
    if (bodyPair.key !== headingPair.key && bodyPair.load) ensureFontPair(bodyPair.load, bodyPair.key);
  }, [headingPair.key, headingPair.load, bodyPair.key, bodyPair.load]);

  const headingFont = headingPair.heading ? `"${headingPair.heading}", sans-serif` : undefined;
  const bodyFont = bodyPair.body ? `"${bodyPair.body}", sans-serif` : undefined;

  // Background resolution
  const bg = extras.background;
  const backgroundAura = bg?.kind === "aura" && bg.auraId
    ? auras.find((a) => a.id === bg.auraId) ?? null
    : null;

  const containerStyle: React.CSSProperties = useMemo(() => {
    if (!bg || bg.kind === "preset") {
      return { background: theme.bg, color: theme.accent };
    }
    if (bg.kind === "solid") {
      return { background: theme.bg.includes("gradient") ? undefined : theme.bg, backgroundColor: undefined, color: theme.accent };
    }
    if (bg.kind === "gradient") {
      const angle = bg.gradientAngle ?? 135;
      return {
        background: `linear-gradient(${angle}deg, ${theme.bg.includes("gradient") ? theme.accent + "22" : theme.bg}, ${theme.buttonBg})`,
        color: theme.accent,
      };
    }
    if (bg.kind === "image" && bg.imageUrl) {
      return {
        backgroundImage: `url(${bg.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: theme.accent,
      };
    }
    // aura kind handled by overlay below
    return { background: theme.bg, color: theme.accent };
  }, [bg, theme.bg, theme.accent, theme.buttonBg]);

  const overlayOpacity = bg?.kind === "image" ? (bg.overlayOpacity ?? 0.45) : 0;

  // Sort items by order, derive aura links from selectedAuraIds in order
  const auraEntries = page.selectedAuraIds
    .map((id) => auras.find((a) => a.id === id))
    .filter(Boolean) as SavedAura[];

  const streamingEntries = [...(page.streamingLinks ?? [])].sort((a, b) => a.order - b.order);
  const customEntries = [...(page.customLinks ?? [])].sort((a, b) => a.order - b.order);
  const socialEntries = [...(page.socialLinks ?? [])].sort((a, b) => a.order - b.order);
  const linkEntries = [
    ...streamingEntries.map((l) => ({ id: l.id, kind: "streaming" as const, label: l.label, url: l.url, platformName: l.platformName })),
    ...customEntries.map((l) => ({ id: l.id, kind: "custom" as const, label: l.label, url: l.url, platformName: undefined })),
  ];

  const showStreamingLinks = page.mode !== "auras";
  const showAuras = page.mode !== "streaming_links";

  const btnShape = buttonShapeClass(extras.buttonShape);
  const btnStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    ...buttonStyleStyle(extras.buttonStyle, theme.buttonBg, theme.accent),
    boxShadow: theme.glow,
    ...(extra ?? {}),
  });

  const sectionOrder = extras.sectionOrder?.length ? extras.sectionOrder : DEFAULT_SECTION_ORDER;
  const spacing = spacingClass(extras.spacing);

  // Decoration overlays
  const decorations = extras.decorations ?? {};

  // ----- Section renderers -----
  const renderSection = (key: AuraLinkSectionKey) => {
    if (key === "profile") {
      return (
        <div key="profile" className="flex flex-col items-center">
          <div
            className="relative rounded-full p-1.5"
            style={
              featured && !page.profileImageUrl
                ? {
                    background:
                      "conic-gradient(from 180deg, oklch(0.75 0.2 310 / 0.45), oklch(0.7 0.2 220 / 0.35), oklch(0.85 0.18 60 / 0.4), oklch(0.75 0.2 310 / 0.45))",
                    boxShadow: theme.glow,
                  }
                : undefined
            }
          >
            {page.profileImageUrl ? (
              <img
                src={page.profileImageUrl}
                alt={page.artistName || page.title}
                className="h-28 w-28 rounded-full object-cover ring-2 ring-foreground/15 shadow-2xl"
                style={{ boxShadow: theme.glow }}
              />
            ) : featured ? (
              <Aurascope
                aura={{
                  id: featured.id,
                  palette: featured.palette,
                  seed: featured.seed,
                  auraName: featured.auraName,
                  colors: featured.colors,
                }}
                size="medium"
                mode="minimal"
                showLabel={false}
              />
            ) : (
              <Aurascope
                aura={{ palette: "euphoric", auraName: page.title }}
                size="medium"
                mode="minimal"
                showLabel={false}
              />
            )}
          </div>
          {featured && !page.profileImageUrl && (
            <div
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 h-6 text-[9px] uppercase tracking-[0.28em] opacity-80"
              style={{ color: theme.accent }}
            >
              <Sparkles className="h-2.5 w-2.5" /> Featured Aura
            </div>
          )}
          <h1
            className="mt-6 text-3xl sm:text-4xl tracking-tight leading-tight"
            style={{ color: theme.accent, fontFamily: headingFont ?? "var(--font-display)" }}
          >
            {page.title || "Untitled AuraLink"}
          </h1>
          {page.artistName && (
            <div className="mt-1 text-sm opacity-80" style={{ fontFamily: bodyFont }}>
              {page.artistName}
            </div>
          )}
          {page.description && (
            <p className="mt-3 text-sm opacity-75 max-w-xs" style={{ fontFamily: bodyFont }}>
              {page.description}
            </p>
          )}
        </div>
      );
    }

    if (key === "socials" && showStreamingLinks && socialEntries.length > 0) {
      return (
        <div key="socials" className="w-full flex flex-wrap justify-center gap-2">
          {socialEntries.map((s) => (
            <a
              key={s.id}
              href={s.url || "#"}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 h-8 text-[11px] border border-foreground/15 hover:border-foreground/35 transition-colors ${btnShape}`}
              style={btnStyle()}
              title={socialPlatformLabel(s.platformName)}
            >
              <span className="opacity-90">{socialPlatformLabel(s.platformName)}</span>
            </a>
          ))}
        </div>
      );
    }

    if ((key === "streaming" || key === "custom") && showStreamingLinks && linkEntries.length > 0) {
      const entries = key === "streaming"
        ? linkEntries.filter((l) => l.kind === "streaming")
        : linkEntries.filter((l) => l.kind === "custom");
      if (!entries.length) return null;
      return (
        <div key={key} className="w-full space-y-2.5">
          {entries.map((l) => (
            <a
              key={l.id}
              href={l.url || "#"}
              target="_blank"
              rel="noreferrer"
              className={`group block w-full px-5 h-14 flex items-center justify-between text-sm font-medium border border-foreground/15 hover:border-foreground/35 transition-all hover:-translate-y-0.5 ${btnShape}`}
              style={btnStyle()}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] uppercase tracking-[0.24em] opacity-70 shrink-0">
                  {l.kind === "streaming" ? platformLabel(l.platformName) : "Link"}
                </span>
                <span className="truncate" style={{ fontFamily: bodyFont }}>{l.label}</span>
              </span>
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
            </a>
          ))}
        </div>
      );
    }

    if (key === "auras" && showAuras && auraEntries.length > 0) {
      return (
        <div key="auras" className="w-full space-y-3">
          <div className="text-[10px] uppercase tracking-[0.28em] opacity-70 text-left px-1">
            <Sparkles className="inline h-3 w-3 mr-1.5 -mt-0.5" />{" "}
            {auraEntries.length === 1 ? "Featured Aura" : "Featured Auras"}
          </div>
          {auraEntries.map((a) => (
            <AuraLinkAuraCard
              key={a.id}
              aura={a}
              variant={auraEntries.length === 1 ? "hero" : "list"}
              themeAccent={theme.accent}
              themeButtonBg={theme.buttonBg}
              themeGlow={theme.glow}
              playingId={playingId}
              onPlayingChange={setPlayingId}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={
        "relative min-h-full w-full flex flex-col items-center text-foreground " +
        (className ?? "")
      }
      style={containerStyle}
    >
      {/* Background image overlay */}
      {bg?.kind === "image" && bg.imageUrl && overlayOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${overlayOpacity})` }}
        />
      )}

      {/* Background aura atmosphere */}
      {backgroundAura && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute inset-0 scale-[1.6] blur-2xl">
            <Aurascope
              aura={{
                id: backgroundAura.id,
                palette: backgroundAura.palette,
                seed: backgroundAura.seed,
                auraName: backgroundAura.auraName,
                colors: backgroundAura.colors,
              }}
              size="large"
              mode="minimal"
              showLabel={false}
            />
          </div>
        </div>
      )}

      {/* Decorations */}
      {decorations.grain && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            backgroundSize: "200px 200px",
          }}
        />
      )}
      {decorations.stars && (
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                left: `${(i * 53) % 100}%`,
                top: `${(i * 37) % 100}%`,
                opacity: 0.5,
                animationDelay: `${(i % 7) * 0.3}s`,
                animationDuration: "3s",
              }}
            />
          ))}
        </div>
      )}
      {decorations.bokeh && (
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full blur-3xl"
              style={{
                width: 220 + i * 60,
                height: 220 + i * 60,
                background: i === 0 ? theme.accent + "33" : theme.buttonBg,
                top: `${10 + i * 25}%`,
                left: `${i % 2 === 0 ? 10 : 60}%`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      )}

      {showLogo && (
        <div className="relative w-full max-w-md px-5 pt-6 z-10">
          <Link to="/" className="opacity-70 hover:opacity-100 transition-opacity">
            <Logo />
          </Link>
        </div>
      )}

      <div
        className={`relative w-full max-w-md px-5 pt-6 pb-12 flex flex-col items-center text-center z-10 ${spacing}`}
        style={{ fontFamily: bodyFont }}
      >
        {sectionOrder.map((key) => {
          const node = renderSection(key);
          if (!node) return null;
          return (
            <div key={key} className="w-full flex flex-col items-center">
              {node}
            </div>
          );
        })}

        {linkEntries.length === 0 && auraEntries.length === 0 && (
          <p className="mt-10 text-xs uppercase tracking-[0.28em] opacity-60">
            Nothing added yet
          </p>
        )}

        <Link
          to="/"
          className="mt-12 text-[10px] uppercase tracking-[0.3em] opacity-60 hover:opacity-100 transition-opacity"
        >
          Created with Auragram
        </Link>
      </div>
    </div>
  );
}
