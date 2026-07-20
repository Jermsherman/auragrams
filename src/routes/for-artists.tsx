import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ArrowRight, Palette, Link2, Share2, ScanLine, Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/for-artists")({
  head: () => ({
    meta: [
      { title: "Auragram for Artists — A visual identity for every release" },
      {
        name: "description",
        content:
          "Every track gets a canonical, playable Aura. Build a music-first AuraLink for your drops — no designer, no rerolls, no paid rarity.",
      },
      { property: "og:title", content: "Auragram for Artists" },
      {
        property: "og:description",
        content:
          "Turn every release into a shareable visual identity. One song, one Aura, forever.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForArtistsPage,
});

const BENEFITS: Array<{ Icon: typeof Palette; title: string; body: string }> = [
  {
    Icon: Palette,
    title: "Every drop, a visual identity — no designer needed",
    body: "Upload the mix and get a living Aura back. Every release lands with its own artwork, mood tags, and personality profile — automatically.",
  },
  {
    Icon: ShieldCheck,
    title: "One canonical Aura per track",
    body: "Deterministic. Fans can't roll a different version. What you release is what everyone sees, forever.",
  },
  {
    Icon: Link2,
    title: "AuraLink turns a release into a landing page",
    body: "One playable page with your streaming links and the Aura playing right inside it. Built for bios, DMs, stories, and rollouts.",
  },
  {
    Icon: ScanLine,
    title: "A shareable receipt for your fans",
    body: "The Trait Sheet is a screenshot-ready collectible pulled from the audio itself. Free organic marketing — fans share their favorite tracks as artifacts.",
  },
  {
    Icon: Sparkles,
    title: "A song personality profile fans can quote",
    body: "Every Aura ships with an AI-written cinematic story — Aura Name, Emotional DNA, Personality Traits, Listener Moment. Written from your audio, not a template.",
  },
  {
    Icon: Share2,
    title: "SEO- and social-preview friendly",
    body: "Public AuraLinks come with proper OG meta, so every share into an app, DM, or feed carries the artwork, title, and description.",
  },
];

function ForArtistsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-5 sm:px-8 pt-14 sm:pt-20 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            For artists
          </div>
          <h1 className="mt-5 font-display text-4xl sm:text-6xl leading-[1.05] tracking-tight">
            Give every release <br />
            <span className="text-aura-gradient">its own living identity.</span>
          </h1>
          <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Auragram turns your tracks into playable Auras — a music-first
            visual identity built from the audio itself. No designer. No packs.
            No rerolls. One song, one Aura, forever.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 h-12 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_40px_-10px_oklch(0.7_0.2_310/0.9)]"
            >
              Claim Your Aura <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auralink/create"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 h-12 text-sm font-medium glass-strong"
            >
              <Link2 className="h-4 w-4" /> Build AuraLink
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-16">
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFITS.map(({ Icon, title, body }) => (
              <div key={title} className="glass rounded-2xl p-6 sm:p-7">
                <Icon className="h-5 w-5 text-foreground/80" />
                <h3 className="mt-4 font-display text-lg sm:text-xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 sm:px-8 pb-24 text-center">
          <div className="rounded-3xl glass-strong p-8 sm:p-12">
            <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Our promise
            </div>
            <p className="mt-4 font-display text-2xl sm:text-3xl leading-snug">
              We monetize presentation and ownership — never results.
            </p>
            <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
              No better odds. No trait rerolls. No random packs. No paid rarity.
              What your song reveals is what your song reveals.
            </p>
            <Link
              to="/create"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 h-12 text-sm font-medium text-primary-foreground bg-aura-gradient"
            >
              Start with your first track <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
