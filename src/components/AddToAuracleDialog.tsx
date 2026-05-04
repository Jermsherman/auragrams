import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Check, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  addAuraToAuracle,
  getSavedAuracles,
  PROJECT_TYPE_LABELS,
  type Auracle,
} from "@/lib/auracle";

export function AddToAuracleDialog({
  auraId,
  open,
  onOpenChange,
}: {
  auraId: string;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const nav = useNavigate();
  const [auracles, setAuracles] = useState<Auracle[]>([]);

  useEffect(() => {
    if (open) setAuracles(getSavedAuracles());
  }, [open]);

  const toggle = (a: Auracle) => {
    if (a.auraIds.includes(auraId)) {
      toast.message("Already in this Auracle");
      return;
    }
    addAuraToAuracle(a.id, auraId);
    setAuracles(getSavedAuracles());
    toast.success("Added to Auracle.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/85 backdrop-blur-2xl border-border/60">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add to Auracle</DialogTitle>
          <DialogDescription>
            Group this Aura into a curated project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-1 max-h-[50vh] overflow-y-auto">
          {auracles.length === 0 && (
            <div className="rounded-2xl border border-border/60 bg-background/30 p-5 text-center text-sm text-muted-foreground">
              No Auracles yet.
            </div>
          )}
          {auracles.map((a) => {
            const inThis = a.auraIds.includes(auraId);
            return (
              <button
                key={a.id}
                onClick={() => toggle(a)}
                className="w-full flex items-center gap-3 rounded-2xl border border-border/60 bg-background/30 p-3 hover:bg-foreground/5 transition-colors text-left"
              >
                <div className="h-10 w-10 grid place-items-center rounded-full bg-aura-gradient/20">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {PROJECT_TYPE_LABELS[a.projectType]} · {a.auraIds.length} Auras
                  </div>
                </div>
                {inThis ? (
                  <Check className="h-4 w-4 text-foreground/80" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            onOpenChange(false);
            nav({ to: "/auracle/create", search: { seed: auraId } });
          }}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full h-11 text-sm font-medium text-primary-foreground bg-aura-gradient"
        >
          <Plus className="h-4 w-4" /> Create New Auracle
        </button>
      </DialogContent>
    </Dialog>
  );
}
