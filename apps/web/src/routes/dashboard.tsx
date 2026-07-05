import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
import { getTenantContext } from "../lib/api";

const dashboardSearchSchema = z.object({
	month: z.number().optional(),
	year: z.number().optional(),
});

export const Route = createFileRoute("/dashboard")({
	loader: async ({ context }) => {
		const { companyId } = getTenantContext();
		if (!companyId) return;

		const {
			dashboardOverviewQueryOptions,
			dashboardRecentDocumentsQueryOptions,
			dashboardSummaryQueryOptions,
			fiscalIndicatorsQueryOptions,
		} = await import("../features/dashboard/dashboard.query-options");

		await Promise.all([
			context.queryClient.ensureQueryData(
				dashboardOverviewQueryOptions(companyId),
			),
			context.queryClient.ensureQueryData(
				dashboardRecentDocumentsQueryOptions(companyId, 3),
			),
			context.queryClient.ensureQueryData(
				dashboardSummaryQueryOptions(companyId),
			),
			context.queryClient.ensureQueryData(fiscalIndicatorsQueryOptions()),
		]);
	},
	component: lazyRouteComponent(
		() => import("../features/dashboard"),
		"DashboardView",
	),
	validateSearch: (search) => dashboardSearchSchema.parse(search),
});
