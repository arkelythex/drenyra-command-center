/**
 * PostgreSQL Bank Transaction Repository.
 *
 * Adapter for the current modular banking schema. Legacy domain ids are numbers;
 * persisted ids are deterministic UUIDs to keep the boundary type-safe.
 */

import {
	BankTransaction,
	type BankTransactionType,
} from "@drenyra/domain/entities/BankTransaction";
import type {
	BankTransactionFilters,
	BankTransactionRepository,
	PaginatedResult,
	PaginationOptions,
} from "@drenyra/domain/repositories/bank-transaction.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import {
	and,
	count,
	desc,
	eq,
	gte,
	inArray,
	lte,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "../client";
import { bankAccounts, bankTransactions } from "../schema";
import { toStableUuid } from "./support/stable-uuid";

type BankTransactionRow = typeof bankTransactions.$inferSelect;
type Currency = "PEN" | "USD";
type DbTransactionType =
	| "deposit"
	| "withdrawal"
	| "transfer_in"
	| "transfer_out"
	| "fee"
	| "interest"
	| "check"
	| "other";

const transactionIdToUuid = (id: number): string =>
	toStableUuid(`legacy-bank-transaction:${id}`);
const accountIdToUuid = (id: number): string =>
	toStableUuid(`legacy-bank-account:${id}`);
const uuidToLegacyId = (id: string): number => {
	const numeric = Number.parseInt(id.replace(/\D/g, "").slice(0, 9), 10);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};
const toDateString = (date: Date): string => date.toISOString().slice(0, 10);
const toDecimal = (value: number): string => value.toFixed(2);

function mapDbTypeToDomain(dbType: string): BankTransactionType {
	const typeMap: Record<string, BankTransactionType> = {
		deposit: "DEPOSIT",
		withdrawal: "WITHDRAWAL",
		transfer_in: "TRANSFER_IN",
		transfer_out: "TRANSFER_OUT",
		fee: "FEE",
		interest: "INTEREST",
		check: "CHECK",
		other: "OTHER",
	};
	return typeMap[dbType.toLowerCase()] ?? "OTHER";
}

function mapDomainTypeToDb(domainType: BankTransactionType): DbTransactionType {
	const typeMap: Record<BankTransactionType, DbTransactionType> = {
		DEPOSIT: "deposit",
		WITHDRAWAL: "withdrawal",
		TRANSFER_IN: "transfer_in",
		TRANSFER_OUT: "transfer_out",
		FEE: "fee",
		INTEREST: "interest",
		CHECK: "check",
		OTHER: "other",
	};
	return typeMap[domainType];
}

export class PostgresBankTransactionRepository
	implements BankTransactionRepository
{
	async save(transaction: BankTransaction): Promise<BankTransaction> {
		const [saved] = await db
			.insert(bankTransactions)
			.values(await this.toInsert(transaction))
			.returning();
		if (!saved) throw new Error("Failed to create bank transaction");
		return this.mapToDomain(saved);
	}

	async saveMany(transactions: BankTransaction[]): Promise<BankTransaction[]> {
		const saved: BankTransaction[] = [];
		for (const transaction of transactions) {
			saved.push(await this.save(transaction));
		}
		return saved;
	}

	async update(transaction: BankTransaction): Promise<BankTransaction> {
		if (!transaction.canBeModified()) {
			throw new Error("No se puede modificar una transacción conciliada");
		}

		const [updated] = await db
			.update(bankTransactions)
			.set({
				transactionDate: toDateString(transaction.transactionDate),
				description: transaction.description,
				reference: transaction.reference ?? null,
				type: mapDomainTypeToDb(transaction.type),
				amount: toDecimal(transaction.amount.getAmount()),
				balance: transaction.balanceAfter
					? toDecimal(transaction.balanceAfter.getAmount())
					: null,
				isReconciled: transaction.isReconciled,
				reconciledAt: transaction.reconciledAt ?? null,
			})
			.where(eq(bankTransactions.id, transactionIdToUuid(transaction.id)))
			.returning();

		return updated ? this.mapToDomain(updated) : transaction;
	}

	async findById(
		id: number,
		bankAccountId: number,
	): Promise<BankTransaction | null> {
		const result = await db.query.bankTransactions.findFirst({
			where: and(
				eq(bankTransactions.id, transactionIdToUuid(id)),
				eq(bankTransactions.accountId, accountIdToUuid(bankAccountId)),
			),
		});
		return result ? this.mapToDomain(result) : null;
	}

	async findByBankAccount(
		bankAccountId: number,
		filters?: BankTransactionFilters,
		pagination?: PaginationOptions,
	): Promise<PaginatedResult<BankTransaction>> {
		const page = pagination?.page ?? 1;
		const limit = pagination?.limit ?? 50;
		const offset = (page - 1) * limit;
		const conditions = this.buildConditions(
			accountIdToUuid(bankAccountId),
			filters,
		);
		const whereCondition = and(...conditions);

		const rows = await db.query.bankTransactions.findMany({
			where: whereCondition,
			orderBy: [desc(bankTransactions.transactionDate)],
			limit,
			offset,
		});
		const [totalResult] = await db
			.select({ value: count() })
			.from(bankTransactions)
			.where(whereCondition);
		const total = totalResult?.value ?? 0;
		return {
			data: rows.map((row) => this.mapToDomain(row)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findUnreconciled(bankAccountId: number): Promise<BankTransaction[]> {
		const rows = await db.query.bankTransactions.findMany({
			where: and(
				eq(bankTransactions.accountId, accountIdToUuid(bankAccountId)),
				eq(bankTransactions.isReconciled, false),
			),
			orderBy: [desc(bankTransactions.transactionDate)],
		});
		return rows.map((row) => this.mapToDomain(row));
	}

	async findByImportBatch(importBatch: string): Promise<BankTransaction[]> {
		const rows = await db.query.bankTransactions.findMany({
			where: eq(bankTransactions.importedFrom, importBatch),
			orderBy: [desc(bankTransactions.transactionDate)],
		});
		return rows.map((row) => this.mapToDomain(row));
	}

	async count(
		bankAccountId: number,
		filters?: BankTransactionFilters,
	): Promise<number> {
		const [result] = await db
			.select({ value: count() })
			.from(bankTransactions)
			.where(
				and(...this.buildConditions(accountIdToUuid(bankAccountId), filters)),
			);
		return result?.value ?? 0;
	}

	async getSumByType(
		bankAccountId: number,
		dateFrom?: Date,
		dateTo?: Date,
	): Promise<Record<BankTransactionType, number>> {
		const conditions = this.buildConditions(accountIdToUuid(bankAccountId), {
			dateFrom,
			dateTo,
		});
		// Scope evidence: accountId belongs to a companyId-owned bank account; callers pass the scoped bankAccountId.
		const results = await db
			.select({
				type: bankTransactions.type,
				total: sql<string>`SUM(CAST(${bankTransactions.amount} AS DECIMAL))`,
			})
			.from(bankTransactions)
			.where(and(...conditions))
			.groupBy(bankTransactions.type);
		const sums: Record<BankTransactionType, number> = {
			DEPOSIT: 0,
			WITHDRAWAL: 0,
			TRANSFER_IN: 0,
			TRANSFER_OUT: 0,
			FEE: 0,
			INTEREST: 0,
			CHECK: 0,
			OTHER: 0,
		};
		for (const row of results)
			sums[mapDbTypeToDomain(row.type)] = Number(row.total ?? 0);
		return sums;
	}

	async delete(id: number, bankAccountId: number): Promise<void> {
		const existing = await this.findById(id, bankAccountId);
		if (!existing) throw new Error("Transacción no encontrada");
		if (!existing.canBeModified())
			throw new Error("No se puede eliminar una transacción conciliada");
		await db
			.delete(bankTransactions)
			.where(eq(bankTransactions.id, transactionIdToUuid(id)));
	}

	async deleteByImportBatch(importBatch: string): Promise<number> {
		const result = await db
			.delete(bankTransactions)
			.where(
				and(
					eq(bankTransactions.importedFrom, importBatch),
					eq(bankTransactions.isReconciled, false),
				),
			)
			.returning({ id: bankTransactions.id });
		return result.length;
	}

	async markAsReconciled(
		ids: number[],
		_reconciliationId: number,
	): Promise<void> {
		if (ids.length === 0) return;
		await db
			.update(bankTransactions)
			.set({ isReconciled: true, reconciledAt: new Date() })
			.where(inArray(bankTransactions.id, ids.map(transactionIdToUuid)));
	}

	async unmarkReconciled(ids: number[]): Promise<void> {
		if (ids.length === 0) return;
		await db
			.update(bankTransactions)
			.set({ isReconciled: false, reconciledAt: null })
			.where(inArray(bankTransactions.id, ids.map(transactionIdToUuid)));
	}

	private async toInsert(
		transaction: BankTransaction,
	): Promise<typeof bankTransactions.$inferInsert> {
		const accountId = accountIdToUuid(transaction.bankAccountId);
		const account = await db.query.bankAccounts.findFirst({
			where: eq(bankAccounts.id, accountId),
		});
		if (!account)
			throw new Error(`Bank account ${transaction.bankAccountId} not found`);
		return {
			id:
				transaction.id > 0
					? transactionIdToUuid(transaction.id)
					: toStableUuid(
							`legacy-bank-transaction:${accountId}:${transaction.transactionDate.toISOString()}:${transaction.description}`,
						),
			companyId: account.companyId,
			accountId,
			transactionDate: toDateString(transaction.transactionDate),
			description: transaction.description,
			reference: transaction.reference ?? null,
			type: mapDomainTypeToDb(transaction.type),
			amount: toDecimal(transaction.amount.getAmount()),
			balance: transaction.balanceAfter
				? toDecimal(transaction.balanceAfter.getAmount())
				: null,
			isReconciled: transaction.isReconciled,
			reconciledAt: transaction.reconciledAt ?? null,
			importedFrom: transaction.importBatch ?? null,
			createdAt: transaction.createdAt,
		};
	}

	private buildConditions(
		accountId: string,
		filters?: BankTransactionFilters,
	): SQL<unknown>[] {
		const conditions: SQL<unknown>[] = [
			eq(bankTransactions.accountId, accountId),
		];
		if (filters?.isReconciled !== undefined)
			conditions.push(eq(bankTransactions.isReconciled, filters.isReconciled));
		if (filters?.type)
			conditions.push(
				eq(bankTransactions.type, mapDomainTypeToDb(filters.type)),
			);
		if (filters?.dateFrom)
			conditions.push(
				gte(bankTransactions.transactionDate, toDateString(filters.dateFrom)),
			);
		if (filters?.dateTo)
			conditions.push(
				lte(bankTransactions.transactionDate, toDateString(filters.dateTo)),
			);
		if (filters?.importBatch)
			conditions.push(eq(bankTransactions.importedFrom, filters.importBatch));
		if (filters?.minAmount !== undefined)
			conditions.push(
				gte(bankTransactions.amount, toDecimal(filters.minAmount)),
			);
		if (filters?.maxAmount !== undefined)
			conditions.push(
				lte(bankTransactions.amount, toDecimal(filters.maxAmount)),
			);
		return conditions;
	}

	private mapToDomain(raw: BankTransactionRow): BankTransaction {
		const currency: Currency = "PEN";
		return BankTransaction.create({
			id: uuidToLegacyId(raw.id),
			bankAccountId: uuidToLegacyId(raw.accountId),
			transactionDate: new Date(raw.transactionDate),
			description: raw.description,
			reference: raw.reference ?? undefined,
			type: mapDbTypeToDomain(raw.type),
			amount: Money.fromAmount(Math.abs(Number(raw.amount)), currency),
			balanceAfter: raw.balance
				? Money.fromAmount(Number(raw.balance), currency)
				: undefined,
			isReconciled: raw.isReconciled ?? false,
			reconciledAt: raw.reconciledAt ?? undefined,
			importBatch: raw.importedFrom ?? undefined,
			createdAt: raw.createdAt ?? new Date(),
			updatedAt: raw.reconciledAt ?? raw.createdAt ?? new Date(),
		});
	}
}
