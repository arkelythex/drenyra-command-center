import { Detraccion } from "@drenyra/domain/accounting/detraccion";
import { db } from "@drenyra/persistence/client";
import { detractions } from "@drenyra/persistence/schema";
import { and, between, eq, sql } from "drizzle-orm";
export class PostgresDetractionRepository {
	async save(detraction, companyId) {
		await db.insert(detractions).values({
			id: detraction.id,
			companyId,
			spotCode: detraction.spotCode,
			percentage: Math.round(detraction.percentage),
			amountCents: detraction.amount.getCents(),
			reference: detraction.reference,
			status: detraction.status,
		});
	}
	async findById(id) {
		const result = await db
			.select()
			.from(detractions)
			.where(eq(detractions.id, id))
			.limit(1);
		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}
	async findByReference(referenceType, referenceId) {
		const prefix = `${referenceType}:${referenceId}`;
		const result = await db
			.select()
			.from(detractions)
			.where(sql`${detractions.reference} LIKE ${`${prefix}%`}`)
			.orderBy(sql`${detractions.createdAt} DESC`);
		return result.map((row) => this.mapToDomain(row));
	}
	async findByCompanyAndPeriod(companyId, year, month) {
		const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
		const endDate = new Date(year, month, 0, 23, 59, 59, 999);
		const result = await db
			.select()
			.from(detractions)
			.where(
				and(
					eq(detractions.companyId, companyId),
					between(detractions.createdAt, startDate, endDate),
				),
			)
			.orderBy(sql`${detractions.createdAt} DESC`);
		return result.map((row) => this.mapToDomain(row));
	}
	async findByStatus(companyId, status) {
		const result = await db
			.select()
			.from(detractions)
			.where(
				and(
					eq(detractions.companyId, companyId),
					eq(detractions.status, status),
				),
			)
			.orderBy(sql`${detractions.createdAt} DESC`);
		return result.map((row) => this.mapToDomain(row));
	}
	async findPendingByCompany(companyId) {
		const result = await db
			.select()
			.from(detractions)
			.where(
				and(
					eq(detractions.companyId, companyId),
					eq(detractions.status, "pendiente"),
				),
			)
			.orderBy(sql`${detractions.createdAt} ASC`);
		return result.map((row) => this.mapToDomain(row));
	}
	async delete(id) {
		await db.delete(detractions).where(eq(detractions.id, id));
	}
	async count(companyId) {
		const result = await db
			.select({ count: sql`count(*)` })
			.from(detractions)
			.where(eq(detractions.companyId, companyId));
		return Number(result[0]?.count ?? 0);
	}
	mapToDomain(raw) {
		return Detraccion.fromJSON({
			id: raw.id,
			spotCode: raw.spotCode,
			percentage: raw.percentage,
			amount: {
				amount: raw.amountCents,
				currency: "PEN",
			},
			reference: raw.reference,
		});
	}
}
