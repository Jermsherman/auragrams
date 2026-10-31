import { createFileRoute } from "@tanstack/react-router";

// Daily cleanup of guest Auras (user_id IS NULL) older than 72 hours.
// Called by pg_cron via net.http_post. The route lives under /api/public/*,
// which bypasses auth on published sites, so the caller must present the
// server-only CRON_SECRET (header `x-cron-secret`, or `Authorization: Bearer`).
// Do not use the publishable anon key — it ships in the client bundle.

const CLEANUP_AGE_MS = 72 * 60 * 60 * 1000;

function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/cron/cleanup-guest-auras")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.CRON_SECRET;
        if (!expected) {
          console.error("[cleanup-guest-auras] CRON_SECRET is not set");
          return new Response("Server misconfigured", { status: 500 });
        }
        const provided =
          request.headers.get("x-cron-secret") ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
          "";
        if (!provided || !timingSafeEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const cutoffIso = new Date(Date.now() - CLEANUP_AGE_MS).toISOString();

        // Find abandoned guest rows.
        const { data: rows, error: selErr } = await supabaseAdmin
          .from("auras")
          .select("id, audio_storage_path")
          .is("user_id", null)
          .lt("created_at", cutoffIso)
          .limit(500);

        if (selErr) {
          console.error("[cleanup-guest-auras] select failed", selErr);
          return Response.json({ error: selErr.message }, { status: 500 });
        }

        const paths = (rows ?? [])
          .map((r) => r.audio_storage_path)
          .filter((p): p is string => !!p);

        // Best-effort delete audio files first.
        if (paths.length) {
          const { error: rmErr } = await supabaseAdmin.storage
            .from("auragram-audio")
            .remove(paths);
          if (rmErr) console.warn("[cleanup-guest-auras] storage remove partial failure", rmErr);
        }

        // Delete the DB rows.
        const ids = (rows ?? []).map((r) => r.id);
        let deleted = 0;
        if (ids.length) {
          const { error: delErr, count } = await supabaseAdmin
            .from("auras")
            .delete({ count: "exact" })
            .in("id", ids);
          if (delErr) {
            console.error("[cleanup-guest-auras] delete failed", delErr);
            return Response.json({ error: delErr.message }, { status: 500 });
          }
          deleted = count ?? ids.length;
        }

        return Response.json({ deleted, audioRemoved: paths.length });
      },
    },
  },
});
