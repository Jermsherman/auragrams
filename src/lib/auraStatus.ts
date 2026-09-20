// Publishing status for an Aura. Separate from `visibility_mode`, which only
// controls whether the artist's identity is displayed.

import { supabase } from "@/integrations/supabase/client";

export type AuraStatus = "draft" | "unlisted" | "public";

export const AURA_STATUS_META: Record<
  AuraStatus,
  { label: string; blurb: string }
> = {
  draft: {
    label: "Draft",
    blurb: "Only you can see this Aura. Nobody else can open the link.",
  },
  unlisted: {
    label: "Unlisted",
    blurb:
      "Anyone with the exact link can open and play it. It never shows up in Discover, profiles or search.",
  },
  public: {
    label: "Public",
    blurb: "Anyone can find and play it. It can appear in Discover and on your profile.",
  },
};

export function isAuraStatus(v: unknown): v is AuraStatus {
  return v === "draft" || v === "unlisted" || v === "public";
}

export async function updateAuraStatus(auraId: string, status: AuraStatus): Promise<void> {
  const { error } = await supabase.from("auras").update({ status }).eq("id", auraId);
  if (error) throw error;
}
