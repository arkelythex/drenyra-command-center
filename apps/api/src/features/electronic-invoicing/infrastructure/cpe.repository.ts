/**
 * CPE Repository — isolates all database access for electronic invoicing.
 * Follows the Repository pattern: no raw Drizzle queries outside this file.
 */

import { db } from "@drenyra/persistence/client";
import { and, eq, gte } from "@drenyra/persistence/query";
import {
	businessPartners,
	invoices,
	transactions,
} from "@drenyra/persistence/schema";

export class CpeRepository {
	static async findTransactionByIdAndCompany(
		transactionId: string,
		companyId: string,
	) {
		return db.query.transactions.findFirst({
			where: and(
				eq(transactions.id, transactionId),
				eq(transactions.companyId, companyId),
			),
		});
	}

	static async findTransactionWithTags(transactionId: string) {
		return db.query.transactions.findFirst({
			where: eq(transactions.id, transactionId),
			columns: { tags: true },
		});
	}

	static async findTransactionForStatusSync(transactionId: string) {
		return db.query.transactions.findFirst({
			where: eq(transactions.id, transactionId),
			columns: { companyId: true, series: true, number: true },
		});
	}

	static async updateTransactionStatus(
		transactionId: string,
		status: string,
		tags: Record<string, unknown>,
	) {
		await db
			.update(transactions)
			.set({
				status: status as typeof transactions.$inferInsert.status,
				tags,
				updatedAt: new Date(),
			})
			.where(eq(transactions.id, transactionId));
	}

	static async updateTransactionTags(
		transactionId: string,
		tags: Record<string, unknown>,
	) {
		await db
			.update(transactions)
			.set({ tags, updatedAt: new Date() })
			.where(eq(transactions.id, transactionId));
	}

	static async findBusinessPartnerById(partnerId: string) {
		return db.query.businessPartners.findFirst({
			where: eq(businessPartners.id, partnerId),
			columns: { taxId: true },
		});
	}

	static async findInvoiceByIdAndCompany(invoiceId: string, companyId: string) {
		return db.query.invoices.findFirst({
			where: and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)),
			columns: { id: true, companyId: true, series: true, correlative: true },
		});
	}

	static async findInvoicesByCompanyAndSeries(
		companyId: string,
		series: string,
	) {
		return db.query.invoices.findMany({
			where: and(
				eq(invoices.companyId, companyId),
				eq(invoices.series, series),
			),
			columns: { id: true, correlative: true },
			limit: 50,
		});
	}

	static async updateInvoiceStatus(
		invoiceId: string,
		updates: Record<string, unknown>,
	) {
		await db
			.update(invoices)
			.set(updates as Partial<typeof invoices.$inferInsert>)
			.where(eq(invoices.id, invoiceId));
	}

	static async findTransactionsByCompanyAndDate(
		companyId: string,
		since: Date,
	) {
		return db.query.transactions.findMany({
			where: and(
				eq(transactions.companyId, companyId),
				gte(transactions.createdAt, since),
			),
			columns: { status: true },
		});
	}

	static async findRecentRejectedTransactions(companyId: string, since: Date) {
		return db.query.transactions.findMany({
			where: and(
				eq(transactions.companyId, companyId),
				eq(transactions.status, "REJECTED"),
				gte(transactions.updatedAt, since),
			),
			columns: { series: true, number: true, tags: true, updatedAt: true },
			orderBy: (t, { desc }) => desc(t.updatedAt),
			limit: 5,
		});
	}

	static async findTransactionsByCompanyAndSeries(
		companyId: string,
		series: string,
		number?: string | null,
	) {
		const baseConditions = [
			eq(transactions.companyId, companyId),
			eq(transactions.series, series),
		];
		if (number) {
			baseConditions.push(eq(transactions.number, number));
		}
		return db.query.transactions.findMany({
			where: and(...baseConditions),
			columns: { id: true, number: true },
			limit: number ? 2 : 50,
		});
	}

	static async findTransactionByIdWithTenant(
		transactionId: string,
		companyId?: string,
	) {
		return db.query.transactions.findFirst({
			where: companyId
				? and(
						eq(transactions.id, transactionId),
						eq(transactions.companyId, companyId),
					)
				: eq(transactions.id, transactionId),
			columns: { id: true },
		});
	}

	static async findInvoicesByInvoiceNumber(
		invoiceNumber: string,
		companyId?: string,
	) {
		const normalized = invoiceNumber.trim().toUpperCase();
		return db.query.invoices.findMany({
			where: companyId
				? and(
						eq(invoices.invoiceNumber, normalized),
						eq(invoices.companyId, companyId),
					)
				: eq(invoices.invoiceNumber, normalized),
			columns: { companyId: true, series: true, correlative: true },
			limit: 2,
		});
	}
}
