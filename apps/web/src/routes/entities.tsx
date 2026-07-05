import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/entities")({
	loader: () => {
		throw redirect({ to: "/operaciones/entities" });
	},
});
