import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/threads/$threadId")({
	loader: () => {
		throw redirect({ to: "/drenyra/workspace" });
	},
});
