import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AuraLinkBuilder } from "@/components/AuraLinkBuilder";

// Legacy /auralink/create route — back-compat alias for /auralink.
export const Route = createFileRoute("/auralink/create")({
  head: () => ({
    meta: [
      { title: "Build AuraLink — Auragram" },
      {
        name: "description",
        content:
          "Create a music-first link page with streaming links, Auras, or both.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AuraLinkBuilder />
    </RequireAuth>
  ),
});
