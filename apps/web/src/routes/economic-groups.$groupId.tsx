import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/economic-groups/$groupId")({
	loader: () => {
		throw redirect({ to: "/operaciones/economic-groups/$groupId" });
	},
});
