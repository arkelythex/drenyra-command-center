import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/diffs/")({
	component: lazyRouteComponent(
		() => import("../../features/diffs/AccountingDiffView"),
		"AccountingDiffView",
	),
});
