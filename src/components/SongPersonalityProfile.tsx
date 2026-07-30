// Pending state for the Song Personality Profile. The profile itself now
// renders inside the unified AuraProfileCard.

import { RefreshCw } from "lucide-react";

// Compact loading/empty state shown while the insight is being generated.
export function SongPersonalityProfilePending({
  onRetry,
  canRetry = false,
  className = "",
}: {
  onRetry?: () => void;
  canRetry?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label="Song personality profile — pending"
      className={`w-full max-w-md mx-auto text-center ${className}`}
    >
      <div className="rounded-3xl glass-strong p-6 sm:p-7 relative overflow-hidden">
        <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          Aura Name
        </div>
        <div className="mt-2 inline-block h-7 w-40 rounded bg-foreground/10 animate-pulse" />
        <p className="mt-4 text-xs text-muted-foreground">
          Writing your song's personality profile…
        </p>
        {canRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 h-8 text-[11px] hover:bg-foreground/5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry story
          </button>
        )}
      </div>
    </section>
  );
}
