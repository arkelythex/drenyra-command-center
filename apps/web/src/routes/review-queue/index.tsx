import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy review queue — merged into approval board. */
export const Route = createFileRoute("/review-queue/")({
	loader: () => {
		throw redirect({ to: "/cumplimiento/approvals" });
	},
});
