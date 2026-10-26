import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/notifications")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/NotificationsSettings"),
		"NotificationsSettings",
	),
});
