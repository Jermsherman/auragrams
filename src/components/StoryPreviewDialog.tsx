import { useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StoryCanvas } from "./StoryCanvas";
import { providerLabel as labelFor, type Track } from "@/lib/tracks";

export function StoryPreviewDialog({
  track,
  open,
  onOpenChange,
}: {
  track: Track;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      // Render at 2x for crisper output
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a0710",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `auragram-${track.artistHandle}-${track.id}.png`;
      a.click();
      toast.success("Story saved");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't export — try a screenshot instead");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/85 backdrop-blur-2xl border-border/60 max-w-sm p-5">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle className="font-display text-xl">Story Preview</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 hover:bg-foreground/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="mt-1 mx-auto w-full max-w-[260px]">
          <StoryCanvas
            ref={ref}
            title={track.title}
            artist={track.artist}
            mood={track.moods?.[0]}
            palette={track.palette}
            platformName={
              track.provider && track.provider !== "external" && !track.hasLocalAudio
                ? labelFor(track.provider)
                : undefined
            }
          />
        </div>

        <button
          onClick={download}
          disabled={busy}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full h-11 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-50 shadow-[0_0_40px_-10px_oklch(0.7_0.2_310/0.9)]"
        >
          <Download className="h-4 w-4" />
          {busy ? "Rendering…" : "Download Story Preview"}
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          1080×1920 PNG · ready for Stories & Reels
        </p>
      </DialogContent>
    </Dialog>
  );
}
