import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/financials")({
	loader: () => {
		throw redirect({ to: "/contabilidad/financials" });
	},
});
