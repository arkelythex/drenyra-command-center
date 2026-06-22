/**
 * GetCustomerKPIs — Returns customer analytics and segmentation.
 *
 * Returns customer counts, top customers by revenue, and segmentation metrics.
 *
 * @module analytics/application/queries
 */

import { AnalyticsService } from "../../analytics.service";
import type { AnalyticsOptions } from "../../types/analytics.types";

/**
 * Returns customer analytics and segmentation KPIs for a company.
 *
 * @param options - Analytics options including companyId, date range, and currency
 * @returns Customer KPIs including counts, top customers, and segmentation
 */
export async function getCustomerKPIs(options: AnalyticsOptions) {
	return AnalyticsService.getCustomerKPIs(options);
}
