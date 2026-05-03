import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { OrbVisual } from "@/components/OrbVisual";
import { ArrowRight, Sparkles, Share2, Wand2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Auragram — Your song deserves more than a link" },
      {
        name: "description",
        content:
          "Auragram turns every track into a living visual aura you can share instantly.",
      },
      { property: "og:title", content: "Auragram — See your sound" },
      {
        property: "og:description",
        content: "Upload, generate, and share a living visual aura for your music.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32 grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-aura-gradient" />
                See your sound
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-6xl leading-[1.05] font-semibold tracking-tight">
                Your song deserves <br className="hidden sm:block" />
                <span className="text-aura-gradient">more than a link.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-md">
                Auragram turns every track into a living visual aura you can share instantly.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 rounded-full px-6 h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)] hover:shadow-[0_0_70px_-6px_oklch(0.7_0.2_310/1)] transition-shadow"
                >
                  Create Your Auragram <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Upload → Generate → Share
              </p>
            </div>

            <div className="relative grid place-items-center md:order-last animate-fade-up">
              <OrbVisual size="min(78vw, 460px)" className="animate-float-y" />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-center">
            How it works
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-5">
            {[
              { n: "01", t: "Upload your track", d: "Drop in your .mp3 or .wav. That's it." },
              { n: "02", t: "Generate the aura", d: "We translate your sound into a living visual." },
              { n: "03", t: "Share anywhere", d: "One link. Every platform. Pure vibe." },
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

        {/* FEATURES */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                I: Sparkles,
                t: "Living Visuals",
                d: "Every aura breathes, glows, and reacts to your sound.",
              },
              {
                I: Share2,
                t: "Instant Sharing",
                d: "A premium page made for screenshots, stories, and DMs.",
              },
              {
                I: Wand2,
                t: "Story-Ready Direction",
                d: "Vertical exports & moods.",
                soon: true,
              },
            ].map(({ I, t, d, soon }) => (
              <div key={t} className="glass rounded-2xl p-6 sm:p-7 relative">
                <I className="h-5 w-5 text-foreground/80" />
                <h3 className="mt-4 font-display text-xl">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                {soon && (
                  <span className="absolute top-5 right-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border border-border/70 rounded-full px-2 py-0.5">
                    Coming soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 py-24 text-center relative">
            <div className="absolute inset-0 -z-10 grid place-items-center">
              <OrbVisual size={520} className="opacity-50 blur-md" />
            </div>
            <h2 className="font-display text-3xl sm:text-5xl tracking-tight">
              Give your music a <span className="text-aura-gradient">living identity.</span>
            </h2>
            <Link
              to="/create"
              className="mt-10 inline-flex items-center gap-2 rounded-full px-7 h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)]"
            >
              Create Your Auragram <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
