import { ComplianceAnalytics } from "./compliance.analytics";
import { CustomerAnalytics } from "./customer.analytics";
import { FinancialAnalytics } from "./financial.analytics";
import { OperationalAnalytics } from "./operational.analytics";
import { TaxAnalytics } from "./tax.analytics";
import { TrendAnalytics } from "./trend.analytics";
import type { AnalyticsOptions } from "./types/analytics.types";

/**
 * Analytics application service (facade).
 *
 * Thin facade that delegates to 6 independent KPI domain modules.
 * All queries are executed in parallel for performance.
 *
 * @example
 * ```ts
 * const dashboard = await AnalyticsService.getDashboardAnalytics({
 *   companyId: "cmp_123",
 *   currency: "PEN"
 * });
 * ```
 */
export class AnalyticsService {
	/**
	 * Get complete dashboard analytics with all KPI categories.
	 *
	 * Aggregates financial, operational, tax, customer, trend, and compliance metrics.
	 * All queries are executed in parallel for performance.
	 */
	static async getDashboardAnalytics(options: AnalyticsOptions) {
		const [financial, operational, tax, customerMetrics, trends, compliance] =
			await Promise.allSettled([
				FinancialAnalytics.getKPIs(options),
				OperationalAnalytics.getKPIs(options),
				TaxAnalytics.getKPIs(options),
				CustomerAnalytics.getKPIs(options),
				TrendAnalytics.getTrendAnalytics(options),
				ComplianceAnalytics.getMetrics(options),
			]);

		return {
			financial: financial.status === "fulfilled" ? financial.value : undefined,
			operational:
				operational.status === "fulfilled" ? operational.value : undefined,
			tax: tax.status === "fulfilled" ? tax.value : undefined,
			customers:
				customerMetrics.status === "fulfilled"
					? customerMetrics.value
					: undefined,
			trends: trends.status === "fulfilled" ? trends.value : undefined,
			compliance:
				compliance.status === "fulfilled" ? compliance.value : undefined,
		};
	}

	/** Calculate comprehensive financial KPIs for a company. */
	static async getFinancialKPIs(options: AnalyticsOptions) {
		return FinancialAnalytics.getKPIs(options);
	}

	/** Calculate operational KPIs for invoice management and collection efficiency. */
	static async getOperationalKPIs(options: AnalyticsOptions) {
		return OperationalAnalytics.getKPIs(options);
	}

	/** Calculate tax KPIs for SUNAT 2026 compliance and reporting. */
	static async getTaxKPIs(options: AnalyticsOptions) {
		return TaxAnalytics.getKPIs(options);
	}

	/** Calculate customer analytics and segmentation KPIs. */
	static async getCustomerKPIs(options: AnalyticsOptions) {
		return CustomerAnalytics.getKPIs(options);
	}

	/** Calculate trend analytics for historical analysis and forecasting. */
	static async getTrendAnalytics(options: AnalyticsOptions) {
		return TrendAnalytics.getTrendAnalytics(options);
	}

	/** Calculate SUNAT compliance metrics and scoring. */
	static async getComplianceMetrics(options: AnalyticsOptions) {
		return ComplianceAnalytics.getMetrics(options);
	}
}
