import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Cognitive hub route — redirect to unified /drenyra workspace.
 * All Drenyra functionality (threads, command center, agents) is now
 * accessible from the single /drenyra entry point with mode tabs.
 */
export const Route = createFileRoute("/chat")({
	loader: () => {
		throw redirect({ to: "/drenyra" });
	},
});
