import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { OrbVisual } from "@/components/OrbVisual";
import { Aurascope } from "@/components/Aurascope";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Sparkles, Share2, Wand2, AudioLines, Link2, RefreshCw, UploadCloud } from "lucide-react";
import { FaqPreview } from "@/components/FaqPreview";
import { useAuth } from "@/hooks/useAuth";
import {
  SHOWCASE_AURAS,
  pickRandomShowcase,
  pickContrastingShowcase,
  type ShowcaseAura,
} from "@/lib/showcaseAuras";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Auragram — Give your music a living identity" },
      {
        name: "description",
        content:
          "Turn any song into a living, playable Aura. Share your sound with an AuraLink — a music-first link page with playable Auras.",
      },
      { property: "og:title", content: "Auragram — See your sound" },
      {
        property: "og:description",
        content:
          "Turn songs into living Auras and share them with an AuraLink — a music-first link page with playable Auras.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // SSR-safe: pick the first showcase on the server, then randomize on the client.
  const [showcase, setShowcase] = useState<ShowcaseAura>(SHOWCASE_AURAS[0]);
  useEffect(() => {
    setShowcase(pickRandomShowcase());
  }, []);
  const contrasting = pickContrastingShowcase(showcase.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-6 pb-16 sm:pt-16 sm:pb-24 flex flex-col items-center text-center animate-fade-up">
            <button
              type="button"
              onClick={() => navigate({ to: "/create" })}
              aria-label={`Create your own Aura — example: ${showcase.trackTitle}`}
              className="relative grid place-items-center group rounded-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            >
              <Aurascope
                aura={{
                  palette: showcase.palette,
                  colors: showcase.colors,
                  seed: showcase.seed,
                  auraName: showcase.trackTitle,
                }}
                size="large"
                mode="minimal"
                hero
                className="animate-float-y"
                showLabel={false}
              />
            </button>

            {/* Hero metadata — teaches "Auras come from music" in one glance */}
            <div className="mt-6 sm:mt-8 max-w-sm w-full">
              <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                Generated From
              </div>
              <div className="mt-1.5 font-display text-xl sm:text-2xl tracking-tight text-aura-gradient">
                &ldquo;{showcase.trackTitle}&rdquo;
              </div>
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                <span className="text-foreground/80">Mood:</span> {showcase.mood}
                <span className="mx-2 opacity-40">·</span>
                <span className="text-foreground/80">Energy:</span> {showcase.energy}%
                <span className="mx-2 opacity-40">·</span>
                <span className="text-foreground/80">Key:</span> {showcase.musicalKey}
              </div>
              <button
                type="button"
                onClick={() => setShowcase((cur) => pickRandomShowcase(cur.id))}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Show another
              </button>
            </div>

            <a
              href="#what-is-an-aura"
              className="mt-8 sm:mt-10 inline-flex items-center gap-2 rounded-full glass px-5 h-10 text-[11px] uppercase tracking-[0.3em] text-foreground/85 hover:border-foreground/20 transition-colors"
            >
              <AudioLines className="h-4 w-4 text-aura-gradient" />
              See your sound
            </a>

            <h1 className="mt-8 font-display text-4xl sm:text-6xl leading-[1.05] font-semibold tracking-tight">
              Give Your Music <br />
              <span className="text-aura-gradient">A Living Identity.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md">
              Every song has an aura. Upload one and claim yours.
            </p>

            {/* Inline drop zone — the hero action */}
            <HeroDropZone />

            <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground/80">
              Free · No account needed to preview
            </p>
          </div>
        </section>


        {/* WHAT IS AN AURA */}
        <section
          id="what-is-an-aura"
          className="mx-auto max-w-6xl px-5 sm:px-8 pb-16 sm:pb-24 scroll-mt-24"
        >
          <div className="rounded-3xl glass-strong p-7 sm:p-12 relative overflow-hidden">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight">
                What exactly is an <span className="text-aura-gradient">Aura?</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                An Aura is a living visual identity generated from your music&apos;s mood,
                energy, key, rhythm, and atmosphere.
              </p>
            </div>

            <div className="mt-10 grid md:grid-cols-2 gap-10 items-center">
              <div className="grid place-items-center">
                <Aurascope
                  aura={{
                    palette: contrasting.palette,
                    colors: contrasting.colors,
                    seed: contrasting.seed,
                    auraName: contrasting.trackTitle,
                  }}
                  size="medium"
                  mode="minimal"
                  hero
                  showLabel={false}
                />
              </div>

              <div className="space-y-5">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                    Generated From
                  </div>
                  <div className="mt-1 font-display text-xl text-aura-gradient">
                    &ldquo;{contrasting.trackTitle}&rdquo;
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                    Mood Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contrasting.moodTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full glass px-3 h-7 text-xs text-foreground/85"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
                    <span>Energy</span>
                    <span className="text-foreground/80">{contrasting.energy}%</span>
                  </div>
                  <Progress value={contrasting.energy} className="h-2" />
                </div>

                <div className="flex items-baseline gap-2 text-sm">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Detected Key
                  </span>
                  <span className="text-foreground/90">{contrasting.musicalKey}</span>
                </div>

                <p className="text-sm italic text-foreground/80 border-l-2 border-foreground/20 pl-3">
                  &ldquo;{contrasting.vibeDescription}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS — simplified to 3 outcome-led steps */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-center">
            How it works
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-5">
            {[
              { n: "01", t: "Upload Audio", d: "Drop in a song." },
              { n: "02", t: "Generate Aura", d: "Watch your music become visual." },
              { n: "03", t: "Share Anywhere", d: "Turn it into a playable AuraLink." },
            ].map((s) => (
              <div
                key={s.n}
                className="glass rounded-2xl p-6 sm:p-7 hover:border-foreground/15 transition-colors"
              >
                <div className="font-display text-aura-gradient text-sm tracking-[0.3em]">
                  {s.n}
                </div>
                <h3 className="mt-3 font-display text-xl">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Create a free account to save your Aura.
          </p>
        </section>

        {/* AURALINK SPOTLIGHT */}
        <section className="mx-auto max-w-5xl px-5 sm:px-8 pb-8 sm:pb-12">
          <div className="rounded-3xl glass-strong p-7 sm:p-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, oklch(0.7 0.22 310 / 0.6), transparent 70%)" }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                <Link2 className="h-3 w-3" /> AuraLink
              </div>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">
                AuraLink is <span className="text-aura-gradient">a music-first link page with playable Auras.</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl">
                One playable page built for bios, stories, DMs, and rollouts — streaming links, social profiles, and Auras that play right inside your link.
              </p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-2.5 text-sm text-foreground/85 max-w-xl">
                <li className="flex gap-2"><span className="text-aura-gradient">›</span> Add Auras that play right inside your link.</li>
                <li className="flex gap-2"><span className="text-aura-gradient">›</span> Add Spotify, Apple Music, SoundCloud, YouTube, and more.</li>
                <li className="flex gap-2"><span className="text-aura-gradient">›</span> Share one clean, playable music-first link.</li>
                <li className="flex gap-2"><span className="text-aura-gradient">›</span> Make your profile feel alive, not generic.</li>
              </ul>
              <Link
                to="/auralink/create"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground px-6 h-12 text-sm font-medium shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)]"
              >
                Build AuraLink <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* OUTCOME-FOCUSED FEATURE CARDS */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                I: Sparkles,
                t: "Turn Music Into Visual Identity",
                d: "Every track becomes a living Aura.",
              },
              {
                I: Share2,
                t: "Share Your Sound",
                d: "Create a playable AuraLink for releases, bios, stories, and DMs.",
              },
              {
                I: Wand2,
                t: "Stand Out",
                d: "Give every song its own visual identity instead of another generic link.",
              },
            ].map(({ I, t, d }) => (
              <div key={t} className="glass rounded-2xl p-6 sm:p-7 relative">
                <I className="h-5 w-5 text-foreground/80" />
                <h3 className="mt-4 font-display text-xl">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ PREVIEW */}
        <FaqPreview />

        {/* FINAL CTA */}
        <section className="relative">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 py-24 text-center relative">
            <div className="absolute inset-0 -z-10 grid place-items-center">
              <OrbVisual size={520} className="opacity-50 blur-md" />
            </div>
            <h2 className="font-display text-3xl sm:text-5xl tracking-tight">
              Give your music a <span className="text-aura-gradient">living identity.</span>
            </h2>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/create"
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)]"
              >
                {user ? "Create Aura" : "See Your Sound"} <ArrowRight className="h-4 w-4" />
              </Link>
              {user && (
                <Link
                  to="/auralink/create"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 h-12 text-sm font-medium glass-strong"
                >
                  <Link2 className="h-4 w-4" /> Build AuraLink
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function HeroDropZone() {
  const navigate = useNavigate();
  const [drag, setDrag] = useState(false);

  const hand = async (f: File | undefined | null) => {
    if (!f) return;
    if (!f.type.startsWith("audio/") && !/\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i.test(f.name)) {
      return;
    }
    const { setLandingFile } = await import("@/lib/landingHandoff");
    setLandingFile(f);
    navigate({ to: "/create" });
  };

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        hand(e.dataTransfer.files?.[0]);
      }}
      className={`mt-8 w-full max-w-md cursor-pointer rounded-3xl px-6 py-7 flex flex-col items-center justify-center text-center transition-all glass-strong ${
        drag ? "ring-2 ring-foreground/40 scale-[1.01]" : "hover:bg-foreground/[0.05]"
      }`}
    >
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => hand(e.target.files?.[0])}
      />
      <UploadCloud className="h-7 w-7 text-aura-gradient" />
      <div className="mt-3 font-display text-lg sm:text-xl">
        Drop a track. Get your Aura.
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        MP3, WAV, M4A, AAC, OGG, WEBM, or FLAC
      </div>
      <div className="mt-5 inline-flex items-center justify-center gap-2 rounded-full px-6 h-11 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_40px_-12px_oklch(0.7_0.2_310/0.9)]">
        Claim Your Aura <ArrowRight className="h-4 w-4" />
      </div>
    </label>
  );
}

