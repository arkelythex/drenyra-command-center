/**
 * GetDashboardAnalytics — Returns complete dashboard with all KPIs.
 *
 * Aggregates financial, operational, tax, customer, trend, and compliance metrics.
 * All queries are executed in parallel for optimal performance.
 *
 * @module analytics/application/queries
 */

import { AnalyticsService } from "../../analytics.service";
import type { AnalyticsOptions } from "../../types/analytics.types";

/**
 * Returns the complete dashboard analytics with all KPI categories.
 *
 * @param options - Analytics options including companyId, date range, and currency
 * @returns Dashboard analytics with financial, operational, tax, customer, trend, and compliance metrics
 */
export async function getDashboardAnalytics(options: AnalyticsOptions) {
	return AnalyticsService.getDashboardAnalytics(options);
}
