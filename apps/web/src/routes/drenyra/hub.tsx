import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/hub")({
	loader: () => {
		throw redirect({ to: "/drenyra/workspace" });
	},
});
