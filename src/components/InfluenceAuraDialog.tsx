// Influence Aura, but as a modal dialog. Same logic as the previous
// /aura/$id/influence route, but in-place — so users can shape mood,
// color, vibe note, and identity right after generating an Aura.

import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Aurascope } from "@/components/Aurascope";
import { MoodPicker } from "@/components/MoodPicker";
import { ColorInfluence } from "@/components/ColorInfluence";
import { IdentitySelector } from "@/components/IdentitySelector";
import { generateAura, type UserColorInfluence } from "@/lib/aura";
import { updateTrack, type Track } from "@/lib/tracks";
import { isAuraSaved, saveAuraFromTrack } from "@/lib/farm";
import { saveAuraToCloud } from "@/lib/cloudAura";
import { useAuth } from "@/hooks/useAuth";
import type { VisibilityMode, ArtistProfile } from "@/lib/identity";

const DEFAULT_INFLUENCE: UserColorInfluence = {
  mode: "surprise",
  colors: [],
  description: "",
};

type Props = {
  track: Track;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when influence has been applied; receives the patched track. */
  onApplied?: (track: Track) => void;
};

export function InfluenceAuraDialog({ track, open, onOpenChange, onApplied }: Props) {
  const { profile } = useAuth();
  const [moods, setMoods] = useState<string[]>(track.moods ?? []);
  const [influence, setInfluence] = useState<UserColorInfluence>(
    track.userColorInfluence ?? DEFAULT_INFLUENCE,
  );
  const [vibeNote, setVibeNote] = useState(track.influenceSettings?.vibeNote ?? "");
  const [identity, setIdentity] = useState<{
    mode: VisibilityMode;
    artistProfileId: string | null;
  }>({
    mode: (track.visibilityMode as VisibilityMode) ?? "artist",
    artistProfileId: null,
  });
  const [resolved, setResolved] = useState<{
    artistProfile: ArtistProfile | null;
    publicArtistName: string;
    publicHandle: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset state whenever a different track or fresh open occurs.
  useEffect(() => {
    if (!open) return;
    setMoods(track.moods ?? []);
    setInfluence(track.userColorInfluence ?? DEFAULT_INFLUENCE);
    setVibeNote(track.influenceSettings?.vibeNote ?? "");
    setIdentity({
      mode: (track.visibilityMode as VisibilityMode) ?? "artist",
      artistProfileId: null,
    });
  }, [open, track]);

  const preview = useMemo(
    () =>
      generateAura({
        id: track.id + "-preview",
        title: track.title,
        artist: track.artist,
        moods,
        detectedKey: track.detectedKey ?? null,
        pitchCenter: track.pitchCenter ?? null,
        energyOverride: track.energy,
        sourceType: track.sourceType,
        userColorInfluence: influence,
        vibeSeed: vibeNote,
      }),
    [track, moods, influence, vibeNote],
  );

  const previewVibe = preview.vibeDescription;

  const previewAura = {
    id: track.id,
    palette: preview.palette,
    seed: track.seed,
    auraName: preview.auraName,
    trackTitle: track.title,
    artistName: track.artist,
    colors: preview.colors,
    isAnonymous: identity.mode === "anonymous",
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalVibe = preview.vibeDescription;
      const patch: Partial<Track> = {
        moods,
        userColorInfluence: influence,
        colorGuided: preview.colorGuided,
        auraName: preview.auraName,
        paletteName: preview.paletteName,
        colors: preview.colors,
        palette: preview.palette,
        description: preview.description,
        vibeDescription: finalVibe,
        motionKeywords: preview.motionKeywords,
        density: preview.density,
        tempoBand: preview.tempoBand,
        visibilityMode: identity.mode,
        influenceSettings: {
          moodTags: moods,
          userColorInfluence: influence,
          vibeNote: vibeNote.trim(),
          visibilityMode: identity.mode,
          updatedAt: new Date().toISOString(),
        },
      };
      updateTrack(track.id, patch);
      const updated: Track = { ...track, ...patch };

      const wasSaved = isAuraSaved(track.id);
      if (wasSaved) saveAuraFromTrack(updated);

      if (profile && (wasSaved || resolved)) {
        try {
          const saved = saveAuraFromTrack(updated);
          await saveAuraToCloud({
            saved,
            userId: profile.id,
            visibilityMode: identity.mode,
            artistProfileId:
              identity.mode === "artist" ? identity.artistProfileId : null,
            publicArtistName:
              identity.mode !== "anonymous" ? resolved?.publicArtistName ?? null : null,
            publicHandle:
              identity.mode !== "anonymous" ? resolved?.publicHandle ?? null : null,
          });
        } catch {
          /* keep local */
        }
      }

      toast.success("Aura updated.");
      onApplied?.(updated);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/90 backdrop-blur-2xl border-border/60 max-w-2xl w-[calc(100%-1.5rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">
            <span className="text-aura-gradient">Edit Aura details</span>
          </DialogTitle>
          <DialogDescription>
            Reshape mood, color, vibe, and identity. Changes update the Aura everywhere.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[1fr_220px] gap-5 mt-2">
          <div className="space-y-5">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                Mood
              </h3>
              <MoodPicker
                value={moods}
                onChange={setMoods}
                glowColor={preview.colors?.glow}
              />
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                Color influence
              </h3>
              <ColorInfluence value={influence} onChange={setInfluence} />
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                Vibe note
              </h3>
              <textarea
                value={vibeNote}
                onChange={(e) => setVibeNote(e.target.value.slice(0, 240))}
                rows={3}
                maxLength={240}
                placeholder="Describe what this track feels like…"
                className="w-full rounded-xl bg-background/40 border border-border/60 px-3 py-2 text-sm italic outline-none focus:border-foreground/25 resize-none"
              />
              <div className="mt-1 flex justify-end">
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {vibeNote.length}/240
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                Public identity
              </h3>
              <IdentitySelector
                value={identity}
                onChange={setIdentity}
                onResolve={setResolved}
              />
            </div>
          </div>

          <aside className="md:sticky md:top-0 md:self-start space-y-3 text-center">
            <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Live preview
            </div>
            <div className="grid place-items-center">
              <Aurascope aura={previewAura} size="small" mode="card" showLabel={false} />
            </div>
            <div>
              <div className="font-display text-lg">
                <span className="text-aura-gradient">{preview.auraName}</span>
              </div>
              {preview.colors && (
                <div className="mt-2 flex justify-center gap-1.5">
                  {(preview.colors.swatches ?? []).map((c, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full ring-1 ring-foreground/15"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              )}
              {preview.paletteName && (
                <div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {preview.paletteName}
                </div>
              )}
              {previewVibe && (
                <p className="mt-2 text-[11px] italic text-muted-foreground line-clamp-3">
                  “{previewVibe}”
                </p>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-border/60">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center rounded-full h-10 px-4 text-sm hover:bg-foreground/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || moods.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full h-10 px-5 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Apply
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
