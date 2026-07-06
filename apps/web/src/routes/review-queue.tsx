import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/review-queue")({
	loader: () => {
		throw redirect({ to: "/drenyra/control-tower" });
	},
});
