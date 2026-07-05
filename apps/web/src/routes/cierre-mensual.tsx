import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cierre-mensual")({
	loader: () => {
		throw redirect({ to: "/contabilidad/cierre-mensual" });
	},
});
