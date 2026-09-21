// Owner-only publishing control: shows the current state and lets the owner
// change it deliberately. Going Public always asks for confirmation.

import { useState } from "react";
import { Globe, Link2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AURA_STATUS_META, updateAuraStatus, type AuraStatus } from "@/lib/auraStatus";
import { cn } from "@/lib/utils";

const ICONS: Record<AuraStatus, typeof Lock> = {
  draft: Lock,
  unlisted: Link2,
  public: Globe,
};

export function AuraStatusBadge({ status, className = "" }: { status: AuraStatus; className?: string }) {
  const Icon = ICONS[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full glass px-3 h-7 text-[11px] uppercase tracking-[0.12em]", `status-${status}`, className)}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {AURA_STATUS_META[status].label}
    </span>
  );
}

export function AuraStatusControl({
  auraId,
  status,
  onChange,
}: {
  auraId: string;
  status: AuraStatus;
  onChange: (next: AuraStatus) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [confirmPublic, setConfirmPublic] = useState(false);

  const apply = async (next: AuraStatus) => {
    if (next === status) return;
    setSaving(true);
    try {
      await updateAuraStatus(auraId, next);
      onChange(next);
      toast.success(
        next === "public"
          ? "This Aura is now public."
          : next === "unlisted"
            ? "Link sharing is on. Only people with the link can open it."
            : "Back to draft — only you can see this Aura now.",
      );
    } catch {
      toast.error("Couldn't change who can see this Aura. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const options: AuraStatus[] = ["draft", "unlisted", "public"];

  return (
    <section className="w-full max-w-md text-left glass-hero rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Who can see this</h2>
        <AuraStatusBadge status={status} />
      </div>

      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          const Icon = ICONS[opt];
          const active = opt === status;
          return (
            <button
              key={opt}
              type="button"
              disabled={saving}
              onClick={() => (opt === "public" ? setConfirmPublic(true) : apply(opt))}
              className={`press-depth w-full min-h-16 text-left rounded-xl border px-3 py-2.5 transition-colors disabled:opacity-60 ${
                active
                  ? "border-primary/60 bg-foreground/5"
                  : "border-border/60 hover:bg-foreground/5"
              }`}
              aria-pressed={active}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {AURA_STATUS_META[opt].label}
                {opt === "draft" && !active && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">safest</span>
                )}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {AURA_STATUS_META[opt].blurb}
              </span>
            </button>
          );
        })}
      </div>

      <AlertDialog open={confirmPublic} onOpenChange={setConfirmPublic}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make this Aura public?</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone will be able to find this Aura, play the audio, and share it. Only do this if
              the music is ready to be heard. You can switch it back to draft at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => apply("public")}>Make public</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
