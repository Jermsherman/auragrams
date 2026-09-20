// Authorized playback URLs for Aura audio.
//
// Original uploads stay in a private bucket. The browser never gets storage
// credentials — it asks this endpoint, which checks the Aura's publishing
// status (or ownership) before minting a short-lived signed URL.

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const PLAYBACK_TTL_SEC = 600; // 10 minutes

export type PlaybackResult =
  | { url: string; expiresIn: number }
  | { error: "missing" | "private" | "unavailable" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getAuraPlaybackUrl = createServerFn({ method: "POST" })
  .inputValidator((input: { auraId: string }) => {
    if (!input || typeof input.auraId !== "string" || !UUID_RE.test(input.auraId)) {
      throw new Error("Invalid Aura id");
    }
    return { auraId: input.auraId };
  })
  .handler(async ({ data }): Promise<PlaybackResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: aura, error } = await supabaseAdmin
      .from("auras")
      .select("id,user_id,status,audio_storage_path")
      .eq("id", data.auraId)
      .maybeSingle();

    if (error) return { error: "unavailable" };
    if (!aura) return { error: "missing" };

    const published = aura.status === "public" || aura.status === "unlisted";

    let isOwner = false;
    if (!published) {
      const authHeader = getRequestHeader("authorization") ?? "";
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token) {
        const { data: userRes } = await supabaseAdmin.auth.getUser(token);
        const authUserId = userRes?.user?.id;
        if (authUserId) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("auth_user_id", authUserId)
            .maybeSingle();
          isOwner = !!profile && profile.id === aura.user_id;
        }
      }
    }

    // Drafts are indistinguishable from missing records for anyone else.
    if (!published && !isOwner) return { error: "private" };

    const path = aura.audio_storage_path;
    // The path must belong to this Aura's own folder: <authUserId>/<auraId>/<file>
    if (!path || !path.includes(`/${aura.id}/`) || path.includes("..")) {
      return { error: "unavailable" };
    }

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("auragram-audio")
      .createSignedUrl(path, PLAYBACK_TTL_SEC);

    if (signErr || !signed?.signedUrl) return { error: "unavailable" };
    return { url: signed.signedUrl, expiresIn: PLAYBACK_TTL_SEC };
  });
