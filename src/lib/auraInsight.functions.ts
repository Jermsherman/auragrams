// Server function that generates the Song Personality Profile for an Aura
// via the Lovable AI Gateway, then caches it on the row.
//
// Design:
// - PUBLIC server fn (no auth middleware) so it can run right after guest
//   claim without a bearer race. Safety comes from:
//     1. Idempotent: if the row already has an `insight`, return it unchanged.
//     2. Server pulls features from the row itself; the caller only sends id.
//     3. Payload contains no PII beyond what's already on the public Aura page.
// - `supabaseAdmin` is loaded INSIDE the handler so this module stays client-safe.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildInsightUserPrompt,
  INSIGHT_SYSTEM_PROMPT,
  isAuraInsight,
  normalizeInsight,
  type AuraInsight,
} from "./auraInsight";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const InputSchema = z.object({
  auraId: z.string().min(1),
});

export const generateAuraInsight = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }): Promise<{ insight: AuraInsight | null; cached: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Load the row.
    const { data: row, error } = await supabaseAdmin
      .from("auras")
      .select(
        "id, track_title, public_artist_name, mood_tags, detected_key, palette_name, energy_level, color_palette, visual_style, insight, visibility_mode",
      )
      .eq("id", data.auraId)
      .maybeSingle();
    if (error || !row) {
      return { insight: null, cached: false };
    }

    // 2. Idempotent — if we already have an insight, return it.
    if (isAuraInsight(row.insight)) {
      return { insight: row.insight, cached: true };
    }

    // 3. Compose the prompt from the row.
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      console.error("[generateAuraInsight] missing LOVABLE_API_KEY");
      return { insight: null, cached: false };
    }

    const visual = (row.visual_style ?? {}) as {
      motion?: string;
      texture?: string;
      motionKeywords?: string[];
      tempoBand?: string;
      density?: string;
    };
    const palette = (row.color_palette ?? {}) as {
      primary?: string;
      secondary?: string;
      accent?: string;
      swatches?: string[];
    };
    const swatches = Array.isArray(palette.swatches)
      ? palette.swatches
      : [palette.primary, palette.secondary, palette.accent].filter(Boolean) as string[];

    const anon = row.visibility_mode === "anonymous";
    const moods = Array.isArray(row.mood_tags) ? (row.mood_tags as string[]) : [];

    const userPrompt = buildInsightUserPrompt({
      trackTitle: row.track_title,
      artistName: anon ? undefined : row.public_artist_name ?? undefined,
      paletteKey: row.palette_name ?? "unknown",
      paletteName: row.palette_name ?? undefined,
      moodTags: moods,
      musicalKey: row.detected_key ?? undefined,
      tempoBand: visual.tempoBand,
      density: visual.density,
      energyLevel: row.energy_level ?? undefined,
      motionKeywords: visual.motionKeywords,
      swatches,
      motion: visual.motion,
      texture: visual.texture,
    });

    // 4. Call the Lovable AI Gateway with JSON mode.
    let insight: AuraInsight | null = null;
    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.5,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: INSIGHT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`[generateAuraInsight] gateway ${res.status}`, body.slice(0, 500));
        return { insight: null, cached: false };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content ?? "";
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Try to extract a JSON object from the response as a fallback.
        const m = content.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            parsed = JSON.parse(m[0]);
          } catch {
            /* noop */
          }
        }
      }
      insight = normalizeInsight(parsed);
      if (insight) {
        insight.generatedAt = new Date().toISOString();
        insight.model = MODEL;
      }
    } catch (e) {
      console.error("[generateAuraInsight] fetch failed", e);
      return { insight: null, cached: false };
    }

    if (!insight) return { insight: null, cached: false };

    // 5. Persist. Best-effort — a write failure just means the next visit
    //    will regenerate.
    const { error: upErr } = await supabaseAdmin
      .from("auras")
      .update({ insight })
      .eq("id", data.auraId)
      // Only write if the column is still null — protects against races.
      .is("insight", null);
    if (upErr) console.warn("[generateAuraInsight] insight upsert failed", upErr);

    return { insight, cached: false };
  });
