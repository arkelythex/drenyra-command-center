import { Transaction } from "@drenyra/domain/entities/Transaction";
import { Money } from "@drenyra/domain/value-objects/Money";
import { and, count, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { db } from "../client";
import { transactions } from "../schema";
import { resolveCompanyIdFromOrganization } from "./support/organization-resolver";
import { toStableUuid } from "./support/stable-uuid";

const mapDbStatusToDomain = (dbStatus) => {
	switch (dbStatus) {
		case "ACCEPTED":
			return "POSTED";
		case "ANNULLED":
			return "VOIDED";
		default:
			return "DRAFT";
	}
};
const mapDomainStatusToDb = (domainStatus) => {
	switch (domainStatus) {
		case "POSTED":
			return "ACCEPTED";
		case "VOIDED":
			return "ANNULLED";
		default:
			return "DRAFT";
	}
};
const mapDomainTypeToDb = (domainType) => {
	switch (domainType) {
		case "PURCHASE":
		case "PAYMENT":
			return "EXPENSE";
		default:
			return "INCOME";
	}
};
const mapDomainTypeToDocumentType = (domainType) => {
	switch (domainType) {
		case "PAYMENT":
		case "RECEIPT":
		case "TRANSFER":
			return "MOVIMIENTO_BANCARIO";
		case "ADJUSTMENT":
			return "NOTA_CREDITO";
		default:
			return "FACTURA";
	}
};
const mapDbToDomainType = (dbType, dbDocumentType) => {
	if (dbDocumentType === "NOTA_CREDITO" || dbDocumentType === "NOTA_DEBITO") {
		return "ADJUSTMENT";
	}
	if (dbDocumentType === "MOVIMIENTO_BANCARIO") {
		return dbType === "INCOME" ? "RECEIPT" : "PAYMENT";
	}
	return dbType === "INCOME" ? "SALE" : "PURCHASE";
};
const formatCents = (cents) => (cents / 100).toFixed(2);
const resolveReferenceParts = (referenceNumber, type) => {
	const [seriesPart, numberPart] = referenceNumber?.split("-") ?? [];
	const year = new Date().getFullYear();
	const fallbackSeries = type === "ADJUSTMENT" ? `ADJ${year}` : `TRX${year}`;
	return {
		series: seriesPart || fallbackSeries,
		number: numberPart || "00000001",
	};
};
const buildSyntheticEntries = (raw, totalAmount) => {
	const description = raw.notes ?? "Movimiento fiscal";
	return [
		{
			id: `${raw.id}-debit`,
			accountCode: "1041",
			accountName: "Caja",
			debit: totalAmount,
			credit: Money.zero(totalAmount.getCurrency()),
			description,
		},
		{
			id: `${raw.id}-credit`,
			accountCode: raw.type === "INCOME" ? "7011" : "4212",
			accountName: raw.type === "INCOME" ? "Ventas" : "Proveedores",
			debit: Money.zero(totalAmount.getCurrency()),
			credit: totalAmount,
			description,
		},
	];
};
export class PostgresTransactionRepository {
	async save(transaction, organizationId) {
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
			subtotal: formatCents(subtotalCents),
			igvAmount: formatCents(igvCents),
			totalAmount: formatCents(totalCents),
			status: mapDomainStatusToDb(transaction.status),
			notes: transaction.description,
			createdAt: transaction.createdAt,
			updatedAt: transaction.updatedAt,
		});
	}
	async update(transaction, organizationId) {
		const existing = await this.findById(transaction.id, organizationId);
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
				subtotal: formatCents(subtotalCents),
				igvAmount: formatCents(igvCents),
				totalAmount: formatCents(totalCents),
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
	async delete(id, organizationId) {
		const existing = await this.findById(id, organizationId);
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
	async findById(id, organizationId) {
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
	async findByReferenceNumber(referenceNumber, organizationId) {
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
	async findAll(organizationId, filters, pagination) {
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
	async findByAccount(_accountCode, _organizationId, _dateFrom, _dateTo) {
		console.warn(
			"findByAccount: Journal entries integration required for full implementation",
		);
		return [];
	}
	async count(organizationId, filters) {
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
	async getNextReferenceNumber(organizationId, type) {
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
	buildFilterConditions(companyId, filters) {
		const conditions = [eq(transactions.companyId, companyId)];
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
					),
				);
			} else {
				conditions.push(
					or(
						like(transactions.series, `%${filters.referenceNumber}%`),
						like(transactions.number, `%${filters.referenceNumber}%`),
					),
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
	mapToDomain(raw) {
		const currency = raw.currency;
		const totalAmount = Money.fromAmount(Number(raw.totalAmount), currency);
		const referenceNumber =
			raw.series && raw.number ? `${raw.series}-${raw.number}` : undefined;
		return Transaction.create({
			id: raw.id,
			type: mapDbToDomainType(raw.type, raw.documentType),
			date: raw.issueDate,
			description: raw.notes || referenceNumber || "Movimiento fiscal",
			referenceNumber,
			entries: buildSyntheticEntries(raw, totalAmount),
			status: mapDbStatusToDomain(raw.status),
			postedAt: raw.status === "ACCEPTED" ? raw.updatedAt : undefined,
			createdAt: raw.createdAt,
			updatedAt: raw.updatedAt,
		});
	}
}
//# sourceMappingURL=postgres-transaction.repository.js.map
