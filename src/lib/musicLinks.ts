// Thin wrapper around tracks.detectProvider for the Create page music-link flow.
// Validates URLs, extracts a friendly title/artist guess, and returns the
// platform metadata used to build a SavedAura.

import { z } from "zod";
import { detectProvider, providerLabel, type Provider } from "./tracks";

export const musicLinkSchema = z
  .string()
  .trim()
  .min(1, "Paste a music link")
  .max(500, "Link is too long")
  .url("That doesn't look like a valid URL");

export type MusicLinkInfo = {
  url: string;
  provider: Provider;
  platformName: string;
  embedUrl?: string;
};

export function parseMusicLink(raw: string): MusicLinkInfo | null {
  const parsed = musicLinkSchema.safeParse(raw);
  if (!parsed.success) return null;
  const info = detectProvider(parsed.data);
  if (!info) return null;
  return {
    url: parsed.data,
    provider: info.provider,
    platformName: info.platformName ?? providerLabel(info.provider),
    embedUrl: info.embedUrl,
  };
}
