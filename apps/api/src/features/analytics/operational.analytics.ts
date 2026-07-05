import { db } from "@drenyra/persistence/client";
import { eq, sql } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";
import type {
	AnalyticsOptions,
	OperationalKPIs,
} from "./types/analytics.types";

/**
 * Operational Analytics Module
 *
 * Calculates operational KPIs for invoice management and collection efficiency.
 *
 * **Metrics Calculated**:
 * - `totalInvoices`: Count of all invoices (all statuses)
 * - `paidInvoices`: Count of invoices with PAID status
 * - `pendingInvoices`: Count of invoices with SENT status (awaiting payment)
 * - `overdueInvoices`: Count of overdue invoices (OVERDUE status)
 * - `draftInvoices`: Count of draft invoices (unsent)
 * - `cancelledInvoices`: Count of cancelled invoices
 * - `collectionRate`: (Paid ÷ Total) × 100%
 * - `overdueRate`: (Overdue ÷ Total) × 100%
 * - `averageDaysToPayment`: Placeholder (0), calculated separately
 */
export class OperationalAnalytics {
	/**
	 * Calculate operational KPIs for invoice management and collection efficiency.
	 *
	 * @param options - Analytics options (companyId required)
	 * @returns Promise resolving to operational KPIs with percentages
	 */
	static async getKPIs(options: AnalyticsOptions): Promise<OperationalKPIs> {
		const { companyId } = options;
		const statusCounts = await db
			.select({ status: invoices.status, count: sql<number>`COUNT(*)` })
			.from(invoices)
			.where(eq(invoices.companyId, companyId))
			.groupBy(invoices.status);

		const counts = {
			total: 0,
			paid: 0,
			pending: 0,
			overdue: 0,
			draft: 0,
			cancelled: 0,
		};
		statusCounts.forEach(({ status, count }) => {
			counts.total += count;
			if (status === "PAID") counts.paid = count;
			if (status === "SENT") counts.pending = count;
			if (status === "OVERDUE") counts.overdue = count;
			if (status === "DRAFT") counts.draft = count;
			if (status === "CANCELLED") counts.cancelled = count;
		});

		return {
			totalInvoices: counts.total,
			paidInvoices: counts.paid,
			pendingInvoices: counts.pending,
			overdueInvoices: counts.overdue,
			draftInvoices: counts.draft,
			cancelledInvoices: counts.cancelled,
			collectionRate: counts.total > 0 ? (counts.paid / counts.total) * 100 : 0,
			overdueRate: counts.total > 0 ? (counts.overdue / counts.total) * 100 : 0,
			averageDaysToPayment: 0, // Placeholder
		};
	}
}
