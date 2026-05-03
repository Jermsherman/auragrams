import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

export function ShareDialog({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  const native = async () => {
    try {
      await navigator.share({ title, url });
      setOpen(false);
    } catch {
      // user cancelled
    }
  };

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Share"
          className="inline-flex items-center gap-2 rounded-full glass px-4 h-10 text-sm hover:bg-foreground/10 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-card/80 backdrop-blur-xl border-border/60">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Share this aura</DialogTitle>
          <DialogDescription>Made to be shared.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 p-2 pl-4">
            <span className="flex-1 truncate text-sm text-muted-foreground">{url}</span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-aura-gradient px-3 h-9 text-xs font-medium text-primary-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          {canShare && (
            <button
              onClick={native}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/40 h-11 text-sm hover:bg-foreground/5 transition-colors"
            >
              <Share2 className="h-4 w-4" /> Share via device
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
