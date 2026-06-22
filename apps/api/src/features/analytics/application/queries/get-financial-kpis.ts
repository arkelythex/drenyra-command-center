/**
 * GetFinancialKPIs — Returns financial KPIs only.
 *
 * Returns revenue, growth, outstanding amounts, and average invoice value.
 *
 * @module analytics/application/queries
 */

import { AnalyticsService } from "../../analytics.service";
import type { AnalyticsOptions } from "../../types/analytics.types";

/**
 * Returns financial KPIs for a company.
 *
 * @param options - Analytics options including companyId, date range, and currency
 * @returns Financial KPIs including revenue, growth, outstanding amounts
 */
export async function getFinancialKPIs(options: AnalyticsOptions) {
	return AnalyticsService.getFinancialKPIs(options);
}
