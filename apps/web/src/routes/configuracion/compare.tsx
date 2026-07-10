import { createFileRoute, redirect } from "@tanstack/react-router";

/** Merged into /compare (canonical route) */
export const Route = createFileRoute("/configuracion/compare")({
	loader: () => {
		throw redirect({ to: "/compare" });
	},
});
