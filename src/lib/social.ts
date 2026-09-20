// Social layer: reactions (anonymous allowed), comments (sign-in required),
// follows, public profile cards, and the discovery feed.

import { supabase } from "@/integrations/supabase/client";

// Tables aren't in the generated types yet — localized loose accessor.
const t = (name: string) =>
  (supabase as unknown as { from: (n: string) => any }).from(name);

const ANON_KEY_STORAGE = "auragram_anon_key";

export function getAnonKey(): string {
  if (typeof window === "undefined") return "";
  let k = window.localStorage.getItem(ANON_KEY_STORAGE);
  if (!k) {
    k = crypto.randomUUID();
    window.localStorage.setItem(ANON_KEY_STORAGE, k);
  }
  return k;
}

// ---------------- Public profiles ----------------

export type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export async function getPublicProfileByUsername(username: string): Promise<PublicProfile | null> {
  const { data } = await t("public_profiles")
    .select("id,username,display_name,avatar_url,created_at")
    .ilike("username", username)
    .maybeSingle();
  return (data as PublicProfile) ?? null;
}

export async function getPublicProfilesByIds(ids: string[]): Promise<Record<string, PublicProfile>> {
  const unique = Array.from(new Set(ids)).filter(Boolean);
  if (!unique.length) return {};
  const { data } = await t("public_profiles")
    .select("id,username,display_name,avatar_url,created_at")
    .in("id", unique);
  const map: Record<string, PublicProfile> = {};
  for (const p of (data ?? []) as PublicProfile[]) map[p.id] = p;
  return map;
}

export function profileLabel(p?: PublicProfile | null) {
  return p?.display_name || (p?.username ? `@${p.username}` : "Someone");
}

// ---------------- Reactions ----------------

export type ReactionState = { count: number; reacted: boolean };

export async function getReactionState(auraId: string, profileId?: string | null): Promise<ReactionState> {
  const { count } = await t("aura_reactions")
    .select("id", { count: "exact", head: true })
    .eq("aura_id", auraId);

  let reacted = false;
  if (profileId) {
    const { data } = await t("aura_reactions")
      .select("id")
      .eq("aura_id", auraId)
      .eq("profile_id", profileId)
      .maybeSingle();
    reacted = !!data;
  } else {
    const key = getAnonKey();
    if (key) {
      const { data } = await t("aura_reactions")
        .select("id")
        .eq("aura_id", auraId)
        .eq("anon_key", key)
        .maybeSingle();
      reacted = !!data;
    }
  }
  return { count: count ?? 0, reacted };
}

export async function toggleReaction(
  auraId: string,
  profileId: string | null | undefined,
  currentlyReacted: boolean,
): Promise<void> {
  const key = getAnonKey();
  if (currentlyReacted) {
    let q = t("aura_reactions").delete().eq("aura_id", auraId);
    q = profileId ? q.eq("profile_id", profileId) : q.eq("anon_key", key);
    const { error } = await q;
    if (error) throw error;
    return;
  }
  const row = profileId
    ? { aura_id: auraId, profile_id: profileId, reaction: "love" }
    : { aura_id: auraId, anon_key: key, reaction: "love" };
  const { error } = await t("aura_reactions").insert(row);
  if (error) throw error;
}

export async function getReactionCounts(auraIds: string[]): Promise<Record<string, number>> {
  if (!auraIds.length) return {};
  const { data } = await t("aura_reactions").select("aura_id").in("aura_id", auraIds);
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as Array<{ aura_id: string }>) {
    counts[r.aura_id] = (counts[r.aura_id] ?? 0) + 1;
  }
  return counts;
}

// ---------------- Comments ----------------

export type AuraComment = {
  id: string;
  aura_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: PublicProfile | null;
};

export async function listComments(auraId: string): Promise<AuraComment[]> {
  const { data } = await t("aura_comments")
    .select("id,aura_id,author_id,body,created_at")
    .eq("aura_id", auraId)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as AuraComment[];
  const authors = await getPublicProfilesByIds(rows.map((r) => r.author_id));
  return rows.map((r) => ({ ...r, author: authors[r.author_id] ?? null }));
}

export async function addComment(auraId: string, authorId: string, body: string) {
  const { error } = await t("aura_comments").insert({
    aura_id: auraId,
    author_id: authorId,
    body: body.trim().slice(0, 500),
  });
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await t("aura_comments").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Follows ----------------

export type FollowState = { followers: number; following: number; isFollowing: boolean };

export async function getFollowState(profileId: string, viewerId?: string | null): Promise<FollowState> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    t("follows").select("id", { count: "exact", head: true }).eq("following_id", profileId),
    t("follows").select("id", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);
  let isFollowing = false;
  if (viewerId && viewerId !== profileId) {
    const { data } = await t("follows")
      .select("id")
      .eq("follower_id", viewerId)
      .eq("following_id", profileId)
      .maybeSingle();
    isFollowing = !!data;
  }
  return { followers: followers ?? 0, following: following ?? 0, isFollowing };
}

export async function toggleFollow(viewerId: string, profileId: string, isFollowing: boolean) {
  if (isFollowing) {
    const { error } = await t("follows")
      .delete()
      .eq("follower_id", viewerId)
      .eq("following_id", profileId);
    if (error) throw error;
  } else {
    const { error } = await t("follows").insert({
      follower_id: viewerId,
      following_id: profileId,
    });
    if (error) throw error;
  }
}

export async function listFollowingIds(viewerId: string): Promise<string[]> {
  const { data } = await t("follows").select("following_id").eq("follower_id", viewerId);
  return ((data ?? []) as Array<{ following_id: string }>).map((r) => r.following_id);
}

// ---------------- Discovery feed ----------------

export type FeedAura = {
  id: string;
  user_id: string;
  track_title: string;
  aura_name: string | null;
  vibe_description: string | null;
  palette_name: string | null;
  color_palette: unknown;
  mood_tags: string[];
  energy_level: number | null;
  visibility_mode: string;
  public_artist_name: string | null;
  created_at: string;
  reactions?: number;
  owner?: PublicProfile | null;
};

const FEED_COLUMNS =
  "id,user_id,track_title,aura_name,vibe_description,palette_name,color_palette,mood_tags,energy_level,visibility_mode,public_artist_name,created_at";

export async function listFeedAuras(opts: {
  limit?: number;
  ownerIds?: string[];
  sort?: "recent" | "trending";
} = {}): Promise<FeedAura[]> {
  const limit = opts.limit ?? 24;
  // Only published-public Auras ever appear in feeds. Drafts and unlisted
  // Auras are excluded here and by RLS.
  let q = t("auras")
    .select(FEED_COLUMNS)
    .eq("status", "public")
    .order("created_at", { ascending: false });
  if (opts.ownerIds) {
    if (!opts.ownerIds.length) return [];
    q = q.in("user_id", opts.ownerIds);
  }
  const { data } = await q.limit(opts.sort === "trending" ? Math.max(limit * 3, 60) : limit);
  const rows = (data ?? []) as FeedAura[];

  const [counts, owners] = await Promise.all([
    getReactionCounts(rows.map((r) => r.id)),
    getPublicProfilesByIds(rows.map((r) => r.user_id)),
  ]);

  const enriched = rows.map((r) => ({
    ...r,
    reactions: counts[r.id] ?? 0,
    owner: r.visibility_mode === "anonymous" ? null : owners[r.user_id] ?? null,
  }));

  if (opts.sort === "trending") {
    enriched.sort((a, b) => (b.reactions ?? 0) - (a.reactions ?? 0) || b.created_at.localeCompare(a.created_at));
    return enriched.slice(0, limit);
  }
  return enriched;
}
