import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Aurascope } from "./Aurascope";
import { deleteAura, type SavedAura } from "@/lib/farm";
import { getPersonality } from "@/lib/aura";
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
  const p = getPersonality(aura.palette);

  const isRaw = aura.sourceType === "raw_recording";
  const sourceBadge = isRaw
    ? "Raw Aura"
    : aura.sourceType === "upload"
      ? "Uploaded Audio"
      : aura.platformName ?? "External Link";

  const remove = () => {
    deleteAura(aura.id);
    onDeleted(aura.id);
    toast.success("Aura deleted.");
    setOpen(false);
  };

  return (
    <div
      className="group relative rounded-3xl p-5 flex flex-col items-center text-center glass ring-1 ring-foreground/10 hover:-translate-y-0.5 transition-transform overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${p.atmosphere}, transparent 70%)`,
      }}
    >
      <div className="absolute inset-x-5 top-3 flex items-center justify-between">
        <span
          className={
            isRaw
              ? "rounded-full px-2 h-5 inline-flex items-center bg-aura-gradient text-primary-foreground text-[9px] uppercase tracking-[0.24em]"
              : "text-[9px] uppercase tracking-[0.28em] text-muted-foreground"
          }
        >
          {sourceBadge}
        </span>
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

      {aura.moodTags.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
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

      <div className="mt-4 w-full flex items-center gap-2">
        <Link
          to="/aura/$id"
          params={{ id: aura.id }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-aura-gradient text-primary-foreground h-10 px-4 text-xs font-medium shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.9)]"
        >
          Open AuraLink <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

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
              <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
