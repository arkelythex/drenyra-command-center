import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/contabilidad/accounting-pr")({
	component: lazyRouteComponent(
		() => import("../../features/accounting-pr/AccountingPrPage"),
		"AccountingPrPage",
	),
});
