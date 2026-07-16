// Tracks a single guest-created Aura (one allowed before sign-up).
// We only store metadata pointers — the actual track/audio live in their
// existing localStorage / session slots created by the regular flow.

const KEY = "auragram_pending_aura";

export type PendingAura = {
  id: string;
  createdAt: number;
};

const MAX_PENDING_AGE_MS = 72 * 60 * 60 * 1000; // 72h — matches server-side cleanup cron.

export function getPendingAura(): PendingAura | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingAura;
    if (!p?.createdAt || Date.now() - p.createdAt > MAX_PENDING_AGE_MS) {
      // Guest aura server-side row is likely reaped by the cleanup cron — drop the local pointer.
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* noop */
      }
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function setPendingAura(p: PendingAura) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* noop */
  }
}

export function clearPendingAura() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function hasPendingAura(): boolean {
  return !!getPendingAura();
}
