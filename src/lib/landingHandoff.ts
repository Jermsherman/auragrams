// One-shot handoff: landing page picks a file, /create consumes it on mount.
// In-memory only; SPA nav preserves it, hard reload discards it (expected).

let pending: File | null = null;

export function setLandingFile(f: File | null) {
  pending = f;
}

export function takeLandingFile(): File | null {
  const f = pending;
  pending = null;
  return f;
}
