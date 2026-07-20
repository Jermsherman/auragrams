import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12 grid gap-8 sm:grid-cols-2 items-start">
        <div className="space-y-3">
          <Logo />
          <p className="text-xs text-muted-foreground tracking-wide">
            See your sound. © {new Date().getFullYear()} Auragram.
          </p>
        </div>
        <div className="sm:text-right">
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">
            Help
          </div>
          <ul className="flex flex-wrap sm:justify-end gap-x-5 gap-y-2 text-sm">
            <li>
              <Link
                to="/faq"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                to="/create"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Create Aura
              </Link>
            </li>
            <li>
              <Link
                to="/auralink/create"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Build AuraLink
              </Link>
            </li>
            <li>
              <Link
                to="/farm"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                My Auras
              </Link>
            </li>
            <li>
              <Link
                to="/for-artists"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                For Artists
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
