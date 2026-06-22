/**
 * GetOperationalKPIs — Returns operational KPIs (invoice status, collection rates).
 *
 * Returns invoice counts by status, collection rate, and overdue metrics.
 *
 * @module analytics/application/queries
 */

import { AnalyticsService } from "../../analytics.service";
import type { AnalyticsOptions } from "../../types/analytics.types";

/**
 * Returns operational KPIs for invoice management and collection efficiency.
 *
 * @param options - Analytics options including companyId
 * @returns Operational KPIs including invoice counts by status and rates
 */
export async function getOperationalKPIs(options: AnalyticsOptions) {
	return AnalyticsService.getOperationalKPIs(options);
}
