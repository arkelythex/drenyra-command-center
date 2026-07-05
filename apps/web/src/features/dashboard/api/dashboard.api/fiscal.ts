import { api } from "@/lib/api";
import { safeApiCall } from "@/lib/api-factory";
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import type { DashboardFiscalIndicatorsResponse } from "./types";

export const fiscalApi = {
	async getFiscalIndicators() {
		return safeApiCall(async () => {
			return extractOkDataOrPassthrough<DashboardFiscalIndicatorsResponse>(
				await unwrap(api.api.dashboard["fiscal-indicators"].get()),
				"Dashboard request failed",
			);
		});
	},

	async getTaxCalendar(companyId: string, month?: number, year?: number) {
		return safeApiCall(async () => {
			return extractOkDataOrPassthrough<unknown>(
				await unwrap(
					api.api.dashboard["tax-calendar"].get({
						query: {
							companyId,
							...(month !== undefined && { month }),
							...(year !== undefined && { year }),
						},
					}),
				),
				"Dashboard request failed",
			);
		});
	},
};
