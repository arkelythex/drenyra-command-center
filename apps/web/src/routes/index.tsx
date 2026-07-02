import { createFileRoute, redirect } from "@tanstack/react-router";

/** Canonical home: redirect to agentic thread creation. */
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/threads/new" });
	},
});
