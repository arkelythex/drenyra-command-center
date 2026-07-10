import { createFileRoute, redirect } from "@tanstack/react-router";

/** Merged into /inbox (canonical route) */
export const Route = createFileRoute("/operaciones/inbox")({
	loader: () => {
		throw redirect({ to: "/inbox" });
	},
});
