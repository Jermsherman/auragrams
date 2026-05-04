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
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-8 pb-14 sm:pt-24 sm:pb-32 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1 animate-fade-up text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-aura-gradient" />
                See your sound
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-6xl leading-[1.05] font-semibold tracking-tight">
                Your song deserves <br className="hidden sm:block" />
                <span className="text-aura-gradient">more than a link.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-md mx-auto md:mx-0">
                Turn songs into living Auras, save them to your Farm, group them into Auracles, and share them anywhere with AuraLinks.
              </p>
              <div className="mt-8 flex items-center justify-center md:justify-start gap-4">
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 rounded-full px-6 h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_50px_-10px_oklch(0.7_0.2_310/0.9)] hover:shadow-[0_0_70px_-6px_oklch(0.7_0.2_310/1)] transition-shadow"
                >
                  Gain Aura <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Gain Aura → Save to Farm → Build Auracle → Share AuraLink
              </p>
            </div>

            <div className="order-1 md:order-2 relative grid place-items-center justify-self-center animate-fade-up">
              <OrbVisual
                size="min(62vw, 420px)"
                className="animate-float-y"
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8 py-16 sm:py-24">
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight text-center">
            How it works
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: "01", t: "Gain Aura", d: "Upload a sound or paste a music link." },
              { n: "02", t: "Grow Your Farm", d: "Save your visual music identities in one place." },
              { n: "03", t: "Build Auracles", d: "Group Auras into living albums, EPs, playlists, or rollouts." },
              { n: "04", t: "Share AuraLinks", d: "Give every track or project a living link built for bios, stories, DMs, and posts." },
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
                t: "Living Auras",
                d: "Every Aura breathes, glows, and reacts to your sound.",
              },
              {
                I: Wand2,
                t: "Aura Farm",
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
              Gain Aura <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
