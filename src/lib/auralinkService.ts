// Cloud-backed AuraLink CRUD. Source of truth for AuraLinks lives in
// Supabase (public.auralinks). RLS: public read, owner CRUD.

import { supabase } from "@/integrations/supabase/client";
import type {
  AuraLinkPage,
  AuraLinkMode,
  AuraLinkStreamingLink,
  AuraLinkSocialLink,
  AuraLinkCustomLink,
  AuraLinkTheme,
  AuraLinkThemePreset,
} from "./auralink";
import { slugify } from "./auralink";

type Row = {
  id: string;
  user_id: string;
  artist_profile_id: string | null;
  created_at: string;
  updated_at: string;
  title: string;
  artist_name: string;
  slug: string;
  description: string | null;
  profile_image_url: string | null;
  mode: string;
  selected_aura_ids: unknown;
  featured_aura_id: string | null;
  streaming_links: unknown;
  social_links: unknown;
  custom_links: unknown;
  theme: unknown;
  seo_title: string | null;
  seo_description: string | null;
  social_preview_image: string | null;
  visibility: string;
};

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function rowToPage(row: Row): AuraLinkPage {
  return {
    id: row.id,
    userId: row.user_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    title: row.title,
    artistName: row.artist_name,
    handleSlug: row.slug,
    description: row.description ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    mode: (row.mode as AuraLinkMode) ?? "mixed",
    selectedAuraIds: asArray<string>(row.selected_aura_ids),
    featuredAuraId: row.featured_aura_id ?? undefined,
    streamingLinks: asArray<AuraLinkStreamingLink>(row.streaming_links),
    socialLinks: asArray<AuraLinkSocialLink>(row.social_links),
    customLinks: asArray<AuraLinkCustomLink>(row.custom_links),
    theme: (row.theme as AuraLinkTheme | AuraLinkThemePreset) ?? "midnight",
    visibility: (row.visibility as "public" | "unlisted") ?? "public",
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    socialPreviewImage: row.social_preview_image ?? undefined,
  };
}

function pageToRow(page: AuraLinkPage, userId: string) {
  return {
    id: page.id,
    user_id: userId,
    title: page.title,
    artist_name: page.artistName ?? "",
    slug: page.handleSlug,
    description: page.description ?? null,
    profile_image_url: page.profileImageUrl ?? null,
    mode: page.mode,
    selected_aura_ids: page.selectedAuraIds ?? [],
    featured_aura_id: page.featuredAuraId ?? null,
    streaming_links: page.streamingLinks ?? [],
    social_links: page.socialLinks ?? [],
    custom_links: page.customLinks ?? [],
    theme: page.theme ?? "midnight",
    seo_title: page.seoTitle ?? null,
    seo_description: page.seoDescription ?? null,
    social_preview_image: page.socialPreviewImage ?? null,
    visibility: page.visibility ?? "public",
  };
}

export async function listMyAuraLinks(profileId: string): Promise<AuraLinkPage[]> {
  const { data, error } = await supabase
    .from("auralinks")
    .select("*")
    .eq("user_id", profileId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as Row[] | null)?.map(rowToPage) ?? [];
}

export async function getAuraLinkById(id: string): Promise<AuraLinkPage | null> {
  const { data, error } = await supabase
    .from("auralinks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data ? rowToPage(data as Row) : null;
}

export async function getAuraLinkBySlug(slug: string): Promise<AuraLinkPage | null> {
  const { data, error } = await supabase
    .from("auralinks")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data ? rowToPage(data as Row) : null;
}

const RESERVED_SLUGS = new Set([
  "admin","api","auth","login","app","www","root","help","about","faq",
  "create","auralink","auracle","aura","farm","artist","l","settings",
  "onboarding","public","generating","404","signin","signup",
]);

export async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const start = slugify(base);
  let s = RESERVED_SLUGS.has(start) ? `${start}-1` : start;
  let i = 2;
  // Cap attempts to avoid infinite loops in degenerate cases.
  for (let attempts = 0; attempts < 30; attempts++) {
    if (!RESERVED_SLUGS.has(s)) {
      const { data } = await supabase
        .from("auralinks")
        .select("id")
        .eq("slug", s)
        .maybeSingle();
      if (!data || data.id === ignoreId) return s;
    }
    s = `${start}-${i++}`;
  }
  return `${start}-${Date.now().toString(36)}`;
}

export async function saveAuraLink(profileId: string, page: AuraLinkPage): Promise<AuraLinkPage> {
  const row = pageToRow(page, profileId);
  const { data, error } = await supabase
    .from("auralinks")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return rowToPage(data as Row);
}

export async function updateAuraLink(
  id: string,
  profileId: string,
  patch: Partial<AuraLinkPage>,
): Promise<AuraLinkPage | null> {
  // Build a row patch only with present fields.
  const rp: Record<string, unknown> = {};
  if (patch.title !== undefined) rp.title = patch.title;
  if (patch.artistName !== undefined) rp.artist_name = patch.artistName;
  if (patch.handleSlug !== undefined) rp.slug = patch.handleSlug;
  if (patch.description !== undefined) rp.description = patch.description ?? null;
  if (patch.profileImageUrl !== undefined) rp.profile_image_url = patch.profileImageUrl ?? null;
  if (patch.mode !== undefined) rp.mode = patch.mode;
  if (patch.selectedAuraIds !== undefined) rp.selected_aura_ids = patch.selectedAuraIds;
  if (patch.featuredAuraId !== undefined) rp.featured_aura_id = patch.featuredAuraId ?? null;
  if (patch.streamingLinks !== undefined) rp.streaming_links = patch.streamingLinks;
  if (patch.socialLinks !== undefined) rp.social_links = patch.socialLinks;
  if (patch.customLinks !== undefined) rp.custom_links = patch.customLinks;
  if (patch.theme !== undefined) rp.theme = patch.theme;
  if (patch.seoTitle !== undefined) rp.seo_title = patch.seoTitle ?? null;
  if (patch.seoDescription !== undefined) rp.seo_description = patch.seoDescription ?? null;
  if (patch.socialPreviewImage !== undefined) rp.social_preview_image = patch.socialPreviewImage ?? null;
  if (patch.visibility !== undefined) rp.visibility = patch.visibility;

  const { data, error } = await supabase
    .from("auralinks")
    .update(rp as never)
    .eq("id", id)
    .eq("user_id", profileId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPage(data as Row) : null;
}

export async function deleteAuraLink(id: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("auralinks")
    .delete()
    .eq("id", id)
    .eq("user_id", profileId);
  if (error) throw error;
}
