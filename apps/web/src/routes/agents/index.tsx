import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/agents/")({
	loader: () => {
		throw redirect({ to: "/drenyra/skills" });
	},
});
