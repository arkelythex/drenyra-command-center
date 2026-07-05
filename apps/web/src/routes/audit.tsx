import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/audit")({
	loader: () => {
		throw redirect({ to: "/cumplimiento/audit" });
	},
});
