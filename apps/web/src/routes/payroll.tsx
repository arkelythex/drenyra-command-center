import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/payroll")({
	loader: () => {
		throw redirect({ to: "/operaciones/payroll" });
	},
});
