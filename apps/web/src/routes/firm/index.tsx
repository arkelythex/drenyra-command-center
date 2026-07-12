import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/firm/")({
	component: lazyRouteComponent(
		() => import("../../features/firm/FirmDashboard"),
		"FirmDashboard",
	),
});
