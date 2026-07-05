import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/reconciliations")({
	loader: () => {
		throw redirect({ to: "/tesoreria/reconciliations" });
	},
});
