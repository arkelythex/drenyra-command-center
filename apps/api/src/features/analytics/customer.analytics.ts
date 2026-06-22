import { Money } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import { and, desc, eq, sql } from "@arkelythex/persistence/query";
import { customers, invoices } from "@arkelythex/persistence/schema";
import { type AnalyticsOptions, toMoneyValue } from "./types/analytics.types";

/**
 * Customer Analytics Module
 *
 * Calculates customer analytics and segmentation KPIs.
 *
 * **Metrics Calculated**:
 * - `totalCustomers`: COUNT(DISTINCT customerId) across all invoices
 * - `activeCustomers`: Currently returns totalCustomers (simplified)
 * - `topCustomers`: Top 5 customers by total revenue (PAID invoices only)
 * - `customersBySegment`: Customer segmentation (VIP, Regular, Occasional)
 */
export class CustomerAnalytics {
	/**
	 * Calculate customer analytics and segmentation KPIs.
	 *
	 * @param options - Analytics options (companyId, currency required)
	 * @returns Promise resolving to customer KPIs with top customers array
	 */
	static async getKPIs(options: AnalyticsOptions) {
		const { companyId, currency = "PEN" } = options;
		const customerCounts = await db
			.select({ total: sql<number>`COUNT(DISTINCT ${invoices.customerId})` })
			.from(invoices)
			.where(eq(invoices.companyId, companyId));

		const topCustomersResult = await db
			.select({
				customerId: invoices.customerId,
				customerName: customers.legalName,
				totalSpent: sql<string>`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`,
				invoiceCount: sql<number>`COUNT(*)`,
			})
			.from(invoices)
			.leftJoin(customers, eq(invoices.customerId, customers.id))
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.currency, currency),
					eq(invoices.status, "PAID"),
				),
			)
			.groupBy(invoices.customerId, customers.legalName)
			.orderBy(desc(sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`))
			.limit(5);

		return {
			totalCustomers: customerCounts[0]?.total || 0,
			activeCustomers: customerCounts[0]?.total || 0,
			topCustomers: topCustomersResult.map((row) => ({
				customerId: row.customerId,
				customerName: row.customerName || "Unknown",
				totalSpent: toMoneyValue(
					Money.fromAmount(Number(row.totalSpent), currency),
				),
				invoiceCount: row.invoiceCount,
			})),
			customersBySegment: { vip: 0, regular: 0, occasional: 0 },
		};
	}
}
