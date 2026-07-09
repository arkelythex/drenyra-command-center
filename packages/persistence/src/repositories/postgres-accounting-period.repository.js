import { AccountingPeriod } from "@drenyra/domain/accounting/accounting-period";
import { db } from "@drenyra/persistence/client";
import { accountingPeriods } from "@drenyra/persistence/schema";
import { randomUUID } from "crypto";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
export class PostgresAccountingPeriodRepository {
	async save(period, companyId) {
		const id = randomUUID();
		await db.insert(accountingPeriods).values({
			id,
			companyId,
			year: period.year,
			month: period.month,
			status: period.status,
		});
	}
	async findById(id) {
		const result = await db
			.select()
			.from(accountingPeriods)
			.where(eq(accountingPeriods.id, id))
			.limit(1);
		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}
	async findByCompanyAndPeriod(companyId, year, month) {
		const result = await db
			.select()
			.from(accountingPeriods)
			.where(
				and(
					eq(accountingPeriods.companyId, companyId),
					eq(accountingPeriods.year, year),
					eq(accountingPeriods.month, month),
				),
			)
			.limit(1);
		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}
	async findAllByCompany(companyId) {
		const result = await db
			.select()
			.from(accountingPeriods)
			.where(eq(accountingPeriods.companyId, companyId))
			.orderBy(desc(accountingPeriods.year), desc(accountingPeriods.month));
		return result.map((row) => this.mapToDomain(row));
	}
	async findByYear(companyId, year) {
		const result = await db
			.select()
			.from(accountingPeriods)
			.where(
				and(
					eq(accountingPeriods.companyId, companyId),
					eq(accountingPeriods.year, year),
				),
			)
			.orderBy(asc(accountingPeriods.month));
		return result.map((row) => this.mapToDomain(row));
	}
	async getCurrentPeriod(companyId) {
		const result = await db
			.select()
			.from(accountingPeriods)
			.where(
				and(
					eq(accountingPeriods.companyId, companyId),
					ne(accountingPeriods.status, "cerrado_final"),
					ne(accountingPeriods.status, "auditado"),
				),
			)
			.orderBy(desc(accountingPeriods.year), desc(accountingPeriods.month))
			.limit(1);
		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}
	async delete(id) {
		await db.delete(accountingPeriods).where(eq(accountingPeriods.id, id));
	}
	async count(companyId) {
		const result = await db
			.select({ count: sql`count(*)` })
			.from(accountingPeriods)
			.where(eq(accountingPeriods.companyId, companyId));
		return Number(result[0]?.count ?? 0);
	}
	mapToDomain(raw) {
		return AccountingPeriod.fromJSON({
			year: raw.year,
			month: raw.month,
			status: raw.status,
		});
	}
}

