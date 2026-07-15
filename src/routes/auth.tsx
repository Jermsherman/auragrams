import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

type AuthSearch = { redirect?: string; mode?: "signup" | "signin" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    mode: s.mode === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Auragram" },
      { name: "description", content: "Save your Auras, grow your Farm, and share AuraLinks." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const remember = true;

  const after = async () => {
    // Decide where to send the user
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();
    const redirect = search.redirect || "/create";
    if (!profile?.username) {
      nav({ to: "/onboarding", search: { redirect } });
    } else {
      nav({ to: redirect });
    }
  };

  // If a user lands here already signed in (e.g. Google OAuth redirect), route them forward.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) after();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGoogle = async () => {
    setBusy(true);
    try {
      try {
        localStorage.setItem("auragram_remember_me", "1");
      } catch { /* noop */ }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if ("error" in result && result.error) throw result.error;
      // In-page flow: setSession already happened inside lovable client.
      await after();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    try {
      // Persist the remember-me preference; consumed by app boot to
      // optionally sign out on tab close when unchecked.
      try {
        localStorage.setItem("auragram_remember_me", remember ? "1" : "0");
      } catch { /* noop */ }
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to Auragram.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await after();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showCta={false} />
      <main className="flex-1 mx-auto w-full max-w-md px-5 sm:px-8 py-12 sm:py-20">
        <div className="text-center animate-fade-up">
          <div className="inline-flex"><Logo /></div>
          <h1 className="mt-6 font-display text-3xl sm:text-4xl tracking-tight">
            Create your <span className="text-aura-gradient">Auragram</span> account.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Save your Auras, grow your Farm, and share AuraLinks.
          </p>
        </div>

        <div className="mt-10 glass-strong rounded-3xl p-5 sm:p-6 animate-fade-up">
          <div className="glass rounded-full p-1 grid grid-cols-2 text-sm gap-0.5 mb-5">
            <button
              onClick={() => setTab("signin")}
              className={`h-10 rounded-full transition-colors ${tab === "signin" ? "bg-foreground/10 text-foreground" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`h-10 rounded-full transition-colors ${tab === "signup" ? "bg-foreground/10 text-foreground" : "text-muted-foreground"}`}
            >
              Sign up
            </button>
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="w-full mb-3 inline-flex items-center justify-center gap-2.5 rounded-2xl h-12 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.75-6-6.15S8.7 5.9 12 5.9c1.9 0 3.15.8 3.87 1.5l2.65-2.55C16.85 3.3 14.65 2.4 12 2.4c-5.3 0-9.6 4.3-9.6 9.6s4.3 9.6 9.6 9.6c5.55 0 9.2-3.9 9.2-9.4 0-.63-.07-1.1-.15-1.6H12z"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">
            <div className="flex-1 h-px bg-border/60" />
            or
            <div className="flex-1 h-px bg-border/60" />
          </div>




          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">Email</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-background/40 border border-border/60 px-4 h-12">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80 px-1">Password</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-background/40 border border-border/60 px-4 h-12">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  autoComplete={tab === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full h-12 text-sm font-medium text-primary-foreground bg-aura-gradient disabled:opacity-50 shadow-[0_0_40px_-12px_oklch(0.7_0.2_310/0.9)]"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            By continuing you agree to be a respectful inhabitant of the Auragram.
          </p>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">← Back to home</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
