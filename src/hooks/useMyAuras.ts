import { useEffect, useState } from "react";
import { getSavedAuras, type SavedAura } from "@/lib/farm";
import { hydrateSavedAuraAudioUrls, listMyAuras, mapAuraRowToSaved } from "@/lib/cloudAura";

export function useMyAuras(profileId?: string) {
  const [auras, setAuras] = useState<SavedAura[] | null>(null);

  useEffect(() => {
    setAuras(getSavedAuras());
    if (!profileId) return;

    let cancelled = false;
    void (async () => {
      try {
        const mapped = (await listMyAuras(profileId)).map(mapAuraRowToSaved);
        await hydrateSavedAuraAudioUrls(mapped);
        if (cancelled) return;
        const merged = new Map<string, SavedAura>();
        for (const aura of getSavedAuras()) merged.set(aura.id, aura);
        for (const aura of mapped) merged.set(aura.id, aura);
        setAuras(Array.from(merged.values()).sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return { auras, setAuras };
}