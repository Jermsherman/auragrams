// Wraps AuraShareCard in a dialog with Story/Square variants, download,
// copy-to-clipboard, and native share. Pure client-side capture — no server.

import { useMemo, useRef, useState } from "react";
import { Download, Copy, Share2, X, Instagram, Twitter } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuraShareCard, type ShareVariant } from "./AuraShareCard";
import type { Track } from "@/lib/tracks";
import type { AuraInsight } from "@/lib/auraInsight";
import { computeAuraTraits } from "@/lib/auraTraits";

type Props = {
  track: Track;
  insight?: AuraInsight | null;
  shareUrl?: string | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
};

export function AuraShareDialog({ track, insight, shareUrl, open, onOpenChange }: Props) {
  const [variant, setVariant] = useState<ShareVariant>("story");
  const [busy, setBusy] = useState<null | "download" | "copy" | "share">(null);
  const ref = useRef<HTMLDivElement>(null);

  // Traits: prefer AI personality traits, fall back to deterministic engine.
  const traits = useMemo(() => {
    if (insight?.personalityTraits?.length) {
      return insight.personalityTraits.slice(0, 3).map((t) => t.trait);
    }
    return computeAuraTraits(track).traits.slice(0, 3).map((t) => t.value);
  }, [insight, track]);

  const auraName = insight?.auraName || track.auraName;
  const story = insight?.story ?? null;

  const capture = async (): Promise<Blob | null> => {
    if (!ref.current) return null;
    const dataUrl = await toPng(ref.current, {
      cacheBust: true,
      pixelRatio: 1, // element is already at 1080px reference size
      backgroundColor: "#0a0710",
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const filename = () => `auragram-${track.artistHandle}-${variant}.png`;

  const download = async () => {
    setBusy("download");
    try {
      const blob = await capture();
      if (!blob) throw new Error("capture failed");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename();
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Aura card saved");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't export — try a screenshot instead");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    setBusy("copy");
    try {
      const blob = await capture();
      if (!blob) throw new Error("capture failed");
      const CI = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
      if (!CI || !navigator.clipboard?.write) {
        await download();
        return;
      }
      await navigator.clipboard.write([new CI({ "image/png": blob })]);
      toast.success("Copied to clipboard");
    } catch (e) {
      console.error(e);
      toast.error("Copy not supported here — downloading instead");
      await download();
    } finally {
      setBusy(null);
    }
  };

  const nativeShare = async () => {
    setBusy("share");
    try {
      const blob = await capture();
      if (!blob) throw new Error("capture failed");
      const file = new File([blob], filename(), { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData & { files?: File[] }) => boolean;
        share?: (d: ShareData & { files?: File[] }) => Promise<void>;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `My song's Aura: ${auraName}`,
          text: `${auraName} — ${track.title} · ${track.artist}`,
        });
      } else {
        await download();
      }
    } catch (e) {
      // User cancel throws AbortError — silent.
      if ((e as Error)?.name !== "AbortError") {
        console.error(e);
        toast.error("Share unavailable — downloaded instead");
        await download();
      }
    } finally {
      setBusy(null);
    }
  };

  // Preview scaling: card is 1080px wide → fit inside dialog.
  const previewScale = variant === "story" ? 0.24 : 0.26;
  const cardW = 1080;
  const cardH = variant === "story" ? 1920 : 1080;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/90 backdrop-blur-2xl border-border/60 max-w-md p-5">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle className="font-display text-xl">Share your Aura</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 hover:bg-foreground/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* Variant tabs */}
        <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-full glass p-1 text-xs">
          <button
            onClick={() => setVariant("story")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full h-8 transition-colors ${
              variant === "story"
                ? "bg-aura-gradient text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Instagram className="h-3.5 w-3.5" /> Story 9:16
          </button>
          <button
            onClick={() => setVariant("square")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full h-8 transition-colors ${
              variant === "square"
                ? "bg-aura-gradient text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Twitter className="h-3.5 w-3.5" /> Square 1:1
          </button>
        </div>

        {/* Preview */}
        <div
          className="mt-4 mx-auto rounded-2xl overflow-hidden ring-1 ring-foreground/10"
          style={{
            width: cardW * previewScale,
            height: cardH * previewScale,
          }}
        >
          <div
            style={{
              width: cardW,
              height: cardH,
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
            }}
          >
            <AuraShareCard
              ref={ref}
              variant={variant}
              auraName={auraName}
              trackTitle={track.title}
              artist={track.artist}
              palette={track.palette}
              colors={track.colors}
              traits={traits}
              story={story}
              insight={insight}
              shareUrl={shareUrl ?? null}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            onClick={download}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1.5 rounded-full h-11 text-xs font-medium text-primary-foreground bg-aura-gradient disabled:opacity-50 shadow-[0_0_40px_-10px_oklch(0.7_0.2_310/0.9)]"
          >
            <Download className="h-3.5 w-3.5" />
            {busy === "download" ? "…" : "Download"}
          </button>
          <button
            onClick={copy}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1.5 rounded-full h-11 text-xs font-medium glass hover:bg-foreground/10 transition-colors disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            {busy === "copy" ? "…" : "Copy"}
          </button>
          <button
            onClick={nativeShare}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1.5 rounded-full h-11 text-xs font-medium glass hover:bg-foreground/10 transition-colors disabled:opacity-50"
          >
            <Share2 className="h-3.5 w-3.5" />
            {busy === "share" ? "…" : "Share"}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {variant === "story" ? "1080×1920" : "1080×1080"} PNG · ready for
          {variant === "story" ? " Stories, Reels, TikTok" : " X, feeds"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
