import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/inbox")({
	component: lazyRouteComponent(
		() => import("../features/inbox/pages"),
		"InboxPage",
	),
});
