import { api } from "@/lib/api";
import { safeApiCall } from "@/lib/api-factory";
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import type {
	DashboardOverviewResponse,
	DashboardOverviewSystemStatus,
	DashboardLiquidityPoint,
	DashboardRecentTransaction,
} from "./types";

export const overviewApi = {
	async getRecentTransactions(
		limit = 3,
		companyId?: string,
	) {
		return safeApiCall(async () => {
			if (!companyId) return [];

			const overview = extractOkDataOrPassthrough<DashboardOverviewResponse>(
				await unwrap(
					api.api.dashboard.overview.get({
						query: { companyId, currency: "PEN" },
					}),
				),
				"Dashboard request failed",
			);

			const processedDocs = overview.processedDocs;
			if (!processedDocs) return [];

			const synthetic: DashboardRecentTransaction[] = [
				{
					id: "summary-processed",
					number: "Aceptados",
					totalAmount: processedDocs.processed ?? 0,
					status: "PAID",
				},
				{
					id: "summary-pending",
					number: "Pendientes",
					totalAmount: processedDocs.pending ?? 0,
					status: "DRAFT",
				},
				{
					id: "summary-rejected",
					number: "Rechazados",
					totalAmount: processedDocs.rejected ?? 0,
					status: "REJECTED",
				},
			];

			return synthetic.slice(0, limit);
		});
	},

	async getSystemStatus() {
		return safeApiCall(async () => {
			return extractOkDataOrPassthrough<DashboardOverviewSystemStatus>(
				await unwrap(api.api.dashboard["system-status"].get()),
				"Dashboard request failed",
			);
		});
	},

	async getOverview(
		companyId: string,
		currency: "PEN" | "USD" = "PEN",
	) {
		return safeApiCall(async () => {
			return extractOkDataOrPassthrough<DashboardOverviewResponse>(
				await unwrap(
					api.api.dashboard.overview.get({
						query: { companyId, currency },
					}),
				),
				"Dashboard request failed",
			);
		});
	},

	async getLiquidity(
		companyId: string,
		months: number = 12,
	) {
		return safeApiCall(async () => {
			return extractOkDataOrPassthrough<DashboardLiquidityPoint[]>(
				await unwrap(
					api.api.dashboard.liquidity.get({
						query: { companyId, months },
					}),
				),
				"Dashboard request failed",
			);
		});
	},
};
