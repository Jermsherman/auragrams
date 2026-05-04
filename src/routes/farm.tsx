import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AuraFarmCard } from "@/components/AuraFarmCard";
import { getSavedAuras, type SavedAura } from "@/lib/farm";

export const Route = createFileRoute("/farm")({
  head: () => ({
    meta: [
      { title: "Aura Farm — Auragram" },
      {
        name: "description",
        content: "Your growing collection of sonic auras.",
      },
      { property: "og:title", content: "Aura Farm — Auragram" },
      {
        property: "og:description",
        content: "Your growing collection of sonic auras.",
      },
    ],
  }),
  component: FarmPage,
});

function FarmPage() {
  const [auras, setAuras] = useState<SavedAura[] | null>(null);

  useEffect(() => {
    setAuras(getSavedAuras());
  }, []);

  const removed = (id: string) =>
    setAuras((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-5 sm:px-8 py-12 sm:py-16">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Aura Farm
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl tracking-tight">
            Your <span className="text-aura-gradient">Aura Farm.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your growing collection of sonic identities.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_40px_-10px_oklch(0.7_0.2_310/0.9)]"
          >
            <Plus className="h-4 w-4" /> Create Aura
          </Link>
        </div>

        <div className="mt-12 sm:mt-16 animate-fade-up">
          {auras === null ? null : auras.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {auras.map((a) => (
                <AuraFarmCard key={a.id} aura={a} onDeleted={removed} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md text-center glass-strong rounded-3xl p-10">
      <h2 className="font-display text-2xl">Your Farm is empty.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your first Aura and start growing your collection.
      </p>
      <Link
        to="/create"
        className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-medium text-primary-foreground bg-aura-gradient"
      >
        Create Aura
      </Link>
    </div>
  );
}
