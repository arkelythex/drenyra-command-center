import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/appearance")({
	loader: () => {
		throw redirect({ to: "/configuracion/appearance" });
	},
});
