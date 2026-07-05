import { db } from "@drenyra/persistence/client";
import { and, eq, sql } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";
import type {
	AnalyticsOptions,
	ComplianceMetrics,
} from "./types/analytics.types";

/**
 * Compliance Analytics Module
 *
 * Calculates SUNAT compliance metrics and scoring.
 *
 * **Metrics Calculated**:
 * - `complianceScore`: Percentage score based on pending SUNAT invoices (0-100)
 * - `pendingSUNAT`: Count of invoices with NULL or PENDING sunatStatus
 * - `rejectedInvoices`: Count of SUNAT-rejected invoices (placeholder: 0)
 * - `missingDocuments`: Count of missing required documents (placeholder: 0)
 * - `issues`: Array of compliance issues and recommendations (placeholder: [])
 */
export class ComplianceAnalytics {
	/**
	 * Calculate SUNAT compliance metrics and scoring.
	 *
	 * @param options - Analytics options (companyId required)
	 * @returns Promise resolving to compliance metrics object
	 */
	static async getMetrics(
		options: AnalyticsOptions,
	): Promise<ComplianceMetrics> {
		const { companyId } = options;
		const pendingSUNATResult = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					sql`${invoices.sunatStatus} IS NULL OR ${invoices.sunatStatus} = 'PENDING'`,
				),
			);

		const pendingSUNAT = pendingSUNATResult[0]?.count || 0;
		return {
			complianceScore: Math.round(Math.max(0, 100 - pendingSUNAT * 2)),
			pendingSUNAT,
			rejectedInvoices: 0,
			missingDocuments: 0,
			issues: [],
		};
	}
}
