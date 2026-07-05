import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/billing")({
	loader: () => {
		throw redirect({ to: "/configuracion/billing" });
	},
});
