import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { getTenantContext } from "../../lib/api";

export const Route = createFileRoute("/cumplimiento/sunat-dashboard")({
	loader: async ({ context }) => {
		const { companyId } = getTenantContext();
		if (!companyId) return;

		// Future: prefetch SUNAT dashboard query here
		// const { sunatDashboardQueryOptions } = await import(
		//   '../../features/compliance/compliance.query'
		// );
		// await context.queryClient.ensureQueryData(sunatDashboardQueryOptions(companyId));
	},
	component: lazyRouteComponent(
		() => import("../../features/compliance"),
		"SunatDashboard",
	),
});
