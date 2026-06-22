import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy agent workspace — canonical admin surface is `/settings`. */
export const Route = createFileRoute("/workspace/system-admin")({
	beforeLoad: () => {
		throw redirect({ to: "/settings" });
	},
});
