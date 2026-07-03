import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/threads/")({
	component: lazyRouteComponent(
		() => import("../../features/threads/ThreadList"),
		"ThreadList",
	),
});
