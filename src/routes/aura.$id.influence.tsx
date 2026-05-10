import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/aura/$id/influence")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/aura/$id", params: { id: params.id } });
  },
  component: () => null,
});
