import { createFileRoute, redirect } from "@tanstack/react-router";

/** Threads list — merged into /drenyra case list. */
export const Route = createFileRoute("/threads/")({
	loader: () => {
		throw redirect({ to: "/drenyra" });
	},
});
