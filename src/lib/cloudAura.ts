// Thin wrappers around Supabase for auras, artist profiles, and auracles.
// Owner-side reads/writes only — public reads use the same client (RLS allows public select).

import { supabase } from "@/integrations/supabase/client";
import { getSignedAudioUrl, getSignedAudioUrls } from "./audioStorage";
import type { ArtistProfile, VisibilityMode } from "./identity";
import type { SavedAura } from "./farm";
import type { Auracle } from "./auracle";

export type CloudAuraRow = {
  id: string;
  user_id: string;
  artist_profile_id: string | null;
  visibility_mode: VisibilityMode;
  is_anonymous: boolean;
  track_title: string;
  source_type: string | null;
  platform_name: string | null;
  platform_url: string | null;
  embed_url: string | null;
  mood_tags: string[];
  detected_key: string | null;
  pitch_center: string | null;
  energy_level: number | null;
  aura_name: string | null;
  aura_description: string | null;
  vibe_description: string | null;
  color_palette: unknown;
  palette_name: string | null;
  visual_style: unknown;
  public_artist_name: string | null;
  public_handle: string | null;
  extra: Record<string, unknown>;
  audio_storage_path: string | null;
  audio_public_url: string | null;
  audio_file_name: string | null;
  audio_mime_type: string | null;
  audio_size_bytes: number | null;
  audio_duration_seconds: number | null;
  insight: unknown;
  created_at: string;
  updated_at: string;
};

// ------------- Artist profiles -------------

export async function listMyArtistProfiles(profileId: string): Promise<ArtistProfile[]> {
  const { data, error } = await supabase
    .from("artist_profiles")
    .select("id,user_id,artist_name,artist_handle,bio,profile_image_url")
    .eq("user_id", profileId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ArtistProfile[]) ?? [];
}

export async function createArtistProfile(input: {
  user_id: string;
  artist_name: string;
  artist_handle?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
}): Promise<ArtistProfile> {
  const { data, error } = await supabase
    .from("artist_profiles")
    .insert(input)
    .select("id,user_id,artist_name,artist_handle,bio,profile_image_url")
    .single();
  if (error) throw error;
  return data as ArtistProfile;
}

export async function updateArtistProfile(id: string, patch: Partial<ArtistProfile>) {
  const { error } = await supabase.from("artist_profiles").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteArtistProfile(id: string) {
  const { error } = await supabase.from("artist_profiles").delete().eq("id", id);
  if (error) throw error;
}

// ------------- Auras -------------

export async function saveAuraToCloud(opts: {
  saved: SavedAura;
  userId: string;
  visibilityMode: VisibilityMode;
  artistProfileId: string | null;
  publicArtistName: string | null;
  publicHandle: string | null;
}) {
  const { saved, userId, visibilityMode, artistProfileId, publicArtistName, publicHandle } = opts;

  // Upload base64 cover to storage instead of bloating the JSON column.
  let coverUrl: string | null = saved.coverDataUrl ?? null;
  if (coverUrl && coverUrl.startsWith("data:")) {
    try {
      coverUrl = await uploadAuraCover(saved.id, coverUrl);
    } catch (e) {
      console.warn("[saveAuraToCloud] cover upload failed, dropping", e);
      coverUrl = null;
    }
  }

  const row = {
    id: saved.id,
    user_id: userId,
    artist_profile_id: artistProfileId,
    visibility_mode: visibilityMode,
    track_title: saved.trackTitle,
    source_type: saved.sourceType,
    platform_name: saved.platformName ?? null,
    platform_url: saved.platformUrl ?? null,
    embed_url: saved.embedUrl ?? null,
    mood_tags: saved.moodTags ?? [],
    detected_key: saved.musicalKey ?? null,
    pitch_center: saved.pitchCenter ? `${saved.pitchCenter.note} · ${Math.round(saved.pitchCenter.hz)}Hz` : null,
    energy_level: saved.energyLevel ?? null,
    aura_name: saved.auraName,
    aura_description: saved.auraDescription,
    vibe_description: saved.vibeDescription ?? null,
    color_palette: saved.colors ?? null,
    palette_name: saved.paletteName ?? saved.palette,
    visual_style: {
      palette: saved.palette,
      seed: saved.seed,
      density: saved.density,
      tempoBand: saved.tempoBand,
      motionKeywords: saved.motionKeywords,
    },
    public_artist_name: publicArtistName,
    public_handle: publicHandle,
    audio_storage_path: saved.audioStoragePath ?? null,
    // audio_public_url is legacy — the bucket is private now and we mint signed URLs at read time.
    audio_public_url: null,
    audio_file_name: saved.audioFileName ?? null,
    audio_mime_type: saved.audioMimeType ?? null,
    audio_size_bytes: saved.audioSizeBytes ?? null,
    audio_duration_seconds: saved.audioDurationSeconds ?? null,
    extra: {
      coverUrl: coverUrl ?? null,
      keyConfidence: saved.keyConfidence,
      userColorInfluence: saved.userColorInfluence ?? null,
      colorGuided: saved.colorGuided ?? false,
      influenceSettings: saved.influenceSettings ?? null,
    },
  };
  const { error } = await supabase.from("auras").upsert(row);
  if (error) throw error;

  // Fire-and-forget: kick off the Song Personality Profile generation.
  // Idempotent server-side, so a duplicate call is a no-op.
  void triggerInsightGeneration(saved.id);
}

async function triggerInsightGeneration(auraId: string) {
  try {
    const { generateAuraInsight } = await import("./auraInsight.functions");
    await generateAuraInsight({ data: { auraId } });
  } catch (e) {
    console.warn("[triggerInsightGeneration] failed", e);
  }
}

async function uploadAuraCover(auraId: string, dataUrl: string): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `covers/${u.user.id}/${auraId}.jpg`;
  const { error } = await supabase.storage
    .from("auralink-images")
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
  if (error) throw error;
  const { data: pub } = supabase.storage.from("auralink-images").getPublicUrl(path);
  return pub.publicUrl;
}

export async function listMyAuras(profileId: string): Promise<CloudAuraRow[]> {
  const { data, error } = await supabase
    .from("auras")
    .select("*")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as CloudAuraRow[]) ?? [];
}

export async function getPublicAura(id: string): Promise<CloudAuraRow | null> {
  const { data, error } = await supabase.from("auras").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return (data as CloudAuraRow) ?? null;
}

export async function deleteAura(id: string, profileId?: string) {
  let q = supabase.from("auras").delete().eq("id", id);
  if (profileId) q = q.eq("user_id", profileId);
  const { error } = await q;
  if (error) throw error;
}

export async function deleteAuraAudio(storagePath: string | null | undefined): Promise<void> {
  if (!storagePath) return;
  // Await + retry once. The caller is responsible for surfacing a toast on failure.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { error } = await supabase.storage.from("auragram-audio").remove([storagePath]);
      if (!error) return;
      if (attempt === 1) {
        console.error("[deleteAuraAudio] failed", error);
        throw error;
      }
    } catch (e) {
      if (attempt === 1) {
        console.error("[deleteAuraAudio] threw", e);
        throw e;
      }
    }
  }
}

/**
 * Populate audioPublicUrl on a batch of SavedAura via short-lived signed URLs.
 * Mutates in place and returns the same array for convenience.
 */
export async function hydrateSavedAuraAudioUrls<T extends { audioStoragePath?: string; audioPublicUrl?: string }>(
  items: T[],
): Promise<T[]> {
  const paths = items.map((i) => i.audioStoragePath).filter((p): p is string => !!p);
  if (paths.length === 0) return items;
  const signed = await getSignedAudioUrls(paths);
  for (const item of items) {
    const p = item.audioStoragePath;
    if (p && signed.has(p)) item.audioPublicUrl = signed.get(p);
  }
  return items;
}

/** Convenience for single-row fetches; returns a signed URL for the row's audio (if any). */
export async function signRowAudio(row: CloudAuraRow | null | undefined): Promise<string | null> {
  return getSignedAudioUrl(row?.audio_storage_path ?? null);
}

/** Translate a CloudAuraRow into the SavedAura shape used by Farm/AuraLink views. */
export function mapAuraRowToSaved(row: CloudAuraRow): import("./farm").SavedAura {
  const visual = (row.visual_style ?? {}) as {
    palette?: string;
    seed?: number;
    density?: string;
    tempoBand?: string;
    motionKeywords?: string[];
  };
  const extra = (row.extra ?? {}) as {
    coverDataUrl?: string;
    coverUrl?: string;
    userColorInfluence?: import("./aura").UserColorInfluence;
    colorGuided?: boolean;
    influenceSettings?: import("./farm").SavedAura["influenceSettings"];
  };
  const anon = row.visibility_mode === "anonymous";
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: new Date(row.created_at).getTime(),
    trackTitle: row.track_title,
    artistName: anon ? "" : (row.public_artist_name ?? ""),
    artistHandle: anon ? "" : (row.public_handle ?? ""),
    sourceType: (row.source_type as import("./farm").SourceType) ?? "upload",
    platformName: row.platform_name ?? undefined,
    platformUrl: row.platform_url ?? undefined,
    embedUrl: row.embed_url ?? undefined,
    moodTags: row.mood_tags ?? [],
    auraName: row.aura_name ?? row.track_title,
    auraDescription: row.aura_description ?? "",
    energyLevel: Number(row.energy_level ?? 0.6),
    palette: ((visual.palette ?? row.palette_name) as import("./aura").PaletteKey) ?? "amethyst",
    seed: Number(visual.seed ?? 0),
    coverDataUrl: extra.coverUrl ?? extra.coverDataUrl,
    musicalKey: row.detected_key ?? undefined,
    tempoBand: visual.tempoBand,
    density: visual.density,
    paletteName: row.palette_name ?? undefined,
    vibeDescription: row.vibe_description ?? undefined,
    motionKeywords: visual.motionKeywords,
    colors: (row.color_palette as import("./aura").AuraPalette | null) ?? undefined,
    userColorInfluence: extra.userColorInfluence,
    colorGuided: extra.colorGuided,
    visibilityMode: row.visibility_mode,
    influenceSettings: extra.influenceSettings,
    audioStoragePath: row.audio_storage_path ?? undefined,
    audioPublicUrl: undefined, // resolve via hydrateSavedAuraAudioUrls() — bucket is private.
    audioFileName: row.audio_file_name ?? undefined,
    audioMimeType: row.audio_mime_type ?? undefined,
    audioSizeBytes: row.audio_size_bytes ?? undefined,
    audioDurationSeconds: row.audio_duration_seconds ?? undefined,
  };
}

export async function updateAuraVisibility(
  id: string,
  patch: { visibility_mode: VisibilityMode; artist_profile_id: string | null; public_artist_name: string | null; public_handle: string | null },
) {
  const { error } = await supabase.from("auras").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateAuraVibe(id: string, vibeDescription: string) {
  const { error } = await supabase
    .from("auras")
    .update({ vibe_description: vibeDescription })
    .eq("id", id);
  if (error) throw error;
}

// ------------- Auracles -------------

export async function saveAuracleToCloud(opts: {
  auracle: Auracle;
  userId: string;
  visibilityMode: VisibilityMode;
  artistProfileId: string | null;
  publicArtistName: string | null;
  publicHandle: string | null;
}) {
  const { auracle, userId, visibilityMode, artistProfileId, publicArtistName, publicHandle } = opts;
  const row = {
    id: auracle.id,
    user_id: userId,
    artist_profile_id: artistProfileId,
    visibility_mode: visibilityMode,
    title: auracle.title,
    description: auracle.description ?? null,
    project_type: auracle.projectType,
    aura_ids: auracle.auraIds,
    public_artist_name: publicArtistName,
    public_handle: publicHandle,
  };
  const { error } = await supabase.from("auracles").upsert(row);
  if (error) throw error;
}

export async function listMyAuracles(profileId: string) {
  const { data, error } = await supabase
    .from("auracles")
    .select("*")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteAuracleCloud(id: string) {
  const { error } = await supabase.from("auracles").delete().eq("id", id);
  if (error) throw error;
}

// ------------- Profile maintenance -------------

export async function checkUsernameAvailable(username: string, currentProfileId?: string) {
  const u = username.trim().toLowerCase();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", u)
    .maybeSingle();
  if (!data) return true;
  return data.id === currentProfileId;
}
