import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/review-queue/")({
	component: lazyRouteComponent(
		() => import("../../features/review-queue/ReviewQueuePage"),
		"ReviewQueuePage",
	),
});
