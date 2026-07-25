import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const RouteComponent = lazyRouteComponent(
	() => import("@/features/automations/components/AutomationsPage"),
	"AutomationsPage",
);

export const Route = createFileRoute("/automations")({
	component: RouteComponent,
});
