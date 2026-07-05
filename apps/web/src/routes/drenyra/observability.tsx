import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/observability")({
	component: lazyRouteComponent(
		() =>
			import("../../features/observability/components/ObservabilityDashboard"),
		"ObservabilityDashboard",
	),
});
