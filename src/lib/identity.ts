// Identity & visibility helpers shared across create flow, share, and public pages.

export type VisibilityMode = "artist" | "username" | "anonymous";

export type ArtistProfile = {
  id: string;
  user_id: string;
  artist_name: string;
  artist_handle: string | null;
  bio: string | null;
  profile_image_url: string | null;
};

export function publicLabelFor(opts: {
  mode: VisibilityMode;
  artistName?: string | null;
  handle?: string | null;
  username?: string | null;
}) {
  if (opts.mode === "anonymous") return { display: "Anonymous Aura", handle: null as string | null };
  if (opts.mode === "username") {
    return { display: opts.username ? `@${opts.username}` : "@user", handle: opts.username ?? null };
  }
  return { display: opts.artistName ?? "Unknown", handle: opts.handle ?? null };
}
