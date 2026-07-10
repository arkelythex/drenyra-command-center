import { createFileRoute, redirect } from "@tanstack/react-router";

/** Merged into /cierre-mensual (canonical mission route) */
export const Route = createFileRoute("/contabilidad/cierre-mensual")({
	loader: () => {
		throw redirect({ to: "/cierre-mensual" });
	},
});
