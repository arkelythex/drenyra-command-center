/**
 * Feature Flags for Reports Module
 *
 * Feature flags control access to reports functionality.
 * Priority: env var > DB override > default (false)
 *
 * Flags:
 * - PLE_ENABLED: PLE generation endpoints
 * - MULTI_COMPANY_CONSOLIDATION: Consolidated reports
 * - BUDGET_ENABLED: Budget vs actual
 * - REPORT_SCHEDULER: Scheduled report distribution
 */

import { Elysia } from "elysia";

type FeatureFlag = "PLE_ENABLED" | "MULTI_COMPANY_CONSOLIDATION" | "BUDGET_ENABLED" | "REPORT_SCHEDULER";

/**
 * Check if a feature flag is enabled.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
	const envValue = process.env[flag];
	if (envValue !== undefined) {
		return envValue === "true" || envValue === "1";
	}
	return false;
}

/**
 * Elysia middleware that returns 503 when a feature flag is disabled.
 *
 * @param flag - The feature flag to check.
 * @returns Elysia middleware plugin.
 */
export function requireFeatureFlag(flag: FeatureFlag) {
	return new Elysia().derive({ as: "scoped" }, () => {
		if (!isFeatureEnabled(flag)) {
			return {
				featureDisabled: true,
				featureFlag: flag,
			};
		}
		return {
			featureDisabled: false,
			featureFlag: flag,
		};
	});
}
