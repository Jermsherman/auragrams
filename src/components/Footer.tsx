import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-xs text-muted-foreground tracking-wide">
          See your sound. © {new Date().getFullYear()} Auragram.
        </p>
      </div>
    </footer>
  );
}
