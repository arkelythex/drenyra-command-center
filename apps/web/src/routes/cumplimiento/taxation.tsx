import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/cumplimiento/taxation")({
	component: lazyRouteComponent(
		() => import("../../features/taxation/components/TaxLiquidationView"),
		"TaxLiquidationView",
	),
});
