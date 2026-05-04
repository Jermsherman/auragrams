import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side gate for routes that require authentication and a completed
 * profile. Redirects to /auth or /onboarding when needed. Renders children
 * once authenticated and onboarded.
 */
export function RequireAuth({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/auth", search: { redirect: loc.pathname, mode: "signin" } });
      return;
    }
    if (requireOnboarding && profile && !profile.username) {
      nav({ to: "/onboarding", search: { redirect: loc.pathname } });
    }
  }, [loading, user, profile, requireOnboarding, nav, loc.pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">…</div>
    );
  }
  if (requireOnboarding && profile && !profile.username) {
    return null;
  }
  return <>{children}</>;
}
