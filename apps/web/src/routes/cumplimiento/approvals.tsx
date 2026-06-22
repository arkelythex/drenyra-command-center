import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/cumplimiento/approvals")({
	component: lazyRouteComponent(
		() => import("../../features/approval-hub/ApprovalHubPage"),
		"ApprovalHubPage",
	),
});
