import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/period-close")({
	loader: () => {
		throw redirect({ to: "/contabilidad/cierre-mensual" });
	},
});
