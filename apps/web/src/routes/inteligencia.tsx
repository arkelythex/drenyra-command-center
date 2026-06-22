import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const IntelligenceDashboard = lazyRouteComponent(
	() => import("../features/intelligence"),
	"IntelligenceDashboard",
);

export const Route = createFileRoute("/inteligencia")({
	component: IntelligenceDashboard,
});
