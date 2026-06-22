import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy agent workspace — canonical finance surface is `/banking`. */
export const Route = createFileRoute("/workspace/finance")({
	beforeLoad: () => {
		throw redirect({ to: "/banking" });
	},
});
