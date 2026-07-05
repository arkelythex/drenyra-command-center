import { api } from "@/lib/api";
import { safeApiCall } from "@/lib/api-factory";
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import type {
	DashboardExpensesResponse,
	DashboardIncomeResponse,
} from "./types";

export const financialApi = {
	async getExpenses(companyId: string, startDate?: string, endDate?: string) {
		return safeApiCall(async () => {
			return extractOkDataOrPassthrough<DashboardExpensesResponse>(
				await unwrap(
					api.api.dashboard.expenses.get({
						query: {
							companyId,
							...(startDate && { startDate }),
							...(endDate && { endDate }),
						},
					}),
				),
				"Dashboard request failed",
			);
		});
	},

	async getIncome(companyId: string, startDate?: string, endDate?: string) {
		return safeApiCall(async () => {
			return extractOkDataOrPassthrough<DashboardIncomeResponse>(
				await unwrap(
					api.api.dashboard.income.get({
						query: {
							companyId,
							...(startDate && { startDate }),
							...(endDate && { endDate }),
						},
					}),
				),
				"Dashboard request failed",
			);
		});
	},
};
