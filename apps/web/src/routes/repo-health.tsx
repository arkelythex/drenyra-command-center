import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/repo-health")({
	component: lazyRouteComponent(
		() => import("@/features/repo-health/components/RepoHealthPage"),
		"RepoHealthPage",
	),
});
