import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy alias — use `/dashboard`. */
export const Route = createFileRoute("/neural-grid")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard" });
	},
});
