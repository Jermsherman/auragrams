import { forwardRef, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuracleOrb } from "./AuracleOrb";
import { OrbVisual } from "./OrbVisual";
import { Aurascope } from "./Aurascope";
import mark from "@/assets/auragram-mark.png";
import { getMembers, PROJECT_TYPE_LABELS, type Auracle } from "@/lib/auracle";
import { getPersonality } from "@/lib/aura";

export function AuracleStoryDialog({
  auracle,
  open,
  onOpenChange,
}: {
  auracle: Auracle;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const members = getMembers(auracle.auraIds);

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a0710",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `auragram-auracle-${auracle.id}.png`;
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
          <AuracleStoryCanvas
            ref={ref}
            auracle={auracle}
            members={members}
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

type CanvasProps = {
  auracle: Auracle;
  members: { palette: string; seed: number }[];
};

const AuracleStoryCanvas = forwardRef<HTMLDivElement, CanvasProps>(
  function AuracleStoryCanvas({ auracle, members }, ref) {
    const p = getPersonality(auracle.dominantPalette);
    const mini = members.slice(0, 5);
    return (
      <div
        ref={ref}
        className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl"
        style={{
          background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${p.stops[0]}, transparent 60%), radial-gradient(ellipse 80% 60% at 50% 110%, ${p.stops[2]}, transparent 60%), oklch(0.09 0.02 290)`,
        }}
      >
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-90">
          <img src={mark} alt="" className="h-5 w-5 object-contain" crossOrigin="anonymous" />
          <span className="wordmark text-[10px] text-foreground/85">Auragram</span>
        </div>

        <div className="absolute inset-x-0 top-[18%] grid place-items-center">
          <AuracleOrb
            members={members.map((m) => ({ palette: m.palette as never, seed: m.seed }))}
            dominant={auracle.dominantPalette}
            size="62%"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 pb-9 flex flex-col items-center text-center">
          <span className="rounded-full border border-foreground/15 bg-background/30 backdrop-blur px-3 h-6 inline-flex items-center text-[10px] uppercase tracking-[0.24em] text-foreground/85">
            {PROJECT_TYPE_LABELS[auracle.projectType]}
          </span>
          <h2 className="mt-3 font-display text-2xl tracking-tight max-w-[85%] line-clamp-2">
            {auracle.title}
          </h2>
          <p className="mt-1 text-sm text-foreground/75">{auracle.artistName}</p>

          {mini.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2">
              {mini.map((m, i) => (
                <Aurascope
                  key={i}
                  aura={{ palette: m.palette as never, seed: m.seed }}
                  size="mini"
                  mode="minimal"
                  style={{ width: 28, height: 28 }}
                />
              ))}
            </div>
          )}

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground px-5 h-9 text-[11px] font-medium uppercase tracking-[0.24em]">
            Listen to the Auracle
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.32em] text-foreground/60">
            Open on Auragram
          </div>
        </div>
      </div>
    );
  },
);
