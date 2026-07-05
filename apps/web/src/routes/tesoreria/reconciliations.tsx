import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/tesoreria/reconciliations")({
	component: lazyRouteComponent(
		() =>
			import("../../features/reconciliations/components/ReconciliationView"),
		"ReconciliationView",
	),
});
