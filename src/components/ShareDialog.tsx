import { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Sparkles,
  Music2,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { StoryPreviewDialog } from "./StoryPreviewDialog";
import { updateTrack, providerLabel, type Track, type StreamingLinks } from "@/lib/tracks";

export function ShareDialog({
  track,
  url,
  saved = false,
  onSave,
}: {
  track: Track;
  url: string;
  saved?: boolean;
  onSave?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [links, setLinks] = useState<StreamingLinks>(track.streaming ?? {});

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
      await navigator.share({ title: `${track.title} — ${track.artist}`, url });
      setOpen(false);
    } catch {
      /* cancelled */
    }
  };

  const saveLinks = () => {
    updateTrack(track.id, { streaming: links });
    toast.success("Streaming links saved");
    setShowLinks(false);
  };

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <>
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
        <DialogContent className="bg-card/85 backdrop-blur-2xl border-border/60">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Share this aura</DialogTitle>
            <DialogDescription>
              {track.hasLocalAudio
                ? "Uploaded Audio"
                : track.provider
                  ? providerLabel(track.provider)
                  : "Made to be shared."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/40 p-2 pl-4">
              <span className="flex-1 truncate text-sm text-muted-foreground">{url}</span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-full bg-aura-gradient px-3.5 h-9 text-xs font-medium text-primary-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>

            {/* Save to Farm */}
            {saved ? (
              <div className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/30 h-11 text-sm text-foreground/85">
                <BookmarkCheck className="h-4 w-4" /> Saved in Farm
              </div>
            ) : onSave ? (
              <button
                onClick={() => {
                  onSave();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl glass-strong h-11 text-sm hover:bg-foreground/[0.06] transition-colors"
              >
                <Bookmark className="h-4 w-4" /> Save to Farm
              </button>
            ) : null}

            {/* Platform actions */}
            {track.streamUrl && track.provider && track.provider !== "external" && (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={track.streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/30 h-11 text-xs hover:bg-foreground/5 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open on {providerLabel(track.provider)}
                </a>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(track.streamUrl!);
                      toast.success("Platform link copied");
                    } catch {
                      toast.error("Could not copy");
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/30 h-11 text-xs hover:bg-foreground/5 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy platform link
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setOpen(false);
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

            {canShare && (
              <button
                onClick={native}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/40 h-11 text-sm hover:bg-foreground/5 transition-colors"
              >
                <Share2 className="h-4 w-4" /> Share via device
              </button>
            )}

            {/* Streaming links */}
            <button
              onClick={() => setShowLinks((v) => !v)}
              className="w-full inline-flex items-center justify-between rounded-2xl border border-border/60 bg-background/30 px-4 h-11 text-sm hover:bg-foreground/5 transition-colors"
            >
              <span className="inline-flex items-center gap-2.5 text-foreground/85">
                <Music2 className="h-4 w-4" /> Add streaming links
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  showLinks ? "rotate-180" : ""
                }`}
              />
            </button>
            {showLinks && (
              <div className="space-y-2 pt-1 animate-fade-up">
                <LinkInput
                  label="Spotify"
                  value={links.spotify ?? ""}
                  onChange={(v) => setLinks((l) => ({ ...l, spotify: v }))}
                  placeholder="https://open.spotify.com/track/…"
                />
                <LinkInput
                  label="Apple Music"
                  value={links.apple ?? ""}
                  onChange={(v) => setLinks((l) => ({ ...l, apple: v }))}
                  placeholder="https://music.apple.com/…"
                />
                <LinkInput
                  label="SoundCloud"
                  value={links.soundcloud ?? ""}
                  onChange={(v) => setLinks((l) => ({ ...l, soundcloud: v }))}
                  placeholder="https://soundcloud.com/…"
                />
                <button
                  onClick={saveLinks}
                  className="w-full rounded-full bg-aura-gradient text-primary-foreground h-10 text-sm font-medium"
                >
                  Save links
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <StoryPreviewDialog track={track} open={storyOpen} onOpenChange={setStoryOpen} />
    </>
  );
}

function LinkInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="none"
        className="mt-1.5 w-full rounded-xl bg-background/40 border border-border/60 px-3 h-10 text-sm outline-none focus:border-foreground/25"
      />
    </label>
  );
}
