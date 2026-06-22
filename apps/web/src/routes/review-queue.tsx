import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy queue URL — canonical review cockpit is `/review`. */
export const Route = createFileRoute("/review-queue")({
	beforeLoad: () => {
		throw redirect({ to: "/review" });
	},
});
