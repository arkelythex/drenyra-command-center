/**
 * Transaction Repository — ADAPTER (Drizzle ORM)
 *
 * Implements ITransactionRepository using Drizzle + PostgreSQL.
 * All SQL lives here. Business logic stays in the application handlers.
 *
 * Performance: list() filters at DB level (WHERE) — avoids N+1 of the legacy service.
 */

import { db } from "@drenyra/persistence/client";
import { and, desc, eq } from "@drenyra/persistence/query";
import { transactions } from "@drenyra/persistence/schema";
import type {
	TransactionFilters,
	TransactionInsertData,
	TransactionRow,
	TransactionWithPartner,
	TypeSummaryEntry,
} from "../domain/transaction.entity";
import type { ITransactionRepository } from "../domain/transaction.repository";

class TransactionRepository implements ITransactionRepository {
	async list(filters: TransactionFilters): Promise<TransactionWithPartner[]> {
		const conditions = [eq(transactions.companyId, filters.companyId)];

		if (filters.type) {
			// Input validated by Elysia schema — safe to cast to the DB enum
			conditions.push(
				eq(
					transactions.type,
					filters.type.toUpperCase() as "INCOME" | "EXPENSE",
				),
			);
		}
		if (filters.partnerId) {
			conditions.push(eq(transactions.partnerId, filters.partnerId));
		}

		const rows = await db.query.transactions.findMany({
			where: and(...conditions),
			orderBy: [desc(transactions.issueDate)],
			with: { partner: true },
		});

		return rows as unknown as TransactionWithPartner[];
	}

	async insertOne(data: TransactionInsertData): Promise<TransactionRow> {
		const [row] = await db
			.insert(transactions)
			.values({
				companyId: data.companyId,
				type: data.type,
				partnerId: data.partnerId,
				totalAmount: data.totalAmount,
				igvAmount: data.igvAmount,
				number: data.number,
				documentType: data.documentType,
				issueDate: data.issueDate,
				currency: data.currency,
				isDetraction: data.isDetraction,
				tags: data.tags,
			})
			.returning();

		return row as unknown as TransactionRow;
	}

	async findById(
		id: string,
		companyId: string,
	): Promise<TransactionWithPartner | undefined> {
		const row = await db.query.transactions.findFirst({
			where: and(
				eq(transactions.id, id),
				eq(transactions.companyId, companyId),
			),
			with: { partner: true },
		});
		return row as unknown as TransactionWithPartner | undefined;
	}

	async update(
		id: string,
		updates: Record<string, unknown>,
		companyId: string,
	): Promise<TransactionRow | undefined> {
		const [row] = await db
			.update(transactions)
			.set(updates)
			.where(
				and(eq(transactions.id, id), eq(transactions.companyId, companyId)),
			)
			.returning();
		return row as unknown as TransactionRow | undefined;
	}

	async delete(id: string, companyId: string): Promise<boolean> {
		const rows = await db
			.delete(transactions)
			.where(
				and(eq(transactions.id, id), eq(transactions.companyId, companyId)),
			)
			.returning({ id: transactions.id });
		return rows.length > 0;
	}

	async getSummaryByType(
		companyId: string,
	): Promise<Record<string, TypeSummaryEntry>> {
		const rows = await db.query.transactions.findMany({
			where: eq(transactions.companyId, companyId),
		});

		return (rows as unknown as TransactionRow[]).reduce<
			Record<string, TypeSummaryEntry>
		>((acc, tx) => {
			const key = tx.type.toLowerCase();
			acc[key] ??= { count: 0, total: 0, igv: 0 };
			acc[key].count += 1;
			acc[key].total += parseFloat(tx.totalAmount);
			acc[key].igv += parseFloat(tx.igvAmount);
			return acc;
		}, {});
	}
}

/**
 *  Singleton repository instance — injected into all handlers at startup
 * @example
 * ```ts
 * console.log(transactionRepository);
 * ```
 */

export const transactionRepository = new TransactionRepository();
