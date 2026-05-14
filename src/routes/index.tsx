import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { OrbVisual } from "@/components/OrbVisual";
import { Aurascope } from "@/components/Aurascope";
import { ArrowRight, Sparkles, Share2, Wand2, AudioLines, Link2 } from "lucide-react";
import { FaqPreview } from "@/components/FaqPreview";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Auragram — Your song deserves more than a link" },
      {
        name: "description",
        content:
          "Turn songs into living Auras, save them to your Farm, group them into Auracles, and share them anywhere with AuraLinks.",
      },
      { property: "og:title", content: "Auragram — See your sound" },
      {
        property: "og:description",
        content:
          "Turn songs into Auras, save them to your Farm, group them into Auracles, and share them with AuraLinks.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-6 pb-16 sm:pt-16 sm:pb-24 flex flex-col items-center text-center animate-fade-up">
            <div className="relative grid place-items-center">
              <Aurascope
                aura={{ palette: "euphoric", auraName: "Auragram" }}
                size="large"
                mode="minimal"
                hero
                className="animate-float-y"
                showLabel={false}
              />
            </div>

            <a
              href="#how-it-works"
              className="mt-2 sm:mt-4 inline-flex items-center gap-2 rounded-full glass px-5 h-10 text-[11px] uppercase tracking-[0.3em] text-foreground/85 hover:border-foreground/20 transition-colors"
            >
              <AudioLines className="h-4 w-4 text-aura-gradient" />
              See your sound
            </a>

            <h1 className="mt-8 font-display text-4xl sm:text-6xl leading-[1.05] font-semibold tracking-tight">
              Your song deserves <br />
              <span className="text-aura-gradient">more than a link.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-md">
              Create your first Aura for free. Sign up to save it and build your music-first AuraLink.
            </p>

            <div className="mt-10 w-full max-w-md flex flex-col sm:flex-row gap-3">
              <Link
                to="/create"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-7 h-14 text-base font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_60px_-10px_oklch(0.7_0.2_310/0.9)] hover:shadow-[0_0_80px_-6px_oklch(0.7_0.2_310/1)] transition-shadow"
              >
                {user ? "Create Aura" : "Create Your First Aura"} <ArrowRight className="h-4 w-4" />
              </Link>
              {user && (
                <Link
                  to="/auralink/create"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-7 h-14 text-base font-medium glass-strong hover:bg-foreground/[0.06] transition-colors"
                >
                  <Link2 className="h-4 w-4" /> Build AuraLink
                </Link>
              )}
            </div>

            <div className="mt-6 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Create Aura → Sign Up → Build AuraLink → Share Anywhere
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-center">
            How it works
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: "01", t: "Create Aura", d: "Upload a song or paste a music link to generate a living visual aura." },
              { n: "02", t: "Sign Up to Save", d: "Sign up to save your Aura, then build your AuraLink." },
              { n: "03", t: "Build AuraLink", d: "Add your songs, socials, and streaming links to one music-first page." },
              { n: "04", t: "Share Anywhere", d: "Drop your AuraLink in bios, DMs, and stories." },
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
                AuraLink is your <span className="text-aura-gradient">music-first link page.</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl">
                Add streaming links, social profiles, and playable Auras from your Farm into one page built for bios, stories, DMs, and rollouts.
              </p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-2.5 text-sm text-foreground/85 max-w-xl">
                <li className="flex gap-2"><span className="text-aura-gradient">›</span> Add Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, and more.</li>
                <li className="flex gap-2"><span className="text-aura-gradient">›</span> Feature your best Auras.</li>
                <li className="flex gap-2"><span className="text-aura-gradient">›</span> Share one clean music-first link.</li>
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


        <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                I: Sparkles,
                t: "Living Auras",
                d: "Every Aura breathes, glows, and reacts to your sound.",
              },
              {
                I: Wand2,
                t: "My Auras",
                d: "Your growing collection of sonic identities, in one place.",
              },
              {
                I: Share2,
                t: "AuraLinks",
                d: "A premium music-first share page for bios, stories, and DMs.",
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
                Create Aura <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auralink/create"
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 h-12 text-sm font-medium glass-strong"
              >
                <Link2 className="h-4 w-4" /> Build AuraLink
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
