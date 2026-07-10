import { createFileRoute, redirect } from "@tanstack/react-router";

/** Merged into /review (canonical route) */
export const Route = createFileRoute("/cumplimiento/review")({
	loader: () => {
		throw redirect({ to: "/review" });
	},
});
