// Lightweight AuraLink analytics. Events are written by public visitors
// (anon INSERT) and read back only by the page owner (RLS).

import { supabase } from "@/integrations/supabase/client";

export type PageEventType = "view" | "link_click" | "aura_play" | "share";

export type PageAnalytics = {
  views: number;
  linkClicks: number;
  auraPlays: number;
  shares: number;
  total: number;
};

// page_events is not in the generated Database types yet — cast once here.
const eventsTable = () =>
  (supabase as unknown as { from: (t: string) => any }).from("page_events");

/** Fire-and-forget event log. Never throws, safe on public pages. */
export function trackPageEvent(pageId: string, eventType: PageEventType) {
  try {
    void Promise.resolve(
      eventsTable().insert({ page_id: pageId, event_type: eventType }),
    ).catch(() => {});
  } catch {
    /* analytics must never break the page */
  }
}

/** Owner-side aggregate for the last 30 days. */
export async function getPageAnalytics(pageId: string): Promise<PageAnalytics> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await eventsTable()
    .select("event_type")
    .eq("page_id", pageId)
    .gte("created_at", since);
  const rows: Array<{ event_type: string }> = error ? [] : (data ?? []);
  const a: PageAnalytics = { views: 0, linkClicks: 0, auraPlays: 0, shares: 0, total: rows.length };
  for (const r of rows) {
    if (r.event_type === "view") a.views++;
    else if (r.event_type === "link_click") a.linkClicks++;
    else if (r.event_type === "aura_play") a.auraPlays++;
    else if (r.event_type === "share") a.shares++;
  }
  return a;
}
