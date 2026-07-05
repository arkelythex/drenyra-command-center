import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/approvals")({
	loader: () => {
		throw redirect({ to: "/cumplimiento/approvals" });
	},
});
