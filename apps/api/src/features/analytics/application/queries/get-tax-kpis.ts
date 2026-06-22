/**
 * GetTaxKPIs — Returns tax and compliance KPIs (IGV, detractions, retentions).
 *
 * Returns tax metrics for SUNAT 2026 reporting and compliance.
 * Includes IGV collected, detractions (SPOT), and retentions.
 *
 * @module analytics/application/queries
 */

import { AnalyticsService } from "../../analytics.service";
import type { AnalyticsOptions } from "../../types/analytics.types";

/**
 * Returns tax and compliance KPIs for a company.
 *
 * @param options - Analytics options including companyId, date range, and currency
 * @returns Tax KPIs including IGV, detractions, and retentions
 */
export async function getTaxKPIs(options: AnalyticsOptions) {
	return AnalyticsService.getTaxKPIs(options);
}
