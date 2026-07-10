import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Landing page redirects to /inbox.
 * AgenticLayout is no longer needed here because __root.tsx provides
 * the command-center shell for all non-public routes.
 */
export const Route = createFileRoute("/")({
	loader: () => {
		throw redirect({ to: "/inbox" });
	},
	component: () => null,
});
