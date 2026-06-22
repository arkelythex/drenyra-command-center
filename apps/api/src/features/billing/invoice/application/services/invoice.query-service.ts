/**
 * Invoice Query Service - Application Layer
 *
 * Provides read-only queries for Invoice feature.
 * Used by other features (like Banking) to query invoices without direct DB access.
 *
 * Following Vertical Slice: Queries are separate from Commands.
 * Dependencies flow: Infrastructure -> Application -> Domain
 *
 * @layer Application
 * @pattern Query Service (CQRS Read Side)
 */

import { db } from "@arkelythex/persistence/client";
import { and, eq, gte, like, lte } from "@arkelythex/persistence/query";
import { invoices } from "@arkelythex/persistence/schema";

/**
 * Date window used by invoice read-side queries.
 *
 * @example
 * ```ts
 * const range: DateRange = { start: new Date('2026-01-01'), end: new Date('2026-01-31') };
 * ```
 */
export interface DateRange {
	start: Date;
	end: Date;
}

/**
 * Minimal invoice read model used for reconciliation and lookups.
 *
 * @example
 * ```ts
 * const row = { id: 'inv_123', invoiceNumber: 'F001-00000001', balanceDue: '10.00', dueDate: new Date() } as InvoiceQueryResult;
 * ```
 */
export interface InvoiceQueryResult {
	id: string;
	invoiceNumber: string;
	balanceDue: string;
	dueDate: Date;
}

/**
 * Read-side query service for invoice lookups (CQRS pattern).
 *
 * Optimized for reconciliation use cases by returning minimal invoice data.
 * Used by Banking feature to match bank transactions with pending invoices.
 *
 * @example
 * ```ts
 * const qs = new InvoiceQueryService();
 * const pending = await qs.findByNumber('cmp_123', 'F001-00000001');
 * if (pending) {
 *   console.log(`Invoice ${pending.invoiceNumber} has balance ${pending.balanceDue}`);
 * }
 * ```
 */
export class InvoiceQueryService {
	/**
	 * Find invoices pending payment by exact amount.
	 *
	 * Used for amount-based reconciliation matching.
	 * Only returns invoices with balanceDue > 0.
	 *
	 * @param companyId - Company ID for multi-tenancy
	 * @param amount - Exact amount to match as decimal string (e.g., "150.00")
	 * @returns Array of matching invoices
	 * @example
	 * ```ts
	 * const matches = await qs.findPendingByAmount('cmp_123', '150.00');
	 * console.log(`Found ${matches.length} invoices with balance S/ 150.00`);
	 * ```
	 */
	async findPendingByAmount(
		companyId: string,
		amount: string,
	): Promise<InvoiceQueryResult[]> {
		return db.query.invoices.findMany({
			where: and(
				eq(invoices.companyId, companyId),
				eq(invoices.balanceDue, amount),
				gte(invoices.balanceDue, "0.01"), // Only pending invoices
			),
			columns: {
				id: true,
				invoiceNumber: true,
				balanceDue: true,
				dueDate: true,
			},
		}) as unknown as InvoiceQueryResult[];
	}

	/**
	 * Find invoices pending payment within a due date range.
	 *
	 * Used for date-based reconciliation (matches transaction date to invoice due date).
	 * Only returns invoices with balanceDue > 0.01.
	 *
	 * @param companyId - Company ID
	 * @param dateRange - Date window to search within
	 * @returns Array of invoices with due dates in range
	 * @example
	 * ```ts
	 * const matches = await qs.findPendingByDueDate('cmp_123', {
	 *   start: new Date('2026-01-01'),
	 *   end: new Date('2026-01-31'),
	 * });
	 * ```
	 */
	async findPendingByDueDate(
		companyId: string,
		dateRange: DateRange,
	): Promise<InvoiceQueryResult[]> {
		return db.query.invoices.findMany({
			where: and(
				eq(invoices.companyId, companyId),
				gte(invoices.dueDate, dateRange.start),
				lte(invoices.dueDate, dateRange.end),
				gte(invoices.balanceDue, "0.01"),
			),
			columns: {
				id: true,
				invoiceNumber: true,
				balanceDue: true,
				dueDate: true,
			},
		}) as unknown as InvoiceQueryResult[];
	}

	/**
	 * Find invoice by invoice number (supports partial matching).
	 *
	 * Used for reference-based reconciliation when bank transaction contains invoice number.
	 * Uses LIKE pattern matching to handle variations (e.g., "F001-1" matches "F001-00000001").
	 *
	 * @param companyId - Company ID
	 * @param invoiceNumber - Full or partial invoice number
	 * @returns First matching invoice, or null if none found
	 * @example
	 * ```ts
	 * const invoice = await qs.findByNumber('cmp_123', 'F001-1');
	 * if (invoice) console.log(`Found: ${invoice.invoiceNumber}`);
	 * ```
	 */
	async findByNumber(
		companyId: string,
		invoiceNumber: string,
	): Promise<InvoiceQueryResult | null> {
		const parsed = this.parseSeriesAndCorrelative(invoiceNumber);
		if (parsed) {
			const exactBySeries = await db.query.invoices.findFirst({
				where: and(
					eq(invoices.companyId, companyId),
					eq(invoices.series, parsed.series),
					eq(invoices.correlative, parsed.correlative),
				),
				columns: {
					id: true,
					invoiceNumber: true,
					balanceDue: true,
					dueDate: true,
				},
			});

			if (exactBySeries) {
				return exactBySeries as InvoiceQueryResult;
			}
		}

		const result = await db.query.invoices.findFirst({
			where: and(
				eq(invoices.companyId, companyId),
				like(
					invoices.invoiceNumber,
					`%${this.escapeLikePattern(invoiceNumber)}%`,
				),
			),
			columns: {
				id: true,
				invoiceNumber: true,
				balanceDue: true,
				dueDate: true,
			},
		});

		return result as InvoiceQueryResult | null;
	}

	/**
	 * Find invoices by customer and exact amount.
	 *
	 * Used for entity-based reconciliation when customer ID is known.
	 * Combines customer filter with amount matching for higher confidence.
	 *
	 * @param companyId - Company ID
	 * @param customerId - Customer ID
	 * @param amount - Exact balance due to match
	 * @returns Array of matching invoices
	 * @example
	 * ```ts
	 * const matches = await qs.findByCustomer('cmp_123', 'cus_456', '150.00');
	 * ```
	 */
	async findByCustomer(
		companyId: string,
		customerId: string,
		amount: string,
	): Promise<InvoiceQueryResult[]> {
		return db.query.invoices.findMany({
			where: and(
				eq(invoices.companyId, companyId),
				eq(invoices.customerId, customerId),
				eq(invoices.balanceDue, amount),
			),
			columns: {
				id: true,
				invoiceNumber: true,
				balanceDue: true,
				dueDate: true,
			},
		}) as unknown as InvoiceQueryResult[];
	}

	/**
	 * Find invoices by amount within a date range (combined criteria).
	 *
	 * Used for high-confidence reconciliation matching.
	 * Combines both amount and date range filters.
	 *
	 * @param companyId - Company ID
	 * @param amount - Exact balance due
	 * @param dateRange - Due date window
	 * @returns Array of invoices matching both criteria
	 * @example
	 * ```ts
	 * const matches = await qs.findByAmountAndDateRange(
	 *   'cmp_123',
	 *   '150.00',
	 *   { start: new Date('2026-01-01'), end: new Date('2026-01-31') }
	 * );
	 * ```
	 */
	async findByAmountAndDateRange(
		companyId: string,
		amount: string,
		dateRange: DateRange,
	): Promise<InvoiceQueryResult[]> {
		return db.query.invoices.findMany({
			where: and(
				eq(invoices.companyId, companyId),
				eq(invoices.balanceDue, amount),
				gte(invoices.issueDate, dateRange.start),
				lte(invoices.issueDate, dateRange.end),
			),
			columns: {
				id: true,
				invoiceNumber: true,
				balanceDue: true,
				dueDate: true,
			},
		}) as unknown as InvoiceQueryResult[];
	}

	/**
	 * Escape LIKE pattern special characters to prevent SQL injection.
	 *
	 * Escapes: % (wildcard), _ (single char), \ (escape char).
	 *
	 * @param pattern - Raw user input
	 * @returns Escaped pattern safe for SQL LIKE
	 */
	private escapeLikePattern(pattern: string): string {
		return pattern.replace(/[%_\\]/g, "\\$&");
	}

	private parseSeriesAndCorrelative(
		reference: string,
	): { series: string; correlative: number } | null {
		const normalized = reference.trim().toUpperCase();
		const match = normalized.match(/([A-Z]\d{3})[- ]?0*(\d+)/);
		if (!match) return null;

		const series = match[1];
		const correlative = Number.parseInt(match[2] ?? "", 10);
		if (!Number.isFinite(correlative)) return null;

		return { series, correlative };
	}
}
