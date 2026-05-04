import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { checkUsernameAvailable, createArtistProfile } from "@/lib/cloudAura";
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
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", search: { redirect: "/onboarding" } });
  }, [loading, user, nav]);

  // Step 1
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [unameBusy, setUnameBusy] = useState(false);

  // Step 2
  const [artistName, setArtistName] = useState("");
  const [artistHandle, setArtistHandle] = useState("");
  const [bio, setBio] = useState("");

  // Step 3
  const [defaultVis, setDefaultVis] = useState<"artist" | "username" | "choose">("artist");
  const [allowAnon, setAllowAnon] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.username) {
      // Already onboarded
      nav({ to: search.redirect || "/create" });
    }
  }, [profile, nav, search.redirect]);

  const submitStep1 = async () => {
    const u = username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) {
      toast.error("Username must be 3–24 chars: letters, numbers, _ or .");
      return;
    }
    setUnameBusy(true);
    const ok = await checkUsernameAvailable(u, profile?.id);
    setUnameBusy(false);
    if (!ok) { toast.error("That username is taken."); return; }
    setStep(2);
  };

  const submitStep2 = () => {
    if (!artistName.trim()) { toast.error("Add an artist name."); return; }
    setStep(3);
  };

  const finish = async () => {
    if (!profile || !user) return;
    setBusy(true);
    try {
      const u = username.trim().toLowerCase();
      const { error } = await supabase
        .from("profiles")
        .update({
          username: u,
          display_name: displayName.trim() || null,
          default_visibility: defaultVis,
          allow_anonymous: allowAnon,
        })
        .eq("id", profile.id);
      if (error) throw error;
      await createArtistProfile({
        user_id: profile.id,
        artist_name: artistName.trim(),
        artist_handle: artistHandle.trim().toLowerCase() || null,
        bio: bio.trim() || null,
      });
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
            <Sparkles className="h-3 w-3" /> Step {step} of 3
          </div>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">
            {step === 1 ? "Choose your username" : step === 2 ? "Your first Artist Profile" : "Default identity"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {step === 1
              ? "This is how others will find your Aura Farm."
              : step === 2
              ? "Auras can be attached to an Artist Profile, your username, or posted anonymously."
              : "How should new Auras be attributed by default?"}
          </p>
        </div>

        <div className="mt-8 glass-strong rounded-3xl p-5 sm:p-6 space-y-4 animate-fade-up">
          {step === 1 && (
            <>
              <Field label="Username" prefix={<AtSign className="h-4 w-4 text-muted-foreground" />}>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="yourname"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={24}
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
              <Cta onClick={submitStep1} busy={unameBusy} label="Continue" />
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Artist name">
                <input
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="e.g. Stevie Cosmic"
                  maxLength={80}
                />
              </Field>
              <Field label="Artist handle · optional" prefix={<AtSign className="h-4 w-4 text-muted-foreground" />}>
                <input
                  value={artistHandle}
                  onChange={(e) => setArtistHandle(e.target.value.toLowerCase())}
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="steviecosmic"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={32}
                />
              </Field>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">Short bio · optional</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  maxLength={240}
                  className="mt-1.5 w-full bg-background/40 border border-border/60 rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                />
              </label>
              <Cta onClick={submitStep2} label="Continue" />
            </>
          )}

          {step === 3 && (
            <>
              <RadioRow
                checked={defaultVis === "artist"}
                onChange={() => setDefaultVis("artist")}
                title="Show my Artist Profile by default"
                hint="New Auras post under your artist name."
              />
              <RadioRow
                checked={defaultVis === "username"}
                onChange={() => setDefaultVis("username")}
                title="Show my @username by default"
              />
              <RadioRow
                checked={defaultVis === "choose"}
                onChange={() => setDefaultVis("choose")}
                title="Let me choose each time"
              />
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                <div>
                  <p className="text-sm">Allow anonymous AuraLinks</p>
                  <p className="text-[11px] text-muted-foreground">
                    Posts hide your name but stay private to your Farm.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowAnon}
                  onChange={(e) => setAllowAnon(e.target.checked)}
                  className="h-5 w-5 accent-primary"
                />
              </label>
              <Cta onClick={finish} busy={busy} label="Start Creating" />
            </>
          )}
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

function Cta({ onClick, busy, label }: { onClick: () => void; busy?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-50 shadow-[0_0_40px_-12px_oklch(0.7_0.2_310/0.9)]"
    >
      {busy ? "…" : label} <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function RadioRow({ checked, onChange, title, hint }: { checked: boolean; onChange: () => void; title: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full flex items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors border ${checked ? "border-foreground/30 bg-foreground/5" : "border-border/60 bg-background/40 hover:bg-foreground/5"}`}
    >
      <span className={`mt-1 inline-block h-4 w-4 rounded-full border ${checked ? "border-foreground bg-aura-gradient" : "border-border"}`} />
      <span>
        <span className="block text-sm">{title}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}
