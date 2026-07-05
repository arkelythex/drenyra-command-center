import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/contabilidad/ledger")({
	component: lazyRouteComponent(
		() => import("../../features/ledger/components/LedgerView"),
		"LedgerView",
	),
});
