import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AuraLinkBuilder } from "@/components/AuraLinkBuilder";

export const Route = createFileRoute("/auralink")({
  head: () => ({
    meta: [
      { title: "AuraLink — Build your link page" },
      {
        name: "description",
        content:
          "Build a music-first AuraLink — streaming, social, Auras, and your full vibe in one shareable page.",
      },
      { property: "og:title", content: "AuraLink — Build your link page" },
      {
        property: "og:description",
        content:
          "Streaming, socials, and playable Auras in one shareable page.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AuraLinkBuilder />
    </RequireAuth>
  ),
});
