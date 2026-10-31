import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { currentDestination, rememberAuthRedirect } from "@/lib/authRedirect";

/**
 * Client-side gate for routes that require authentication and a completed
 * profile. Redirects to /auth or /onboarding when needed. Renders children
 * once authenticated and onboarded.
 */
export function RequireAuth({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const { pathname, searchStr, hash } = useLocation();
  // The location updates to /auth before this gate unmounts. Without this
  // guard the effect runs again and replaces ?redirect=/farm with ?redirect=/auth.
  const sent = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (sent.current || pathname === "/auth") return;
      sent.current = true;
      const dest = currentDestination({ pathname, searchStr, hash });
      rememberAuthRedirect(dest);
      nav({ to: "/auth", search: { redirect: dest, mode: "signin" }, replace: true });
      return;
    }
    if (requireOnboarding && profile && !profile.username) {
      if (sent.current || pathname === "/onboarding") return;
      sent.current = true;
      nav({
        to: "/onboarding",
        search: { redirect: currentDestination({ pathname, searchStr, hash }) },
        replace: true,
      });
    }
  }, [loading, user, profile, requireOnboarding, nav, pathname, searchStr, hash]);

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
