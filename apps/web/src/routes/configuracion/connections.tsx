import { createFileRoute, redirect } from "@tanstack/react-router";

/** Merged into /connections (canonical route) */
export const Route = createFileRoute("/configuracion/connections")({
	loader: () => {
		throw redirect({ to: "/connections" });
	},
});
