import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/period-close")({
	loader: () => {
		throw redirect({ to: "/cierre-mensual" });
	},
});
