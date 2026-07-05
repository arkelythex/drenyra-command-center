import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/contabilidad/financials")({
	component: lazyRouteComponent(
		() => import("../../features/financials/components/FinancialsView"),
		"FinancialsView",
	),
});
