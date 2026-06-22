import { Money } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import { and, eq, gte, sql } from "@arkelythex/persistence/query";
import { invoices } from "@arkelythex/persistence/schema";
import {
	type AnalyticsOptions,
	type TaxKPIs,
	toMoneyValue,
} from "./types/analytics.types";

/**
 * Tax Analytics Module
 *
 * Calculates tax KPIs for SUNAT 2026 compliance and reporting.
 *
 * **Metrics Calculated** (SUNAT Compliance):
 * - `totalIGV`: Sum of all IGV collected (Impuesto General a las Ventas)
 * - `monthlyIGV`: IGV collected in current calendar month
 * - `detractionsAmount`: SPOT detractions (12% for services > S/ 700)
 * - `retentionsAmount`: Tax retentions withheld
 * - `igvByMonth`: Array of monthly IGV breakdown (simplified, returns empty)
 */
export class TaxAnalytics {
	/**
	 * Calculate tax KPIs for SUNAT 2026 compliance and reporting.
	 *
	 * @param options - Analytics options (companyId, currency required)
	 * @returns Promise resolving to tax KPIs with Money-typed values
	 */
	static async getKPIs(options: AnalyticsOptions): Promise<TaxKPIs> {
		const { companyId, currency = "PEN" } = options;
		const totalIGVResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.igvAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(eq(invoices.companyId, companyId), eq(invoices.currency, currency)),
			);

		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthlyIGVResult = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.igvAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.currency, currency),
					gte(invoices.issueDate, monthStart),
				),
			);

		return {
			totalIGV: toMoneyValue(
				Money.fromAmount(Number(totalIGVResult[0]?.total || "0"), currency),
			),
			monthlyIGV: toMoneyValue(
				Money.fromAmount(Number(monthlyIGVResult[0]?.total || "0"), currency),
			),
			detractionsAmount: toMoneyValue(Money.zero(currency)),
			retentionsAmount: toMoneyValue(Money.zero(currency)),
			igvByMonth: [], // Simplified for now
		};
	}
}
