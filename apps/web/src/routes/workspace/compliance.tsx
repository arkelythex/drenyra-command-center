import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy agent workspace — canonical fiscal command surface is `/drenyra`. */
export const Route = createFileRoute("/workspace/compliance")({
	beforeLoad: () => {
		throw redirect({ to: "/drenyra" });
	},
});
