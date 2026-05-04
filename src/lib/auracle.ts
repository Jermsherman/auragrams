// Auracle: a curated collection of multiple saved Auras (album/EP/playlist/demo pack/rollout).
// Stored in localStorage. Master library of Auras still lives in lib/farm.ts.

import type { PaletteKey } from "./aura";
import { getPersonality } from "./aura";
import { getSavedAuras, type SavedAura } from "./farm";

export type AuracleProjectType = "album" | "ep" | "playlist" | "demo_pack" | "rollout";

export const PROJECT_TYPE_LABELS: Record<AuracleProjectType, string> = {
  album: "Album",
  ep: "EP",
  playlist: "Playlist",
  demo_pack: "Demo Pack",
  rollout: "Rollout",
};

export type Auracle = {
  id: string;
  createdAt: number;
  title: string;
  artistName: string;
  projectType: AuracleProjectType;
  description?: string;
  auraIds: string[];
  moodTagsSummary: string[];
  dominantPalette: PaletteKey;
  auracleName?: string;
  auracleDescription?: string;
  shareUrl?: string;
};

const KEY = "auragram_farm_auracles";

function read(): Record<string, Auracle> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(map: Record<string, Auracle>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getSavedAuracles(): Auracle[] {
  return Object.values(read()).sort((a, b) => b.createdAt - a.createdAt);
}

export function getAuracle(id: string): Auracle | null {
  return read()[id] ?? null;
}

export function isAuracleSaved(id: string): boolean {
  return !!read()[id];
}

export function deleteAuracle(id: string) {
  const all = read();
  delete all[id];
  write(all);
}

export function updateAuracle(a: Auracle) {
  const all = read();
  all[a.id] = recompute(a);
  write(all);
}

export function addAuraToAuracle(auracleId: string, auraId: string) {
  const a = getAuracle(auracleId);
  if (!a) return;
  if (a.auraIds.includes(auraId)) return;
  updateAuracle({ ...a, auraIds: [...a.auraIds, auraId] });
}

export function removeAuraFromAuracle(auracleId: string, auraId: string) {
  const a = getAuracle(auracleId);
  if (!a) return;
  updateAuracle({ ...a, auraIds: a.auraIds.filter((x) => x !== auraId) });
}

type SaveInput = {
  title: string;
  artistName: string;
  projectType: AuracleProjectType;
  description?: string;
  auraIds: string[];
};

export function saveAuracle(input: SaveInput): Auracle {
  const id = makeId();
  const base: Auracle = {
    id,
    createdAt: Date.now(),
    title: input.title.trim(),
    artistName: input.artistName.trim(),
    projectType: input.projectType,
    description: input.description?.trim() || undefined,
    auraIds: input.auraIds,
    moodTagsSummary: [],
    dominantPalette: "warm",
  };
  const computed = recompute(base);
  const all = read();
  all[id] = computed;
  write(all);
  return computed;
}

function recompute(a: Auracle): Auracle {
  const auras = getMembers(a.auraIds);
  return {
    ...a,
    moodTagsSummary: summarizeMoods(auras),
    dominantPalette: pickDominantPalette(auras),
    auracleDescription:
      a.auracleDescription ?? composeAuracleDescription(auras, a.projectType, a.title),
  };
}

export function getMembers(ids: string[]): SavedAura[] {
  const all = new Map(getSavedAuras().map((a) => [a.id, a]));
  return ids.map((id) => all.get(id)).filter((x): x is SavedAura => !!x);
}

export function summarizeMoods(auras: SavedAura[]): string[] {
  const counts = new Map<string, number>();
  for (const a of auras) {
    for (const m of a.moodTags ?? []) {
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([m]) => m);
}

export function pickDominantPalette(auras: SavedAura[]): PaletteKey {
  if (!auras.length) return "warm";
  const counts = new Map<string, number>();
  for (const a of auras) counts.set(a.palette, (counts.get(a.palette) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] as PaletteKey;
}

export function averageEnergy(auras: SavedAura[]): number {
  if (!auras.length) return 60;
  return Math.round(auras.reduce((s, a) => s + (a.energyLevel ?? 60), 0) / auras.length);
}

export function composeAuracleDescription(
  auras: SavedAura[],
  type: AuracleProjectType,
  title: string,
): string {
  if (!auras.length) {
    return `${title} — a living ${PROJECT_TYPE_LABELS[type].toLowerCase()} on Auragram.`;
  }
  const palette = pickDominantPalette(auras);
  const p = getPersonality(palette);
  const moods = summarizeMoods(auras).slice(0, 3).join(", ").toLowerCase();
  const typeLabel = PROJECT_TYPE_LABELS[type].toLowerCase();
  const tone = p.phrases.tone[0];
  return `A ${tone} ${typeLabel} of ${auras.length} Auras${moods ? ` — ${moods}` : ""}.`;
}
