import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/evidence/$id")({
	component: lazyRouteComponent(
		() => import("../../features/evidence/EvidenceDetailPage"),
		"EvidenceDetailPage",
	),
});
