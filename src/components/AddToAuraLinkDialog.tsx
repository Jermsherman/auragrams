import { useEffect, useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import {
  listMyAuraLinks,
  updateAuraLink,
} from "@/lib/auralinkService";
import type { AuraLinkPage } from "@/lib/auralink";
import type { SavedAura } from "@/lib/farm";
import { updateAuraStatus, type AuraStatus } from "@/lib/auraStatus";

export function AddToAuraLinkDialog({
  aura,
  open,
  onOpenChange,
}: {
  aura: Pick<SavedAura, "id"> & { id: string; status?: AuraStatus };
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const { profile } = useAuth();
  const [pages, setPages] = useState<AuraLinkPage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<AuraLinkPage | null>(null);
  const isDraft = aura.status === "draft";

  useEffect(() => {
    if (!open) setPending(null);
  }, [open]);

  useEffect(() => {
    if (!open || !profile?.id) return;
    let cancelled = false;
    setPages(null);
    listMyAuraLinks(profile.id)
      .then((rows) => {
        if (!cancelled) setPages(rows);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, profile?.id]);

  const addToPage = async (p: AuraLinkPage, publishUnlisted: boolean, confirmed = false) => {
    if (!profile?.id) {
      toast.error("You need to sign in to do that.");
      return;
    }
    if (p.selectedAuraIds.includes(aura.id)) {
      toast.info("Aura already in this AuraLink.");
      return;
    }
    // Drafts preview in the builder but are dropped from the public /l/ page.
    if (isDraft && !publishUnlisted && !confirmed) {
      setPending(p);
      return;
    }
    setBusy(true);
    try {
      if (publishUnlisted) {
        await updateAuraStatus(aura.id, "unlisted");
      }
      await updateAuraLink(p.id, profile.id, {
        selectedAuraIds: [...p.selectedAuraIds, aura.id],
        mode: p.mode === "streaming_links" ? "mixed" : p.mode,
      });
      toast.success(
        publishUnlisted ? `Published as unlisted and added to ${p.title}` : `Added to ${p.title}`,
      );
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Could not add to AuraLink. Please try again.");
    } finally {
      setBusy(false);
    }
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
          {isDraft && (
            <div role="status" className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              This Aura is a draft. The public AuraLink only shows unlisted or public Auras, so adding it as-is leaves the live page without it.
            </div>
          )}
          {pending && (
            <div className="rounded-2xl border border-border/60 bg-background/30 px-4 py-3">
              <p className="text-sm font-medium">Add to {pending.title}?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Publish it as unlisted so anyone with the AuraLink can play it, or add the draft knowing visitors will not see it.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => addToPage(pending, true)}
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-aura-gradient text-primary-foreground h-11 text-sm font-medium disabled:opacity-60"
                >
                  Publish as unlisted and add
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => addToPage(pending, false, true)}
                  className="w-full inline-flex items-center justify-center rounded-2xl border border-border/60 h-11 text-sm disabled:opacity-60"
                >
                  Add as draft anyway
                </button>
              </div>
            </div>
          )}
          {pages === null ? (
            <div className="rounded-2xl border border-border/60 bg-background/30 p-5 text-center text-xs text-muted-foreground">
              Loading your AuraLinks…
            </div>
          ) : pages.length === 0 ? (
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
                onClick={() => (isDraft ? setPending(p) : addToPage(p, false))}
                disabled={busy}
                className="w-full text-left rounded-2xl border border-border/60 bg-background/30 px-4 py-3 hover:bg-foreground/5 transition-colors disabled:opacity-60"
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
