// Thin wrappers around Supabase for auras, artist profiles, and auracles.
// Owner-side reads/writes only — public reads use the same client (RLS allows public select).

import { supabase } from "@/integrations/supabase/client";
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
    extra: {
      coverDataUrl: saved.coverDataUrl ?? null,
      keyConfidence: saved.keyConfidence,
      userColorInfluence: saved.userColorInfluence ?? null,
      colorGuided: saved.colorGuided ?? false,
    },
  };
  const { error } = await supabase.from("auras").upsert(row);
  if (error) throw error;
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

export async function deleteAura(id: string) {
  const { error } = await supabase.from("auras").delete().eq("id", id);
  if (error) throw error;
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
