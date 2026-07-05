import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bills")({
	loader: () => {
		throw redirect({ to: "/tesoreria/bills" });
	},
});
