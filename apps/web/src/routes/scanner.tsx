import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/scanner")({
	loader: () => {
		throw redirect({ to: "/operaciones/scanner" });
	},
});
