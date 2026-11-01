import { useEffect, useState } from "react";
import { flags } from "./featureFlags";

/** Pro is a flag, not a purchase. `?tier=pro` or localStorage `auragram:tier=pro` previews it. */
export function isProTier(): boolean {
  if (flags.enableProInsights) return true;
  if (typeof window === "undefined") return false;
  const query = new URLSearchParams(window.location.search).get("tier");
  if (query === "pro") return true;
  try {
    return window.localStorage.getItem("auragram:tier") === "pro";
  } catch {
    return false;
  }
}

export function useProTier(): boolean {
  const [pro, setPro] = useState(false);
  useEffect(() => {
    setPro(isProTier());
  }, []);
  return pro;
}
