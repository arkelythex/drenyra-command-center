import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/tesoreria/bills")({
	component: lazyRouteComponent(
		() => import("../../features/bills/components/BillsBoard"),
		"BillsBoard",
	),
});
