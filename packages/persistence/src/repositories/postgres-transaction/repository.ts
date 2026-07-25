import { Transaction } from "@drenyra/domain/entities/Transaction";
import type {
	PaginatedResult,
	PaginationOptions,
	TransactionFilters,
	TransactionRepository,
} from "@drenyra/domain/repositories/transaction.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { Money } from "@drenyra/domain/value-objects/Money";
import {
	and,
	count,
	desc,
	eq,
	gte,
	like,
	lte,
	or,
	type SQL,
} from "drizzle-orm";
import { db } from "../../client";
import { transactions } from "../../schema";
import { resolveCompanyIdFromOrganization } from "../support/organization-resolver";
import { toStableUuid } from "../support/stable-uuid";
import {
	buildSyntheticEntries,
	mapDbStatusToDomain,
	mapDbToDomainType,
	mapDomainStatusToDb,
	mapDomainTypeToDb,
	mapDomainTypeToDocumentType,
	resolveReferenceParts,
} from "./mappers";

/**
 * PostgresTransactionRepository class.
 *
 * @example
 * ```ts
 * const value = new PostgresTransactionRepository();
 * console.log(value);
 * ```
 */
export class PostgresTransactionRepository implements TransactionRepository {
	async save(transaction: Transaction, organizationId: number): Promise<void> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const id = toStableUuid(transaction.id);
		const totalAmount = transaction.getTotalAmount();
		const totalCents = totalAmount.getCents();
		const subtotalCents = Math.round(totalCents / 1.18);
		const igvCents = totalCents - subtotalCents;
		const reference = resolveReferenceParts(
			transaction.referenceNumber,
			transaction.type,
		);

		await db.insert(transactions).values({
			id,
			companyId,
			type: mapDomainTypeToDb(transaction.type),
			documentType: mapDomainTypeToDocumentType(transaction.type),
			series: reference.series,
			number: reference.number,
			issueDate: transaction.date,
			currency: totalAmount.getCurrency(),
			subtotal: (subtotalCents / 100).toFixed(2),
			igvAmount: (igvCents / 100).toFixed(2),
			totalAmount: (totalCents / 100).toFixed(2),
			status: mapDomainStatusToDb(transaction.status),
			notes: transaction.description,
			createdAt: transaction.createdAt,
			updatedAt: transaction.updatedAt,
		});
	}

	async update(
		transaction: Transaction,
		organizationId: number,
	): Promise<void> {
		const existing = await this._findByIdLegacy(transaction.id, organizationId);

		if (!existing) {
			throw new Error(`Transacción ${transaction.id} no encontrada`);
		}

		if (!existing.canBeModified()) {
			throw new Error("No se puede modificar una transacción contabilizada");
		}

		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const persistedId = toStableUuid(transaction.id);
		const totalAmount = transaction.getTotalAmount();
		const totalCents = totalAmount.getCents();
		const subtotalCents = Math.round(totalCents / 1.18);
		const igvCents = totalCents - subtotalCents;
		const reference = resolveReferenceParts(
			transaction.referenceNumber,
			transaction.type,
		);

		await db
			.update(transactions)
			.set({
				type: mapDomainTypeToDb(transaction.type),
				documentType: mapDomainTypeToDocumentType(transaction.type),
				series: reference.series,
				number: reference.number,
				issueDate: transaction.date,
				currency: totalAmount.getCurrency(),
				subtotal: (subtotalCents / 100).toFixed(2),
				igvAmount: (igvCents / 100).toFixed(2),
				totalAmount: (totalCents / 100).toFixed(2),
				status: mapDomainStatusToDb(transaction.status),
				notes: transaction.description,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(transactions.id, persistedId),
					eq(transactions.companyId, companyId),
				),
			);
	}

	async delete(id: string, organizationId: number): Promise<void> {
		const existing = await this._findByIdLegacy(id, organizationId);

		if (!existing) {
			throw new Error(`Transacción ${id} no encontrada`);
		}

		if (!existing.canBeModified()) {
			throw new Error("No se puede eliminar una transacción contabilizada");
		}

		const companyId = await resolveCompanyIdFromOrganization(organizationId);

		await db
			.delete(transactions)
			.where(
				and(
					eq(transactions.id, toStableUuid(id)),
					eq(transactions.companyId, companyId),
				),
			);
	}

	async findById(scope: TenantScope, id: string): Promise<Transaction | null> {
		// Resolve companyId from scope or fallback to organizationId resolution
		let companyId = scope.companyId;
		if (!companyId) {
			companyId = await resolveCompanyIdFromOrganization(
				Number.parseInt(scope.organizationId, 10),
			);
		}

		const rows = await db
			.select()
			.from(transactions)
			.where(
				and(
					eq(transactions.id, toStableUuid(id)),
					eq(transactions.companyId, companyId),
				),
			)
			.limit(1);

		if (rows.length === 0) return null;

		return this.mapToDomain(rows[0]);
	}

	async _findByIdLegacy(
		id: string,
		organizationId: number,
	): Promise<Transaction | null> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const rows = await db
			.select()
			.from(transactions)
			.where(
				and(
					eq(transactions.id, toStableUuid(id)),
					eq(transactions.companyId, companyId),
				),
			)
			.limit(1);

		if (rows.length === 0) return null;

		return this.mapToDomain(rows[0]);
	}

	async findByReferenceNumber(
		referenceNumber: string,
		organizationId: number,
	): Promise<Transaction | null> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const [series, number] = referenceNumber.split("-");

		if (!series || !number) {
			return null;
		}

		const rows = await db
			.select()
			.from(transactions)
			.where(
				and(
					eq(transactions.companyId, companyId),
					eq(transactions.series, series),
					eq(transactions.number, number),
				),
			)
			.limit(1);

		if (rows.length === 0) return null;

		return this.mapToDomain(rows[0]);
	}

	async findAll(
		organizationId: number,
		filters?: TransactionFilters,
		pagination?: PaginationOptions,
	): Promise<PaginatedResult<Transaction>> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const page = pagination?.page || 1;
		const limit = pagination?.limit || 20;
		const offset = (page - 1) * limit;
		const whereCondition = and(
			...this.buildFilterConditions(companyId, filters),
		);

		const rows = await db
			.select()
			.from(transactions)
			.where(whereCondition)
			.orderBy(desc(transactions.createdAt))
			.limit(limit)
			.offset(offset);

		const totalResult = await db
			.select({ count: count() })
			.from(transactions)
			.where(whereCondition);

		const total = totalResult[0]?.count || 0;

		return {
			data: rows.map((row) => this.mapToDomain(row)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findByAccount(
		_accountCode: string,
		_organizationId: number,
		_dateFrom?: Date,
		_dateTo?: Date,
	): Promise<Transaction[]> {
		console.warn(
			"findByAccount: Journal entries integration required for full implementation",
		);
		return [];
	}

	async count(
		organizationId: number,
		filters?: TransactionFilters,
	): Promise<number> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const whereCondition = and(
			...this.buildFilterConditions(companyId, filters),
		);
		const result = await db
			.select({ count: count() })
			.from(transactions)
			.where(whereCondition);

		return result[0]?.count || 0;
	}

	async getNextReferenceNumber(
		organizationId: number,
		type: string,
	): Promise<string> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const year = new Date().getFullYear();
		const prefix = type === "ADJUSTMENT" ? "ADJ" : "TRX";

		const rows = await db
			.select({ series: transactions.series, number: transactions.number })
			.from(transactions)
			.where(
				and(
					eq(transactions.companyId, companyId),
					like(transactions.series, `${prefix}%`),
				),
			)
			.orderBy(desc(transactions.number))
			.limit(1);

		const lastNumber = Number.parseInt(rows[0]?.number ?? "0", 10);
		const nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1;

		return `${prefix}${year}-${nextNumber.toString().padStart(8, "0")}`;
	}

	private buildFilterConditions(
		companyId: string,
		filters?: TransactionFilters,
	): SQL<unknown>[] {
		const conditions: SQL<unknown>[] = [eq(transactions.companyId, companyId)];

		if (filters?.status) {
			conditions.push(
				eq(transactions.status, mapDomainStatusToDb(filters.status)),
			);
		}

		if (filters?.type) {
			conditions.push(eq(transactions.type, mapDomainTypeToDb(filters.type)));
		}

		if (filters?.dateFrom) {
			conditions.push(gte(transactions.issueDate, filters.dateFrom));
		}

		if (filters?.dateTo) {
			conditions.push(lte(transactions.issueDate, filters.dateTo));
		}

		if (filters?.referenceNumber) {
			const [seriesSearch, numberSearch] = filters.referenceNumber.split("-");

			if (seriesSearch && numberSearch) {
				conditions.push(
					and(
						like(transactions.series, `%${seriesSearch}%`),
						like(transactions.number, `%${numberSearch}%`),
					) as SQL<unknown>,
				);
			} else {
				conditions.push(
					or(
						like(transactions.series, `%${filters.referenceNumber}%`),
						like(transactions.number, `%${filters.referenceNumber}%`),
					) as SQL<unknown>,
				);
			}
		}

		if (filters?.minAmount !== undefined) {
			conditions.push(
				gte(transactions.totalAmount, filters.minAmount.toFixed(2)),
			);
		}

		if (filters?.maxAmount !== undefined) {
			conditions.push(
				lte(transactions.totalAmount, filters.maxAmount.toFixed(2)),
			);
		}

		return conditions;
	}

	private mapToDomain(raw: typeof transactions.$inferSelect): Transaction {
		const currency = raw.currency;
		const totalAmount = Money.fromAmount(Number(raw.totalAmount), currency);
		const referenceNumber =
			raw.series && raw.number ? `${raw.series}-${raw.number}` : undefined;

		return Transaction.create({
			id: raw.id,
			type: mapDbToDomainType(
				raw.type as import("./types").DbTransactionType,
				raw.documentType as import("./types").DbDocumentType,
			),
			date: raw.issueDate,
			description: raw.notes || referenceNumber || "Movimiento fiscal",
			referenceNumber,
			entries: buildSyntheticEntries(raw, totalAmount),
			status: mapDbStatusToDomain(
				raw.status as import("./types").DbTransactionStatus | null,
			),
			postedAt: raw.status === "ACCEPTED" ? raw.updatedAt : undefined,
			createdAt: raw.createdAt,
			updatedAt: raw.updatedAt,
		});
	}
}
