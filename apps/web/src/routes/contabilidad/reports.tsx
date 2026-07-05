import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/contabilidad/reports")({
	component: lazyRouteComponent(
		() => import("../../features/reports/components/CustomReportsView"),
		"CustomReportsView",
	),
});
