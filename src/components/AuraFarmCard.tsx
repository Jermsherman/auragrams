import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2, ArrowUpRight, Wand2, Sparkles, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Aurascope } from "./Aurascope";
import { AddToAuraLinkDialog } from "./AddToAuraLinkDialog";
import { deleteAura as deleteAuraLocal, type SavedAura } from "@/lib/farm";
import { deleteAura as deleteAuraCloud, deleteAuraAudio } from "@/lib/cloudAura";
import { useAuth } from "@/hooks/useAuth";
import { getPersonality } from "@/lib/aura";
import { computeAuraTraits } from "@/lib/auraTraits";
import { TraitChipStrip } from "./TraitSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AuraFarmCard({
  aura,
  onDeleted,
}: {
  aura: SavedAura;
  onDeleted: (id: string) => void;
}) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const p = getPersonality(aura.palette);

  const isRaw = aura.sourceType === "raw_recording";
  const sourceBadge = isRaw
    ? "Raw Aura"
    : aura.sourceType === "upload"
      ? "Uploaded Audio"
      : aura.platformName ?? "External Link";

  const isOwner = !!profile?.id && (!aura.userId || aura.userId === profile.id);

  const remove = async () => {
    setDeleting(true);
    try {
      if (isOwner) {
        try {
          await deleteAuraCloud(aura.id, profile?.id);
        } catch (e) {
          console.error(e);
          toast.error("Couldn't remove from cloud. Removed locally.");
        }
        try {
          await deleteAuraAudio(aura.audioStoragePath);
        } catch (e) {
          console.error("audio delete failed", e);
          toast.warning("Aura deleted, but the audio file couldn't be removed. Try again later.");
        }
      }
      deleteAuraLocal(aura.id);
      onDeleted(aura.id);
      toast.success("Aura deleted.");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <div
      className="group relative rounded-3xl p-5 flex flex-col items-center text-center glass ring-1 ring-foreground/10 hover:-translate-y-0.5 transition-transform overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${p.atmosphere}, transparent 70%)`,
      }}
    >
      <div className="absolute inset-x-5 top-3 flex items-center justify-between gap-2">
        <span
          className={
            isRaw
              ? "rounded-full px-2 h-5 inline-flex items-center bg-aura-gradient text-primary-foreground text-[9px] uppercase tracking-[0.24em]"
              : "text-[9px] uppercase tracking-[0.28em] text-muted-foreground"
          }
        >
          {sourceBadge}
        </span>
        <div className="flex items-center gap-1">
          {aura.colorGuided && (
            <span className="rounded-full border border-foreground/15 bg-background/40 px-1.5 h-5 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-foreground/80">
              <Sparkles className="h-2.5 w-2.5" /> Color-guided
            </span>
          )}
          {aura.visibilityMode === "anonymous" && (
            <span className="rounded-full border border-foreground/15 bg-background/40 px-1.5 h-5 inline-flex items-center text-[9px] uppercase tracking-[0.2em] text-foreground/80">
              Anonymous
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 mb-1">
        <Aurascope
          aura={{
            id: aura.id,
            palette: aura.palette,
            seed: aura.seed,
            auraName: aura.auraName,
            trackTitle: aura.trackTitle,
            artistName: aura.artistName,
            colors: aura.colors,
          }}
          size="small"
          mode="minimal"
        />
      </div>

      <div className="mt-3 min-w-0 w-full">
        <div className="font-display text-base sm:text-lg truncate text-aura-gradient">
          {aura.auraName}
        </div>
        <div className="mt-0.5 text-sm font-medium truncate">{aura.trackTitle}</div>
        <div className="text-xs text-muted-foreground truncate">{aura.artistName}</div>
      </div>

      <div className="mt-3 flex justify-center">
        <TraitChipStrip traits={computeAuraTraits(aura)} />
      </div>


      <div className="mt-4 w-full flex items-center gap-2">
        <Link
          to="/aura/$id"
          params={{ id: aura.id }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-aura-gradient text-primary-foreground h-10 px-4 text-xs font-medium shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.9)]"
        >
          Open AuraLink <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        <Link
          to="/aura/$id/influence"
          params={{ id: aura.id }}
          aria-label="Influence Aura"
          title="Influence Aura"
          className="rounded-full h-10 w-10 grid place-items-center border border-border/60 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Wand2 className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Add to AuraLink"
          title="Add to AuraLink"
          className="rounded-full h-10 w-10 grid place-items-center border border-border/60 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Link2 className="h-4 w-4" />
        </button>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <button
              aria-label="Delete aura"
              className="rounded-full h-10 w-10 grid place-items-center border border-border/60 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card/85 backdrop-blur-2xl border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this Aura from your Farm?</AlertDialogTitle>
              <AlertDialogDescription>
                This only removes it from your local collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <AddToAuraLinkDialog aura={aura} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
