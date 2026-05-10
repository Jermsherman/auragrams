import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
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
  const [remember, setRemember] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("auragram_remember_me") !== "0";
  });

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
            className="w-full inline-flex items-center justify-center gap-3 rounded-full glass h-12 text-sm font-medium hover:bg-foreground/10 transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.6 7.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.7 26.7 36.5 24 36.5c-5.3 0-9.8-3.4-11.4-8L6 33.4C9.3 40.7 16.1 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.3 5.3C41.4 35.6 45 30.2 45 24c0-1.2-.1-2.4-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <div className="flex-1 border-t border-border/60" /> or <div className="flex-1 border-t border-border/60" />
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
