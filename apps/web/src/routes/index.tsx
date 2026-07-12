import { createFileRoute, redirect } from "@tanstack/react-router";

/**
<<<<<<< HEAD
 * Landing page redirects to /inbox.
 * AgenticLayout is no longer needed here because __root.tsx provides
 * the command-center shell for all non-public routes.
 */
export const Route = createFileRoute("/")({
	loader: () => {
		throw redirect({ to: "/inbox" });
	},
	component: () => null,
=======
 * Accounting Inbox — command center home page.
 * Shows critical tasks, Drenyra suggestions, active agents, and company summaries.
 */
export const Route = createFileRoute("/")({
	component: lazyRouteComponent(
		() => import("../features/accounting-inbox/AccountingInbox"),
		"AccountingInbox",
	),
>>>>>>> main
});
