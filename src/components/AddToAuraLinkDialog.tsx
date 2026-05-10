import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAuraLinks,
  updateAuraLink,
  type AuraLinkPage,
} from "@/lib/auralink";
import type { SavedAura } from "@/lib/farm";

export function AddToAuraLinkDialog({
  aura,
  open,
  onOpenChange,
}: {
  aura: Pick<SavedAura, "id"> & { id: string };
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [tick, setTick] = useState(0);
  const pages = useMemo<AuraLinkPage[]>(
    () => (open ? getAuraLinks() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, tick],
  );

  const addToPage = (p: AuraLinkPage) => {
    if (p.selectedAuraIds.includes(aura.id)) {
      toast.info("Aura already in this AuraLink.");
      return;
    }
    updateAuraLink(p.id, {
      selectedAuraIds: [...p.selectedAuraIds, aura.id],
      mode: p.mode === "streaming_links" ? "mixed" : p.mode,
    });
    setTick((t) => t + 1);
    toast.success(`Added to ${p.title}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/85 backdrop-blur-2xl border-border/60 max-w-[calc(100vw-1.5rem)] sm:max-w-sm overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Add to AuraLink
          </DialogTitle>
          <DialogDescription>
            Choose an existing AuraLink page or build a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {pages.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/30 p-5 text-center">
              <h3 className="font-display text-lg">No AuraLinks yet.</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Build your first music-first link page.
              </p>
            </div>
          ) : (
            pages.map((p) => (
              <button
                key={p.id}
                onClick={() => addToPage(p)}
                className="w-full text-left rounded-2xl border border-border/60 bg-background/30 px-4 py-3 hover:bg-foreground/5 transition-colors"
              >
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  /l/{p.handleSlug} · {p.selectedAuraIds.length} Auras ·{" "}
                  {(p.streamingLinks?.length ?? 0) + (p.customLinks?.length ?? 0) + (p.socialLinks?.length ?? 0)} links
                </div>
              </button>
            ))
          )}

          <Link
            to="/auralink/create"
            onClick={() => onOpenChange(false)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-aura-gradient text-primary-foreground h-11 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Build new AuraLink
          </Link>
          <Link
            to="/auralink/create"
            onClick={() => onOpenChange(false)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 h-11 text-xs uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Wand2 className="h-3.5 w-3.5" /> Open Builder
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
