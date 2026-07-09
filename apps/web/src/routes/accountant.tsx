import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/accountant")({
	component: lazyRouteComponent(
		() => import("../features/accountant-overview/AccountantDashboard"),
		"AccountantDashboard",
	),
});
