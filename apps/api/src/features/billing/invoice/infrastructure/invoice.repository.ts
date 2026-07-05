/**
 * Invoice Repository - Infrastructure Layer
 * Implements IInvoiceRepository using Drizzle ORM
 *
 * Clean Architecture:
 * - Infrastructure implements domain interfaces
 * - Uses database schema and client from infrastructure package
 * - Maps between domain entities and database records
 */

import { Money } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import {
	and,
	desc,
	eq,
	gte,
	like,
	lte,
	sql,
} from "@drenyra/persistence/query";
import { invoiceItems, invoices } from "@drenyra/persistence/schema";
import type { SQL } from "drizzle-orm";
import {
	withCompanyRlsTransaction,
	withTenantRlsTransaction,
} from "../../../security/rls-db-context";
import {
	type Currency,
	Invoice,
	type InvoiceItem,
	type InvoiceStatus,
} from "../domain/invoice.entity";
import type {
	IInvoiceRepository,
	InvoiceListFilters,
	InvoiceListResult,
} from "../domain/invoice.repository.interface";

type InvoiceRow = typeof invoices.$inferSelect;
type InvoiceItemRow = typeof invoiceItems.$inferSelect;

/**
 * PostgreSQL implementation of IInvoiceRepository using Drizzle ORM.
 *
 * Handles:
 * - Domain entity to database record mapping
 * - Transaction management for atomic operations
 * - Relational queries (invoice + items)
 *
 * @example
 * ```ts
 * const repo = new InvoiceRepository();
 * const invoice = await repo.findById('inv_123');
 * ```
 */
export class InvoiceRepository implements IInvoiceRepository {
	/**
	 * Persist a new invoice with its line items.
	 *
	 * Uses transaction to ensure both invoice and items are saved atomically.
	 *
	 * @param invoice - Invoice aggregate to persist
	 * @returns Saved invoice with database-generated timestamps
	 * @throws Error if database constraint violated
	 */
	async create(invoice: Invoice): Promise<Invoice> {
		return withCompanyRlsTransaction(invoice.companyId, async (tx) => {
			const [savedInvoice] = await tx
				.insert(invoices)
				.values({
					id: invoice.id,
					companyId: invoice.companyId,
					customerId: invoice.customerId,
					invoiceNumber: invoice.invoiceNumber,
					series: invoice.series,
					correlative: invoice.correlative,
					issueDate: invoice.issueDate,
					dueDate: invoice.dueDate,
					currency: invoice.currency,
					exchangeRate: String(invoice.exchangeRate),
					subtotal: invoice.subtotal.toString(),
					igvAmount: invoice.igvAmount.toString(),
					totalAmount: invoice.totalAmount.toString(),
					balanceDue: invoice.balanceDue.toString(),
					status: invoice.status,
					cdrUrl: invoice.sunatCdr,
					sunatTicket: invoice.sunatTicket,
					notes: invoice.notes,
					createdAt: invoice.createdAt,
					updatedAt: invoice.updatedAt,
				})
				.returning();

			if (invoice.items.length > 0) {
				await tx.insert(invoiceItems).values(
					invoice.items.map((item) => ({
						id: item.id,
						invoiceId: invoice.id,
						productId: item.productId,
						description: item.description,
						quantity: String(item.quantity),
						unitPrice: item.unitPrice.toString(),
						taxType: item.taxType,
						igvRate: String(item.igvRate),
						subtotal: item.subtotal.toString(),
						igvAmount: item.igvAmount.toString(),
						totalAmount: item.totalAmount.toString(),
						createdAt: new Date(),
					})),
				);
			}

			const items = await tx
				.select()
				.from(invoiceItems)
				.where(eq(invoiceItems.invoiceId, invoice.id));

			return this.mapToDomain(savedInvoice, items);
		});
	}

	/**
	 * Retrieve invoice by ID with its line items.
	 *
	 * Uses Drizzle's relational query API for automatic join.
	 *
	 * @param id - Invoice UUID
	 * @returns Invoice entity or null if not found
	 */
	async findById(id: string): Promise<Invoice | null> {
		const companyId = await this.resolveCompanyIdByInvoiceId(id);

		if (!companyId) {
			return null;
		}

		const result = await withCompanyRlsTransaction(companyId, async (tx) => {
			return await tx.query.invoices.findFirst({
				where: eq(invoices.id, id),
				with: {
					items: true,
				},
			});
		});

		if (!result) {
			return null;
		}

		return this.mapToDomain(result, result.items || []);
	}

	/**
	 * Retrieve invoice by SUNAT invoice number.
	 *
	 * Scoped to company for multi-tenancy.
	 *
	 * @param invoiceNumber - Full invoice number (e.g., "F001-00000001")
	 * @param companyId - Company ID
	 * @returns Invoice entity or null
	 */
	async findByNumber(
		invoiceNumber: string,
		companyId: string,
	): Promise<Invoice | null> {
		const result = await db.query.invoices.findFirst({
			where: and(
				eq(invoices.invoiceNumber, invoiceNumber),
				eq(invoices.companyId, companyId),
			),
			with: {
				items: true,
			},
		});

		if (!result) {
			return null;
		}

		return this.mapToDomain(result, result.items || []);
	}

	/**
	 * List invoices with optional filters and pagination.
	 *
	 * Builds dynamic WHERE clause from filters.
	 * Returns total count for pagination metadata.
	 *
	 * @param filters - Query filters (status, date, customer, etc.)
	 * @returns Paginated invoice list with total count
	 */
	async list(filters: InvoiceListFilters): Promise<InvoiceListResult> {
		const {
			companyId,
			status,
			customerId,
			startDate,
			endDate,
			minAmount,
			maxAmount,
			search,
			limit = 20,
			offset = 0,
		} = filters;

		// Build where conditions dynamically
		const conditions: SQL<unknown>[] = [eq(invoices.companyId, companyId)];

		if (status) {
			conditions.push(eq(invoices.status, status));
		}

		if (customerId) {
			conditions.push(eq(invoices.customerId, customerId));
		}

		if (startDate) {
			conditions.push(gte(invoices.issueDate, startDate));
		}

		if (endDate) {
			conditions.push(lte(invoices.issueDate, endDate));
		}

		if (minAmount !== undefined) {
			conditions.push(gte(invoices.totalAmount, String(minAmount)));
		}

		if (maxAmount !== undefined) {
			conditions.push(lte(invoices.totalAmount, String(maxAmount)));
		}

		if (search) {
			conditions.push(like(invoices.invoiceNumber, `%${search}%`));
		}

		const whereClause =
			conditions.length > 1 ? and(...conditions) : conditions[0];

		// Get total count
		const countResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(invoices)
			.where(whereClause);

		const total = countResult[0]?.count || 0;

		// Get invoices with items using query API
		const results = await db.query.invoices.findMany({
			where: whereClause,
			with: {
				items: true,
			},
			orderBy: [desc(invoices.createdAt)],
			limit,
			offset,
		});

		const domainInvoices = results.map((result) =>
			this.mapToDomain(result, result.items || []),
		);

		return {
			invoices: domainInvoices,
			total,
			limit,
			offset,
		};
	}

	/**
	 * Update existing invoice (DRAFT only).
	 *
	 * Does NOT update line items (requires delete + recreate for item changes).
	 *
	 * @param invoice - Updated invoice entity
	 * @returns Updated invoice with new timestamp
	 */
	async update(invoice: Invoice): Promise<Invoice> {
		return await withCompanyRlsTransaction(invoice.companyId, async (tx) => {
			const [updated] = await tx
				.update(invoices)
				.set({
					customerId: invoice.customerId,
					issueDate: invoice.issueDate,
					dueDate: invoice.dueDate,
					currency: invoice.currency,
					exchangeRate: String(invoice.exchangeRate),
					subtotal: invoice.subtotal.toString(),
					igvAmount: invoice.igvAmount.toString(),
					totalAmount: invoice.totalAmount.toString(),
					balanceDue: invoice.balanceDue.toString(),
					status: invoice.status,
					cdrUrl: invoice.sunatCdr,
					sunatTicket: invoice.sunatTicket,
					notes: invoice.notes,
					updatedAt: new Date(),
				})
				.where(eq(invoices.id, invoice.id))
				.returning();

			await tx
				.delete(invoiceItems)
				.where(eq(invoiceItems.invoiceId, invoice.id));

			if (invoice.items.length > 0) {
				await tx.insert(invoiceItems).values(
					invoice.items.map((item) => ({
						id: item.id,
						invoiceId: invoice.id,
						productId: item.productId,
						description: item.description,
						quantity: String(item.quantity),
						unitPrice: item.unitPrice.toString(),
						taxType: item.taxType,
						igvRate: String(item.igvRate),
						subtotal: item.subtotal.toString(),
						igvAmount: item.igvAmount.toString(),
						totalAmount: item.totalAmount.toString(),
						createdAt: new Date(),
					})),
				);
			}

			const items = await tx
				.select()
				.from(invoiceItems)
				.where(eq(invoiceItems.invoiceId, invoice.id));

			return this.mapToDomain(updated, items);
		});
	}

	/**
	 * Update invoice status (lightweight operation).
	 *
	 * @param id - Invoice ID
	 * @param status - New status value
	 */
	async updateStatus(
		id: string,
		status: InvoiceStatus,
		legacyUserId?: string,
	): Promise<void> {
		const companyId = await this.resolveCompanyIdByInvoiceId(id);

		if (!companyId) {
			return;
		}

		const runInTenantContext = legacyUserId
			? <T>(work: Parameters<typeof withTenantRlsTransaction<T>>[1]) =>
					withTenantRlsTransaction({ companyId, userId: legacyUserId }, work)
			: <T>(work: Parameters<typeof withCompanyRlsTransaction<T>>[1]) =>
					withCompanyRlsTransaction(companyId, work);

		await runInTenantContext(async (tx) => {
			await tx
				.update(invoices)
				.set({
					status,
					updatedAt: new Date(),
				})
				.where(eq(invoices.id, id));
		});
	}

	/**
	 * Apply payment to reduce invoice balance.
	 *
	 * Uses transaction to ensure atomic balance update.
	 * Automatically sets status to PAID when balance reaches zero.
	 *
	 * @param id - Invoice ID
	 * @param amount - Payment amount as decimal string
	 * @throws Error if invoice not found
	 */
	async applyPayment(id: string, amount: string): Promise<void> {
		const companyId = await this.resolveCompanyIdByInvoiceId(id);

		if (!companyId) {
			throw new Error("Invoice not found");
		}

		await withCompanyRlsTransaction(companyId, async (tx) => {
			const invoice = await tx.query.invoices.findFirst({
				where: eq(invoices.id, id),
			});

			if (!invoice) {
				throw new Error("Invoice not found");
			}

			const currentPaid = Number(invoice.paidAmount || "0");
			const newPaid = currentPaid + Number(amount);
			const total = Number(invoice.totalAmount);
			const newBalance = total - newPaid;

			await tx
				.update(invoices)
				.set({
					paidAmount: String(newPaid.toFixed(2)),
					balanceDue: String(newBalance.toFixed(2)),
					status: newBalance <= 0 ? "PAID" : invoice.status,
					paidDate: newBalance <= 0 ? new Date() : invoice.paidDate,
					updatedAt: new Date(),
				})
				.where(eq(invoices.id, id));
		});
	}

	/**
	 * Store SUNAT response artifacts after submission.
	 *
	 * Updates status to SENT and stores CDR URL/ticket.
	 *
	 * @param id - Invoice ID
	 * @param cdr - CDR URL or XML content
	 * @param ticket - SUNAT ticket number
	 */
	async updateSunatResponse(
		id: string,
		cdr: string,
		ticket: string,
	): Promise<void> {
		const companyId = await this.resolveCompanyIdByInvoiceId(id);

		if (!companyId) {
			return;
		}

		await withCompanyRlsTransaction(companyId, async (tx) => {
			await tx
				.update(invoices)
				.set({
					cdrUrl: cdr,
					sunatTicket: ticket,
					sunatStatus: "ACCEPTED",
					status: "SENT",
					updatedAt: new Date(),
				})
				.where(eq(invoices.id, id));
		});
	}

	/**
	 * Hard delete invoice and its items (DRAFT only).
	 *
	 * Uses transaction to delete items first (foreign key constraint).
	 *
	 * @param id - Invoice ID
	 * @throws Error if invoice is not DRAFT
	 */
	async delete(id: string): Promise<void> {
		const companyId = await this.resolveCompanyIdByInvoiceId(id);

		if (!companyId) {
			return;
		}

		await withCompanyRlsTransaction(companyId, async (tx) => {
			// Delete items first
			await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

			// Delete invoice
			await tx.delete(invoices).where(eq(invoices.id, id));
		});
	}

	/**
	 * Check if invoice number already exists (SUNAT uniqueness requirement).
	 *
	 * @param invoiceNumber - Invoice number to check
	 * @param companyId - Company ID
	 * @returns True if exists, false otherwise
	 */
	async exists(invoiceNumber: string, companyId: string): Promise<boolean> {
		const result = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(invoices)
			.where(
				and(
					eq(invoices.invoiceNumber, invoiceNumber),
					eq(invoices.companyId, companyId),
				),
			);

		return (result[0]?.count || 0) > 0;
	}

	/**
	 * Get next available correlative number for series.
	 *
	 * Calculates MAX(correlative) + 1 for the given series.
	 * Returns 1 if no invoices exist for series.
	 *
	 * @param companyId - Company ID
	 * @param series - Invoice series (e.g., "F001")
	 * @returns Next correlative number
	 */
	async getNextCorrelative(companyId: string, series: string): Promise<number> {
		const result = await db
			.select({
				maxCorrelative: sql<number>`COALESCE(MAX(${invoices.correlative}), 0) + 1`,
			})
			.from(invoices)
			.where(
				and(eq(invoices.companyId, companyId), eq(invoices.series, series)),
			);

		return result[0]?.maxCorrelative || 1;
	}

	private async resolveCompanyIdByInvoiceId(
		id: string,
	): Promise<string | null> {
		const record = await db.query.invoices.findFirst({
			columns: {
				companyId: true,
			},
			where: eq(invoices.id, id),
		});

		return record?.companyId ?? null;
	}

	/**
	 * Map database records to domain entity.
	 *
	 * Converts:
	 * - String amounts to Money value objects
	 * - Database dates to Date objects
	 * - Raw item records to InvoiceItem interfaces
	 *
	 * @param record - Database invoice record
	 * @param items - Database item records
	 * @returns Invoice domain entity
	 */
	private mapToDomain(record: InvoiceRow, items: InvoiceItemRow[]): Invoice {
		const currency = record.currency as Currency;

		const domainItems: InvoiceItem[] = items.map((item) => ({
			id: item.id,
			productId: item.productId ?? undefined,
			description: item.description,
			quantity: Number(item.quantity),
			unitPrice: Money.fromAmount(parseFloat(item.unitPrice), currency),
			taxType: item.taxType,
			igvRate: Number(item.igvRate),
			subtotal: Money.fromAmount(parseFloat(item.subtotal), currency),
			igvAmount: Money.fromAmount(parseFloat(item.igvAmount), currency),
			totalAmount: Money.fromAmount(parseFloat(item.totalAmount), currency),
		}));

		return new Invoice(
			record.id,
			record.companyId,
			record.customerId,
			record.series,
			record.correlative,
			record.invoiceNumber,
			new Date(record.issueDate),
			new Date(record.dueDate),
			currency,
			Number(record.exchangeRate),
			domainItems,
			Money.fromAmount(parseFloat(record.subtotal), currency),
			Money.fromAmount(parseFloat(record.igvAmount), currency),
			Money.fromAmount(parseFloat(record.totalAmount), currency),
			Money.fromAmount(parseFloat(record.balanceDue), currency),
			record.status,
			record.notes ?? undefined,
			new Date(record.createdAt),
			new Date(record.updatedAt),
			record.cdrUrl ?? undefined,
			record.sunatTicket ?? undefined,
			record.sunatStatus ?? undefined,
		);
	}
}
