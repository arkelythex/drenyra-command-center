import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/approval")({
	component: lazyRouteComponent(
		() => import("../features/approval-hub/ApprovalListPage"),
		"ApprovalListPage",
	),
});
