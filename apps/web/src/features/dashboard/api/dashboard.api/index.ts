// ─── Barrel — re-exports everything for backward compatibility ──
// Original: src/features/dashboard/api/dashboard.api.ts (~316 lines)
// Split into: types, sire, overview, financial, fiscal

export type * from "./types";

import { sireApi } from "./sire";
import { overviewApi } from "./overview";
import { financialApi } from "./financial";
import { fiscalApi } from "./fiscal";

/**
 * Unified dashboard API client — backward-compatible with the original
 * monolithic `dashboardApi` export. Delegates to domain sub-modules.
 */
export const dashboardApi = {
	getSummary: sireApi.getSummary,
	getRecentTransactions: overviewApi.getRecentTransactions,
	getSystemStatus: overviewApi.getSystemStatus,
	getOverview: overviewApi.getOverview,
	getLiquidity: overviewApi.getLiquidity,
	getExpenses: financialApi.getExpenses,
	getIncome: financialApi.getIncome,
	getFiscalIndicators: fiscalApi.getFiscalIndicators,
	getTaxCalendar: fiscalApi.getTaxCalendar,
};
