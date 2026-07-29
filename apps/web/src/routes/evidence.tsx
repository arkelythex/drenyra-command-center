import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/evidence")({
	component: lazyRouteComponent(
		() => import("../features/evidence/EvidenceVaultPage"),
		"EvidenceVaultPage",
	),
});
