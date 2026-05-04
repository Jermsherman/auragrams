import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { Sparkles, Plus, Layers, Link2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AuraFarmCard } from "@/components/AuraFarmCard";
import { AuracleCard } from "@/components/AuracleCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getSavedAuras, type SavedAura } from "@/lib/farm";
import { getSavedAuracles, type Auracle } from "@/lib/auracle";

export const Route = createFileRoute("/farm")({
  head: () => ({
    meta: [
      { title: "Aura Farm — Auragram" },
      {
        name: "description",
        content: "Your growing collection of sonic identities and curated Auracles.",
      },
      { property: "og:title", content: "Aura Farm — Auragram" },
      {
        property: "og:description",
        content: "Your growing collection of sonic identities and curated Auracles.",
      },
    ],
  }),
  component: () => (<RequireAuth><FarmPage /></RequireAuth>),
});

type Filter = "all" | "upload" | "platform_link" | "raw_recording";

function FarmPage() {
  const [auras, setAuras] = useState<SavedAura[] | null>(null);
  const [auracles, setAuracles] = useState<Auracle[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setAuras(getSavedAuras());
    setAuracles(getSavedAuracles());
  }, []);

  const removedAura = (id: string) =>
    setAuras((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
  const removedAuracle = (id: string) =>
    setAuracles((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));

  const filteredAuras = (auras ?? []).filter((a) => {
    if (filter === "all") return true;
    if (filter === "platform_link") return a.sourceType === "platform_link" || a.sourceType === "external_link";
    return a.sourceType === filter;
  });

  const canCreateAuracle = (auras?.length ?? 0) >= 2;

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
            Your growing collection of sonic identities — and the Auracles you build from them.
          </p>
          <div className="mt-4 flex justify-center">
            <HelpLink hash="farm" label="What is the Farm?" />
          </div>
        </div>

        <Tabs defaultValue="auras" className="mt-10 sm:mt-12 animate-fade-up">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList className="bg-background/40 border border-border/60 rounded-full p-1 h-10">
              <TabsTrigger value="auras" className="rounded-full px-4 h-8 text-xs uppercase tracking-[0.2em]">
                Auras
              </TabsTrigger>
              <TabsTrigger value="auracles" className="rounded-full px-4 h-8 text-xs uppercase tracking-[0.2em]">
                Auracles
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/create"
                className="inline-flex items-center gap-2 rounded-full glass px-4 h-10 text-xs sm:text-sm hover:bg-foreground/10 transition-colors"
              >
                <Plus className="h-4 w-4" /> Create Aura
              </Link>
              <Link
                to="/auralink/create"
                className="inline-flex items-center gap-2 rounded-full glass px-4 h-10 text-xs sm:text-sm hover:bg-foreground/10 transition-colors"
              >
                <Link2 className="h-4 w-4" /> Build AuraLink from Farm
              </Link>
              {canCreateAuracle && (
                <Link
                  to="/auracle/create"
                  className="inline-flex items-center gap-2 rounded-full bg-aura-gradient text-primary-foreground px-4 h-10 text-xs sm:text-sm shadow-[0_0_30px_-12px_oklch(0.7_0.2_310/0.9)]"
                >
                  <Layers className="h-4 w-4" /> Create Auracle
                </Link>
              )}
            </div>
          </div>

          <TabsContent value="auras" className="mt-8">
            {auras === null ? null : auras.length === 0 ? (
              <EmptyAuras />
            ) : (
              <>
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {([
                    ["all", "All"],
                    ["upload", "Uploaded Audio"],
                    ["platform_link", "Platform Links"],
                    ["raw_recording", "Raw Aura"],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={
                        filter === key
                          ? "rounded-full px-3 h-7 text-[11px] uppercase tracking-[0.2em] bg-foreground/10 text-foreground"
                          : "rounded-full px-3 h-7 text-[11px] uppercase tracking-[0.2em] border border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {filteredAuras.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No Auras match this filter yet.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAuras.map((a) => (
                      <AuraFarmCard key={a.id} aura={a} onDeleted={removedAura} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="auracles" className="mt-8">
            {auracles === null ? null : auracles.length === 0 ? (
              <EmptyAuracles canCreate={canCreateAuracle} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {auracles.map((a) => (
                  <AuracleCard key={a.id} auracle={a} onDeleted={removedAuracle} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function EmptyAuras() {
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
        Gain Aura
      </Link>
    </div>
  );
}

function EmptyAuracles({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="mx-auto max-w-md text-center glass-strong rounded-3xl p-10">
      <h2 className="font-display text-2xl">No Auracles yet.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Group Auras from your Farm into a living project.
      </p>
      {canCreate ? (
        <Link
          to="/auracle/create"
          className="mt-6 inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-medium text-primary-foreground bg-aura-gradient"
        >
          <Layers className="h-4 w-4" /> Create Auracle
        </Link>
      ) : (
        <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Save at least 2 Auras first
        </p>
      )}
    </div>
  );
}
