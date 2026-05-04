import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2, ArrowUpRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import { StackedOrbs } from "./StackedOrbs";
import { AuracleShareDialog } from "./AuracleShareDialog";
import {
  deleteAuracle,
  getMembers,
  PROJECT_TYPE_LABELS,
  type Auracle,
} from "@/lib/auracle";
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

export function AuracleCard({
  auracle,
  onDeleted,
}: {
  auracle: Auracle;
  onDeleted: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const members = getMembers(auracle.auraIds);
  const p = getPersonality(auracle.dominantPalette);

  const remove = () => {
    deleteAuracle(auracle.id);
    onDeleted(auracle.id);
    toast.success("Auracle deleted.");
    setOpen(false);
  };

  return (
    <div
      className="group relative rounded-3xl p-5 flex flex-col aspect-[4/5] glass ring-1 ring-foreground/10 hover:-translate-y-0.5 transition-transform overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, ${p.atmosphere}, transparent 70%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.24em] text-foreground/80">
          {PROJECT_TYPE_LABELS[auracle.projectType]}
        </span>
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {auracle.auraIds.length} Auras
        </span>
      </div>

      <div className="flex-1 grid place-items-center">
        <StackedOrbs
          items={members.map((m) => ({ palette: m.palette, seed: m.seed }))}
          size={84}
          max={3}
        />
      </div>

      <div className="text-center">
        <div className="font-display text-lg truncate text-aura-gradient">
          {auracle.title}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {auracle.artistName}
        </div>
      </div>

      {auracle.moodTagsSummary.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {auracle.moodTagsSummary.slice(0, 3).map((m) => (
            <span
              key={m}
              className="rounded-full border border-border/60 bg-background/30 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Link
          to="/auracle/$id"
          params={{ id: auracle.id }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-aura-gradient text-primary-foreground h-10 px-4 text-xs font-medium shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.9)]"
        >
          Open Auracle <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={() => setShareOpen(true)}
          aria-label="Share Auracle"
          className="rounded-full h-10 w-10 grid place-items-center border border-border/60 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <button
              aria-label="Delete auracle"
              className="rounded-full h-10 w-10 grid place-items-center border border-border/60 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card/85 backdrop-blur-2xl border-border/60">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this Auracle?</AlertDialogTitle>
              <AlertDialogDescription>
                The Auras inside stay in your Farm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <AuracleShareDialog
        auracle={auracle}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </div>
  );
}
