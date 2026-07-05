import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/banking")({
	loader: () => {
		throw redirect({ to: "/tesoreria/banking" });
	},
});
