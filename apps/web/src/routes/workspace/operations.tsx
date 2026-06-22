import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy agent workspace — canonical operations hub is `/drenyra`. */
export const Route = createFileRoute("/workspace/operations")({
	beforeLoad: () => {
		throw redirect({ to: "/drenyra" });
	},
});
