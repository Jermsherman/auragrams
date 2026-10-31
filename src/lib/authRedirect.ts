// Where to send someone after they sign in. Kept in sessionStorage because
// Google OAuth returns to a bare /auth URL and drops the query string.

const STORAGE_KEY = "auragram_auth_redirect";

/** An in-app path that is safe to navigate to after authentication. */
export function safeInternalRedirect(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  // A redirect of /auth is the bug: the gate navigated to itself and lost the target.
  if (value === "/auth" || value.startsWith("/auth?") || value.startsWith("/auth#")) return null;
  return value;
}

export function currentDestination(loc: {
  pathname: string;
  searchStr?: string;
  hash?: string;
}): string {
  const search = loc.searchStr && loc.searchStr !== "?" ? loc.searchStr : "";
  const rawHash = loc.hash ?? "";
  const hash =
    rawHash && rawHash !== "#" ? (rawHash.startsWith("#") ? rawHash : `#${rawHash}`) : "";
  return `${loc.pathname}${search}${hash}`;
}

export function rememberAuthRedirect(path: string | null | undefined) {
  const safe = safeInternalRedirect(path ?? null);
  if (!safe || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, safe);
  } catch {
    /* private mode */
  }
}

export function peekAuthRedirect(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return safeInternalRedirect(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function consumeAuthRedirect(): string | null {
  const value = peekAuthRedirect();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return value;
}
