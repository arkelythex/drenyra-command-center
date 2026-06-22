import { api } from "@/lib/api";
import { safeApiCall } from "@/lib/api-factory";
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import type { DashboardSummaryResponse } from "./types";

export const sireApi = {
	async getSummary(companyId: string) {
		return safeApiCall(async () => {
			const sireStatus = extractOkDataOrPassthrough(
				await unwrap(
					api.api.dashboard["sire-status"].get({
						query: { companyId },
					}),
				),
				"Dashboard request failed",
			);

			const totalInvoices = sireStatus.totalInvoices ?? 0;
			const matched = sireStatus.matched ?? 0;
			const unmatched = sireStatus.unmatched ?? 0;
			const rejected = sireStatus.rejected ?? 0;
			const denominator = totalInvoices > 0 ? totalInvoices : 1;

			return {
				status: {
					matched,
					unmatched,
					rejected,
					totalInvoices,
					matchRate: (matched / denominator) * 100,
				},
			} satisfies DashboardSummaryResponse;
		});
	},
};
