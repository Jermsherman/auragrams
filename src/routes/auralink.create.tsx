import { createFileRoute, redirect } from "@tanstack/react-router";

// Back-compat alias — redirects to the canonical /auralink builder.
export const Route = createFileRoute("/auralink/create")({
  beforeLoad: () => {
    throw redirect({ to: "/auralink" });
  },
  component: () => null,
});
