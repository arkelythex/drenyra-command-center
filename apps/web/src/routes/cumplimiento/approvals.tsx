import { createFileRoute, redirect } from "@tanstack/react-router";

/** Merged into /approvals (canonical route) */
export const Route = createFileRoute("/cumplimiento/approvals")({
	loader: () => {
		throw redirect({ to: "/approvals" });
	},
});
