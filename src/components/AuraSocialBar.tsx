// Reactions + comments for a public Aura. Reactions work signed-out,
// comments require an account.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  addComment,
  deleteComment,
  getReactionState,
  listComments,
  profileLabel,
  toggleReaction,
  type AuraComment,
} from "@/lib/social";

export function AuraSocialBar({ auraId, ownerId }: { auraId: string; ownerId?: string | null }) {
  const { profile } = useAuth();
  const [count, setCount] = useState(0);
  const [reacted, setReacted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<AuraComment[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReactionState(auraId, profile?.id)
      .then((s) => {
        if (cancelled) return;
        setCount(s.count);
        setReacted(s.reacted);
      })
      .catch(() => {});
    listComments(auraId)
      .then((c) => !cancelled && setComments(c))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [auraId, profile?.id]);

  const onReact = async () => {
    if (busy) return;
    setBusy(true);
    const next = !reacted;
    setReacted(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      await toggleReaction(auraId, profile?.id, !next);
    } catch {
      setReacted(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast.error("Couldn't save that — try again.");
    } finally {
      setBusy(false);
    }
  };

  const onPost = async () => {
    if (!profile?.id || !draft.trim() || posting) return;
    setPosting(true);
    try {
      await addComment(auraId, profile.id, draft);
      setDraft("");
      setComments(await listComments(auraId));
    } catch {
      toast.error("Couldn't post your comment.");
    } finally {
      setPosting(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteComment(id);
      setComments((c) => c.filter((x) => x.id !== id));
    } catch {
      toast.error("Couldn't remove that comment.");
    }
  };

  return (
    <section className="mt-10 w-full max-w-md text-left">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReact}
          aria-pressed={reacted}
          aria-label={reacted ? "Remove your love" : "Love this Aura"}
          className={`inline-flex items-center gap-2 h-10 px-4 rounded-full border transition-all hover:-translate-y-0.5 ${
            reacted
              ? "border-primary/60 bg-primary/15 text-foreground"
              : "border-border/70 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`h-4 w-4 ${reacted ? "fill-current text-primary" : ""}`} />
          <span className="text-sm tabular-nums">{count}</span>
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border/70 text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm tabular-nums">{comments.length}</span>
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 animate-fade-up">
          {profile?.id ? (
            <div className="flex items-start gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                rows={2}
                placeholder="Say something about this Aura…"
                className="flex-1 resize-none rounded-xl bg-muted/30 border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={onPost}
                disabled={!draft.trim() || posting}
                className="h-10 px-4 rounded-full bg-aura-gradient text-primary-foreground text-xs font-medium disabled:opacity-50"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in to join the conversation →
            </Link>
          )}

          <ul className="space-y-3">
            {comments.map((c) => {
              const canDelete = profile?.id === c.author_id || (!!ownerId && profile?.id === ownerId);
              return (
                <li key={c.id} className="rounded-xl border border-border/50 bg-card/40 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    {c.author?.username ? (
                      <Link
                        to="/u/$username"
                        params={{ username: c.author.username }}
                        className="text-xs font-medium hover:text-primary transition-colors"
                      >
                        {profileLabel(c.author)}
                      </Link>
                    ) : (
                      <span className="text-xs font-medium">{profileLabel(c.author)}</span>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        aria-label="Delete comment"
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{c.body}</p>
                </li>
              );
            })}
            {!comments.length && (
              <li className="text-xs text-muted-foreground">No comments yet — be the first.</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
