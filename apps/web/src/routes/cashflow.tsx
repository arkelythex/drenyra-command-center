import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cashflow")({
	loader: () => {
		throw redirect({ to: "/tesoreria/cashflow" });
	},
});
