import { Link, useHydrated, useRouterState } from "@tanstack/react-router";
import { Compass, Link2, Plus, Radio, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/auth", "/onboarding", "/l/", "/u/"];

export function MobileBottomNav() {
  const { user } = useAuth();
  const hydrated = useHydrated();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!hydrated || !user || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const items = [
    { to: "/discover" as const, label: "Discover", icon: Compass },
    { to: "/create" as const, label: "Create", icon: Plus, primary: true },
    { to: "/farm" as const, label: "My Auras", icon: Radio },
    { to: "/auralink" as const, label: "AuraLink", icon: Link2 },
    { to: "/settings/artists" as const, label: "Profile", icon: UserRound },
  ];

  return (
    <>
      <div aria-hidden className="mobile-nav-clearance md:hidden" />
      <nav
        aria-label="Main navigation"
        className="mobile-bottom-nav fixed inset-x-3 z-50 md:hidden"
      >
        <div className="glass-nav mx-auto flex max-w-md items-end justify-around rounded-[1.7rem] px-2 py-1.5">
          {items.map(({ to, label, icon: Icon, primary }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className={cn(
                "press-depth relative flex min-h-12 min-w-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-medium",
                primary && "-mt-3 text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full",
                  primary && "h-11 w-11 bg-aura-gradient text-primary-foreground shadow-[0_10px_28px_-12px_var(--aura-pink)]",
                )}
              >
                <Icon className={cn("h-5 w-5", primary && "h-5.5 w-5.5")} aria-hidden />
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}