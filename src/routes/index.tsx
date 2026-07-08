import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    const url = new URL(location.href, "https://local.app");
    const recoveryInSearch = url.searchParams.get("type") === "recovery";
    const recoveryInHash = new URLSearchParams(location.hash.replace(/^#/, "")).get("type") === "recovery";
    if (recoveryInSearch || recoveryInHash) {
      throw redirect({ to: "/reset-password", search: url.search, hash: location.hash });
    }
    throw redirect({ to: "/app" });
  },
});
