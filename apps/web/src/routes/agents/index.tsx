import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/agents/")({
	component: lazyRouteComponent(
		() => import("../../features/agents/AgentsWindowPage"),
		"AgentsWindowPage",
	),
});
