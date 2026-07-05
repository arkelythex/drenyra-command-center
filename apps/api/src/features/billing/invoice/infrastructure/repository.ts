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
import type { InvoiceItemRow, InvoiceRow } from "./types";

export class InvoiceRepository implements IInvoiceRepository {
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

		const countResult = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(invoices)
			.where(whereClause);

		const total = countResult[0]?.count || 0;

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

	async delete(id: string): Promise<void> {
		const companyId = await this.resolveCompanyIdByInvoiceId(id);

		if (!companyId) {
			return;
		}

		await withCompanyRlsTransaction(companyId, async (tx) => {
			await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

			await tx.delete(invoices).where(eq(invoices.id, id));
		});
	}

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
