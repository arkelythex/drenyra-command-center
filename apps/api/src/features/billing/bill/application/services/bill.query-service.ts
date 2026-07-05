/**
 * Bill Query Service - Application Layer
 *
 * Provides read-only queries for Bill feature.
 * Used by other features (like Banking) to query bills without direct DB access.
 *
 * Following Vertical Slice: Queries are separate from Commands.
 * Dependencies flow: Infrastructure -> Application -> Domain
 *
 * @layer Application
 * @pattern Query Service (CQRS Read Side)
 */

import { db } from "@drenyra/persistence/client";
import { and, eq, gte, like, lte } from "@drenyra/persistence/query";
import { bills } from "@drenyra/persistence/schema";

/**
 * Date range (inclusive) used by bill queries.
 *
 * @example
 * ```ts
 * const range: DateRange = { start: new Date("2026-01-01"), end: new Date("2026-01-31") };
 * ```
 */
export interface DateRange {
	start: Date;
	end: Date;
}

/**
 * Minimal bill read model used for lookups and reconciliation.
 *
 * @example
 * ```ts
 * const row = { id: "bill_1", billNumber: "B001-1", totalAmount: "10.00", dueDate: new Date() } as BillQueryResult;
 * ```
 */
export interface BillQueryResult {
	id: string;
	billNumber: string;
	totalAmount: string;
	dueDate: Date;
}

/**
 * Read-side service for Bill queries (CQRS).
 *
 * @example
 * ```ts
 * const qs = new BillQueryService();
 * const bill = await qs.findByNumber("cmp_1", "B001-1");
 * ```
 */
export class BillQueryService {
	/**
	 * Find bills pending payment by amount
	 * Used for reconciliation matching
	 */
	async findPendingByAmount(
		companyId: string,
		amount: string,
	): Promise<BillQueryResult[]> {
		return db.query.bills.findMany({
			where: and(eq(bills.companyId, companyId), eq(bills.totalAmount, amount)),
			columns: {
				id: true,
				billNumber: true,
				totalAmount: true,
				dueDate: true,
			},
		}) as unknown as BillQueryResult[];
	}

	/**
	 * Find bills pending payment within date range
	 * Used for date-based reconciliation
	 */
	async findPendingByDueDate(
		companyId: string,
		dateRange: DateRange,
	): Promise<BillQueryResult[]> {
		return db.query.bills.findMany({
			where: and(
				eq(bills.companyId, companyId),
				gte(bills.dueDate, dateRange.start),
				lte(bills.dueDate, dateRange.end),
			),
			columns: {
				id: true,
				billNumber: true,
				totalAmount: true,
				dueDate: true,
			},
		}) as unknown as BillQueryResult[];
	}

	/**
	 * Find bill by exact bill number
	 * Used for reference-based reconciliation
	 */
	async findByNumber(
		companyId: string,
		billNumber: string,
	): Promise<BillQueryResult | null> {
		const result = await db.query.bills.findFirst({
			where: and(
				eq(bills.companyId, companyId),
				like(bills.billNumber, `%${this.escapeLikePattern(billNumber)}%`),
			),
			columns: {
				id: true,
				billNumber: true,
				totalAmount: true,
				dueDate: true,
			},
		});

		return result as BillQueryResult | null;
	}

	/**
	 * Find bills by vendor and amount
	 * Used for entity-based reconciliation
	 */
	async findByVendor(
		companyId: string,
		vendorId: string,
		amount: string,
	): Promise<BillQueryResult[]> {
		return db.query.bills.findMany({
			where: and(
				eq(bills.companyId, companyId),
				eq(bills.vendorId, vendorId),
				eq(bills.totalAmount, amount),
			),
			columns: {
				id: true,
				billNumber: true,
				totalAmount: true,
				dueDate: true,
			},
		}) as unknown as BillQueryResult[];
	}

	/**
	 * Find bills by amount and date range
	 * Combined query for amount+date matching
	 */
	async findByAmountAndDateRange(
		companyId: string,
		amount: string,
		dateRange: DateRange,
	): Promise<BillQueryResult[]> {
		return db.query.bills.findMany({
			where: and(
				eq(bills.companyId, companyId),
				eq(bills.totalAmount, amount),
				gte(bills.dueDate, dateRange.start),
				lte(bills.dueDate, dateRange.end),
			),
			columns: {
				id: true,
				billNumber: true,
				totalAmount: true,
				dueDate: true,
			},
		}) as unknown as BillQueryResult[];
	}

	/**
	 * Find all bills for a company (used for partial payment matching)
	 * Returns only unpaid bills
	 */
	async findAll(companyId: string): Promise<BillQueryResult[]> {
		return db.query.bills.findMany({
			where: eq(bills.companyId, companyId),
			columns: {
				id: true,
				billNumber: true,
				totalAmount: true,
				dueDate: true,
			},
		}) as unknown as BillQueryResult[];
	}

	/**
	 * Escape LIKE pattern special characters
	 * Prevents SQL injection in pattern matching
	 */
	private escapeLikePattern(pattern: string): string {
		return pattern.replace(/[%_\\]/g, "\\$&");
	}
}
