import { useState } from "react";
import { Share2, Copy, Check, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuracleStoryDialog } from "./AuracleStoryDialog";
import { PROJECT_TYPE_LABELS, type Auracle } from "@/lib/auracle";

export function AuracleShareDialog({
  auracle,
  open,
  onOpenChange,
}: {
  auracle: Auracle;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/auracle/${auracle.id}`
      : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Auracle link copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  const native = async () => {
    try {
      await navigator.share({
        title: `${auracle.title} — ${auracle.artistName}`,
        url,
      });
      onOpenChange(false);
    } catch {
      /* cancelled */
    }
  };

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card/85 backdrop-blur-2xl border-border/60 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Share Auracle
            </DialogTitle>
            <DialogDescription>
              {PROJECT_TYPE_LABELS[auracle.projectType]} · {auracle.auraIds.length} Auras
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/40 p-2 pl-4">
              <span className="flex-1 truncate text-sm text-muted-foreground">
                {url}
              </span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-full bg-aura-gradient px-3.5 h-9 text-xs font-medium text-primary-foreground"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy Auracle Link"}
              </button>
            </div>

            <button
              onClick={() => {
                onOpenChange(false);
                setStoryOpen(true);
              }}
              className="w-full inline-flex items-center justify-between gap-2 rounded-2xl glass-strong px-4 h-12 text-sm hover:bg-foreground/[0.06] transition-colors"
            >
              <span className="inline-flex items-center gap-2.5">
                <Sparkles className="h-4 w-4" /> View Story Preview
              </span>
              <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                9:16
              </span>
            </button>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/30 h-11 text-sm hover:bg-foreground/5 transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Open Public Auracle Page
            </a>

            {canShare && (
              <button
                onClick={native}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/40 h-11 text-sm hover:bg-foreground/5 transition-colors"
              >
                <Share2 className="h-4 w-4" /> Share via device
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AuracleStoryDialog
        auracle={auracle}
        open={storyOpen}
        onOpenChange={setStoryOpen}
      />
    </>
  );
}
