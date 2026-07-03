import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/threads/$threadId")({
	component: lazyRouteComponent(
		() => import("../../features/threads/ThreadDetailPage"),
		"ThreadDetailPage",
	),
});
