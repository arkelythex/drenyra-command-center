import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/vendors")({
	loader: () => {
		throw redirect({ to: "/operaciones/vendors" });
	},
});
