import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    const recoveryInSearch = new URLSearchParams(location.search).get("type") === "recovery";
    const recoveryInHash = new URLSearchParams(location.hash.replace(/^#/, "")).get("type") === "recovery";
    if (recoveryInSearch || recoveryInHash) {
      throw redirect({ to: "/reset-password" });
    }
    throw redirect({ to: "/app" });
  },
});
