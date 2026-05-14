import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { listMyAuraLinks } from "@/lib/auralinkService";

export function Nav({ showCta = true }: { showCta?: boolean }) {
  const { user, profile } = useAuth();
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) {
      setPreviewSlug(null);
      return;
    }
    let cancelled = false;
    listMyAuraLinks(profile.id)
      .then((pages) => {
        if (cancelled) return;
        setPreviewSlug(pages[0]?.handleSlug ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 backdrop-blur-md bg-background/40 border-b border-border/60" />
      <nav className="relative mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <>
              <Link
                to="/farm"
                activeProps={{ className: "text-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="text-xs sm:text-sm tracking-wide hover:text-foreground transition-colors px-2"
              >
                My Auras
              </Link>
              <Link
                to="/auralink"
                activeProps={{ className: "text-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="text-xs sm:text-sm tracking-wide hover:text-foreground transition-colors px-2"
              >
                My AuraLink
              </Link>
              {previewSlug && (
                <a
                  href={`/l/${previewSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline text-xs sm:text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors px-2"
                >
                  Public Preview
                </a>
              )}
            </>
          )}
          <Link
            to="/faq"
            activeProps={{ className: "text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="hidden sm:inline text-xs sm:text-sm tracking-wide hover:text-foreground transition-colors px-2"
          >
            FAQ
          </Link>
          {showCta && (
            <Link
              to="/create"
              className="group relative inline-flex items-center rounded-full px-4 sm:px-5 h-10 text-sm font-medium text-primary-foreground bg-aura-gradient shadow-[0_0_30px_-8px_oklch(0.7_0.2_310/0.7)] hover:shadow-[0_0_50px_-6px_oklch(0.7_0.2_310/0.9)] transition-shadow"
            >
              <span className="hidden sm:inline">Create Aura</span>
              <span className="sm:hidden">Create</span>
            </Link>
          )}
          <UserMenu />
        </div>
      </nav>
    </header>
  );
}
