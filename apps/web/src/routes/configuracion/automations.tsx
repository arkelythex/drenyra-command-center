import { createFileRoute, redirect } from "@tanstack/react-router";

/** Merged into /automations (canonical route) */
export const Route = createFileRoute("/configuracion/automations")({
	loader: () => {
		throw redirect({ to: "/automations" });
	},
});
