import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { checkUsernameAvailable } from "@/lib/cloudAura";
import { ArrowRight, AtSign, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Search = { redirect?: string };

export const Route = createFileRoute("/onboarding")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [{ title: "Welcome to Auragram" }],
  }),
  component: OnboardingPage,
});

const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;

function OnboardingPage() {
  const nav = useNavigate();
  const search = useSearch({ from: "/onboarding" });
  const { user, profile, loading, refreshProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", search: { redirect: "/onboarding" } });
  }, [loading, user, nav]);

  useEffect(() => {
    if (profile?.username) {
      nav({ to: search.redirect || "/create" });
    }
  }, [profile, nav, search.redirect]);

  const finish = async () => {
    if (!profile || !user) return;
    const u = username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) {
      toast.error("Username must be 3–24 chars: letters, numbers, _ or .");
      return;
    }
    setBusy(true);
    try {
      const ok = await checkUsernameAvailable(u, profile.id);
      if (!ok) {
        toast.error("That username is taken.");
        setBusy(false);
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          username: u,
          display_name: displayName.trim() || null,
          // Sensible defaults; refined later in Settings.
          default_visibility: "username",
          allow_anonymous: true,
        })
        .eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("You're in.");
      nav({ to: search.redirect || "/create" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not finish onboarding";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-md px-5 sm:px-8 py-12 sm:py-16">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 h-7 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> One quick thing
          </div>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">
            Pick your <span className="text-aura-gradient">username</span>.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This is how people find your Auras. You can add an artist profile later.
          </p>
        </div>

        <div className="mt-8 glass-strong rounded-3xl p-5 sm:p-6 space-y-4 animate-fade-up">
          <Field label="Username" prefix={<AtSign className="h-4 w-4 text-muted-foreground" />}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="yourname"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={24}
              autoFocus
            />
          </Field>
          <Field label="Display name · optional">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="What people call you"
              maxLength={64}
            />
          </Field>
          <button
            type="button"
            onClick={finish}
            disabled={busy}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-50 shadow-[0_0_40px_-12px_oklch(0.7_0.2_310/0.9)]"
          >
            {busy ? "…" : "Start Creating"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, prefix, children }: { label: string; prefix?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-background/40 border border-border/60 px-4 h-12">
        {prefix}
        {children}
      </div>
    </label>
  );
}
