// Public-facing AuraLink renderer. Used by both the builder live preview
// and the public /l/$slug page.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Sparkles } from "lucide-react";
import { Aurascope } from "./Aurascope";
import { Logo } from "./Logo";
import { AuraLinkAuraCard } from "./AuraLinkAuraCard";
import {
  resolveTheme,
  platformLabel,
  socialPlatformLabel,
  type AuraLinkPage,
} from "@/lib/auralink";
import type { SavedAura } from "@/lib/farm";

type Props = {
  page: AuraLinkPage;
  auras: SavedAura[];
  showLogo?: boolean;
  className?: string;
};

export function AuraLinkView({ page, auras, showLogo = true, className }: Props) {
  const theme = resolveTheme(page.theme);
  const featured = auras.find((a) => a.id === (page.featuredAuraId ?? page.selectedAuraIds[0]));

  // Sort items by order, derive aura links from selectedAuraIds in order
  const auraEntries = page.selectedAuraIds
    .map((id) => auras.find((a) => a.id === id))
    .filter(Boolean) as SavedAura[];

  // Combine streaming + custom links into a single ordered list (back-compat
  // with v1 single-array `links` is handled by migratePage on read).
  const streamingEntries = [...(page.streamingLinks ?? [])].sort((a, b) => a.order - b.order);
  const customEntries = [...(page.customLinks ?? [])].sort((a, b) => a.order - b.order);
  const socialEntries = [...(page.socialLinks ?? [])].sort((a, b) => a.order - b.order);
  const linkEntries = [
    ...streamingEntries.map((l) => ({ id: l.id, kind: "streaming" as const, label: l.label, url: l.url, platformName: l.platformName })),
    ...customEntries.map((l) => ({ id: l.id, kind: "custom" as const, label: l.label, url: l.url, platformName: undefined })),
  ];
  void socialPlatformLabel;
  void socialEntries;

  const showStreamingLinks = page.mode !== "auras";
  const showAuras = page.mode !== "streaming_links";

  return (
    <div
      className={
        "relative min-h-full w-full flex flex-col items-center text-foreground " +
        (className ?? "")
      }
      style={{
        background: theme.bg,
        color: theme.accent,
      }}
    >
      {showLogo && (
        <div className="w-full max-w-md px-5 pt-6">
          <Link to="/" className="opacity-70 hover:opacity-100 transition-opacity">
            <Logo />
          </Link>
        </div>
      )}

      <div className="w-full max-w-md px-5 pt-6 pb-12 flex flex-col items-center text-center">
        {/* Hero visual */}
        <div className="relative">
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

        <h1
          className="mt-6 font-display text-3xl sm:text-4xl tracking-tight leading-tight"
          style={{ color: theme.accent }}
        >
          {page.title || "Untitled AuraLink"}
        </h1>
        {page.artistName && (
          <div className="mt-1 text-sm opacity-80">{page.artistName}</div>
        )}
        {page.description && (
          <p className="mt-3 text-sm opacity-75 max-w-xs">{page.description}</p>
        )}

        {/* Streaming + custom buttons */}
        {showStreamingLinks && linkEntries.length > 0 && (
          <div className="mt-8 w-full space-y-2.5">
            {linkEntries.map((l) => (
              <a
                key={l.id}
                href={l.url || "#"}
                target="_blank"
                rel="noreferrer"
                className="group block w-full rounded-2xl px-5 h-14 flex items-center justify-between text-sm font-medium border border-foreground/15 hover:border-foreground/35 transition-all hover:-translate-y-0.5"
                style={{
                  background: theme.buttonBg,
                  boxShadow: theme.glow,
                  color: theme.accent,
                }}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] uppercase tracking-[0.24em] opacity-70 shrink-0">
                    {l.kind === "streaming"
                      ? platformLabel(l.platformName)
                      : "Link"}
                  </span>
                  <span className="truncate">{l.label}</span>
                </span>
                <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        )}

        {/* Aura items */}
        {showAuras && auraEntries.length > 0 && (
          <div className="mt-8 w-full space-y-3">
            <div className="text-[10px] uppercase tracking-[0.28em] opacity-70 text-left px-1">
              <Sparkles className="inline h-3 w-3 mr-1.5 -mt-0.5" /> Featured Auras
            </div>
            {auraEntries.map((a) => (
              <Link
                key={a.id}
                to="/aura/$id"
                params={{ id: a.id }}
                className="group block w-full rounded-2xl p-3 border border-foreground/15 hover:border-foreground/35 transition-all hover:-translate-y-0.5"
                style={{
                  background: theme.buttonBg,
                  boxShadow: theme.glow,
                  color: theme.accent,
                }}
              >
                <div className="flex items-center gap-3 text-left">
                  <Aurascope
                    aura={{
                      id: a.id,
                      palette: a.palette,
                      seed: a.seed,
                      auraName: a.auraName,
                      colors: a.colors,
                    }}
                    size="mini"
                    mode="minimal"
                    showLabel={false}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-[0.22em] opacity-70 truncate">
                      {a.auraName}
                    </div>
                    <div className="text-sm font-medium truncate">
                      {a.trackTitle}
                    </div>
                    {a.moodTags?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {a.moodTags.slice(0, 3).map((m) => (
                          <span
                            key={m}
                            className="rounded-full border border-foreground/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] opacity-80"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:opacity-100 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}

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
