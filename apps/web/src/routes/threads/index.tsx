import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/threads/")({
	loader: () => {
		throw redirect({ to: "/drenyra/workspace" });
	},
});
