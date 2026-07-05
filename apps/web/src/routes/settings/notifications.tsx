import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/notifications")({
	loader: () => {
		throw redirect({ to: "/configuracion/notifications" });
	},
});
