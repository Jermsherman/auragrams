import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { OrbVisual } from "./OrbVisual";
import { deleteAura, type SavedAura } from "@/lib/farm";
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
  const [open, setOpen] = useState(false);

  const sourceBadge =
    aura.sourceType === "upload"
      ? "Uploaded Audio"
      : aura.platformName ?? "External Link";

  const remove = () => {
    deleteAura(aura.id);
    onDeleted(aura.id);
    toast.success("Aura deleted.");
    setOpen(false);
  };

  return (
    <div className="group relative glass rounded-3xl p-5 flex flex-col gap-4 hover:bg-foreground/[0.04] transition-colors">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <OrbVisual size={88} palette={aura.palette} hueShift={aura.seed} particles={false} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {sourceBadge}
          </div>
          <div className="font-display text-base truncate text-aura-gradient">
            {aura.auraName}
          </div>
          <div className="mt-0.5 text-sm font-medium truncate">{aura.trackTitle}</div>
          <div className="text-xs text-muted-foreground truncate">{aura.artistName}</div>
        </div>
      </div>

      {aura.moodTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {aura.moodTags.slice(0, 3).map((m) => (
            <span
              key={m}
              className="rounded-full border border-border/60 bg-background/30 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <Link
          to="/aura/$id"
          params={{ id: aura.id }}
          className="inline-flex items-center gap-1.5 rounded-full bg-aura-gradient text-primary-foreground h-9 px-4 text-xs font-medium"
        >
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <button
              aria-label="Delete aura"
              className="rounded-full h-9 w-9 grid place-items-center border border-border/60 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card/85 backdrop-blur-2xl border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this aura from your Farm?</AlertDialogTitle>
              <AlertDialogDescription>
                This only removes it from your local collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
