import { createFileRoute, redirect } from "@tanstack/react-router";

/** Merged into /approvals (canonical approval hub route) */
export const Route = createFileRoute("/approval")({
	loader: () => {
		throw redirect({ to: "/approvals" });
	},
});
