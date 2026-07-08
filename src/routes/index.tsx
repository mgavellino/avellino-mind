import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    const search = new URLSearchParams(location.searchStr);
    const recoveryInSearch = search.get("type") === "recovery";
    const recoveryInHash = new URLSearchParams(location.hash.replace(/^#/, "")).get("type") === "recovery";
    if (recoveryInSearch || recoveryInHash) {
      throw redirect({ to: "/reset-password", hash: location.hash });
    }
    throw redirect({ to: "/app" });
  },
});
