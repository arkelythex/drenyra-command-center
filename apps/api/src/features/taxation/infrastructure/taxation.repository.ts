import { db } from "@drenyra/persistence/client";
import { and, eq, gte, lte, sql } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";

/**
 * SalesSummaryRow interface.
 *
 * @example
 * ```ts
 * const value: SalesSummaryRow = {} as SalesSummaryRow;
 * console.log(value);
 * ```
 */
export interface SalesSummaryRow {
	subtotal: string;
	igv: string;
}

/**
 * RevenueSummaryRow interface.
 *
 * @example
 * ```ts
 * const value: RevenueSummaryRow = {} as RevenueSummaryRow;
 * console.log(value);
 * ```
 */
export interface RevenueSummaryRow {
	total: string;
}

/**
 * DetractionInvoiceRow interface.
 *
 * @example
 * ```ts
 * const value: DetractionInvoiceRow = {} as DetractionInvoiceRow;
 * console.log(value);
 * ```
 */
export interface DetractionInvoiceRow {
	id: string;
	dueDate: Date;
	totalAmount: string;
	currency: string;
}

/**
 * TaxationRepository class.
 *
 * @example
 * ```ts
 * const value = new TaxationRepository();
 * console.log(value);
 * ```
 */
export class TaxationRepository {
	async getSalesSummary(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<SalesSummaryRow> {
		const rows = await db
			.select({
				subtotal: sql<string>`COALESCE(SUM(CAST(${invoices.subtotal} AS DECIMAL)), 0)`,
				igv: sql<string>`COALESCE(SUM(CAST(${invoices.igvAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					gte(invoices.issueDate, startDate),
					lte(invoices.issueDate, endDate),
				),
			);

		return {
			subtotal: rows[0]?.subtotal ?? "0",
			igv: rows[0]?.igv ?? "0",
		};
	}

	async getPaidRevenue(
		companyId: string,
		year: number,
	): Promise<RevenueSummaryRow> {
		const startDate = new Date(year, 0, 1);
		const endDate = new Date(year, 11, 31);

		const rows = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.status, "PAID"),
					gte(invoices.issueDate, startDate),
					lte(invoices.issueDate, endDate),
				),
			);

		return {
			total: rows[0]?.total ?? "0",
		};
	}

	async findInvoicesAboveAmount(
		companyId: string,
		minimumAmount: string,
	): Promise<DetractionInvoiceRow[]> {
		return await db
			.select({
				id: invoices.id,
				dueDate: invoices.dueDate,
				totalAmount: invoices.totalAmount,
				currency: invoices.currency,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					sql`CAST(${invoices.totalAmount} AS DECIMAL) > CAST(${minimumAmount} AS DECIMAL)`,
				),
			);
	}
}

/**
 * taxationRepository const.
 *
 * @example
 * ```ts
 * console.log(taxationRepository);
 * ```
 */
export const taxationRepository = new TaxationRepository();
