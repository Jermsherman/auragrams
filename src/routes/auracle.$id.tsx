import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Share2, Sparkles, Trash2, Copy, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { OrbVisual } from "@/components/OrbVisual";
import { Aurascope } from "@/components/Aurascope";
import { AuracleOrb } from "@/components/AuracleOrb";
import { AuraAtmosphere } from "@/components/AuraAtmosphere";
import { AuracleShareDialog } from "@/components/AuracleShareDialog";
import { AuracleStoryDialog } from "@/components/AuracleStoryDialog";
import {
  deleteAuracle,
  getAuracle,
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

export const Route = createFileRoute("/auracle/$id")({
  head: () => ({
    meta: [
      { title: "Auracle Project — Auragram" },
      {
        name: "description",
        content:
          "Explore this living music project on Auragram — a curated collection of unique Auras and sonic identities.",
      },
      { property: "og:title", content: "Auracle Project — Auragram" },
      {
        property: "og:description",
        content:
          "A curated collection of Auras — share this living music project anywhere.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuraclePage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <h1 className="font-display text-3xl">Auracle not found</h1>
        <p className="mt-2 text-muted-foreground">
          This Auracle isn't available on this device.
        </p>
        <Link
          to="/farm"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm bg-aura-gradient text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Farm
        </Link>
      </div>
    </div>
  ),
});

function AuraclePage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [auracle, setAuracle] = useState<Auracle | null | undefined>(undefined);
  const [shareOpen, setShareOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  useEffect(() => {
    setAuracle(getAuracle(id));
  }, [id]);

  if (auracle === undefined) {
    return (
      <div className="min-h-screen grid place-items-center">
        <OrbVisual size={140} className="opacity-60" />
      </div>
    );
  }
  if (auracle === null) throw notFound();

  const members = getMembers(auracle.auraIds);
  const p = getPersonality(auracle.dominantPalette);

  const handleDelete = () => {
    deleteAuracle(auracle.id);
    toast.success("Auracle deleted.");
    nav({ to: "/farm" });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Auracle link copied.");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AuraAtmosphere personality={p} />

      <header className="px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between gap-3 relative z-10">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 rounded-full glass px-3 sm:px-4 h-10 text-xs sm:text-sm hover:bg-foreground/10 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share Auracle</span>
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                aria-label="Delete Auracle"
                className="inline-flex items-center gap-2 rounded-full glass px-3 h-10 text-xs hover:bg-foreground/10 transition-colors"
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
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-10 text-center relative z-10">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {PROJECT_TYPE_LABELS[auracle.projectType]} · Auracle
          </div>
        </div>

        <div className="relative mt-6 animate-fade-up">
          <AuracleOrb
            members={members.map((m) => ({ palette: m.palette, seed: m.seed }))}
            dominant={auracle.dominantPalette}
            size="min(82vw, 460px)"
          />
        </div>

        <div className="mt-10 max-w-md mx-auto animate-fade-up">
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            {auracle.title}
          </h1>
          <p className="mt-2 text-muted-foreground tracking-wide">
            {auracle.artistName}
          </p>
          {(auracle.description || auracle.auracleDescription) && (
            <p className="mt-4 text-sm text-muted-foreground">
              {auracle.description || auracle.auracleDescription}
            </p>
          )}
        </div>

        <div className="mt-6 w-full max-w-md mx-auto grid grid-cols-3 gap-2 animate-fade-up">
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_40px_-10px_oklch(0.7_0.2_310/0.9)]"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button
            onClick={() => setStoryOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium glass hover:bg-foreground/10"
          >
            <Sparkles className="h-4 w-4" /> Story
          </button>
          <button
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium glass hover:bg-foreground/10"
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
        </div>

        {/* Tracklist */}
        <div className="mt-12 w-full max-w-xl animate-fade-up">
          <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground text-left mb-3 px-1">
            Tracklist · {members.length} Auras
          </div>
          <ul className="space-y-2">
            {members.map((m, i) => {
              const sourceBadge =
                m.sourceType === "upload"
                  ? "Uploaded Audio"
                  : m.platformName ?? "External Link";
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-2xl glass p-3 hover:bg-foreground/5 transition-colors"
                >
                  <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Aurascope
                    aura={{ palette: m.palette, seed: m.seed, auraName: m.auraName, trackTitle: m.trackTitle }}
                    size="mini"
                    mode="minimal"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium truncate">{m.trackTitle}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {m.auraName} · {m.artistName}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-border/60 bg-background/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                        {sourceBadge}
                      </span>
                      {m.moodTags.slice(0, 2).map((mood) => (
                        <span
                          key={mood}
                          className="rounded-full border border-border/60 bg-background/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          {mood}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    to="/aura/$id"
                    params={{ id: m.id }}
                    aria-label={`Open ${m.trackTitle}`}
                    className="rounded-full h-9 w-9 grid place-items-center border border-border/60 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-12 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          A living project on Auragram
        </p>
      </main>

      <AuracleShareDialog
        auracle={auracle}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
      <AuracleStoryDialog
        auracle={auracle}
        open={storyOpen}
        onOpenChange={setStoryOpen}
      />
      <Footer />
    </div>
  );
}
