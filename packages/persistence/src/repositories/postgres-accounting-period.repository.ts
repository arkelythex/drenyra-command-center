/**
 * PostgreSQL Implementation of AccountingPeriodRepository
 *
 * Infrastructure layer — implements domain repository interface.
 */

import { randomUUID } from "node:crypto";
import { AccountingPeriod } from "@drenyra/domain/accounting/accounting-period";
import type { AccountingPeriodRepository } from "@drenyra/domain/repositories/accounting-period.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { db } from "@drenyra/persistence/client";
import { accountingPeriods } from "@drenyra/persistence/schema";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

export class PostgresAccountingPeriodRepository
	implements AccountingPeriodRepository
{
	async save(period: AccountingPeriod, companyId: string): Promise<void> {
		const id = randomUUID();

		await db.insert(accountingPeriods).values({
			id,
			companyId,
			year: period.year,
			month: period.month,
			status: period.status,
		});
	}

	async findById(
		scope: TenantScope,
		id: string,
	): Promise<AccountingPeriod | null> {
		const result = await db
			.select()
			.from(accountingPeriods)
			.where(
				and(
					eq(accountingPeriods.id, id),
					eq(accountingPeriods.companyId, scope.companyId),
				),
			)
			.limit(1);

		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}

	async findByCompanyAndPeriod(
		companyId: string,
		year: number,
		month: number,
	): Promise<AccountingPeriod | null> {
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

	async findAllByCompany(companyId: string): Promise<AccountingPeriod[]> {
		const result = await db
			.select()
			.from(accountingPeriods)
			.where(eq(accountingPeriods.companyId, companyId))
			.orderBy(desc(accountingPeriods.year), desc(accountingPeriods.month));

		return result.map((row) => this.mapToDomain(row));
	}

	async findByYear(
		companyId: string,
		year: number,
	): Promise<AccountingPeriod[]> {
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

	async getCurrentPeriod(companyId: string): Promise<AccountingPeriod | null> {
		// Find the most recent period that is NOT in a fully closed/audited state
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

	async delete(id: string): Promise<void> {
		await db.delete(accountingPeriods).where(eq(accountingPeriods.id, id));
	}

	async count(companyId: string): Promise<number> {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(accountingPeriods)
			.where(eq(accountingPeriods.companyId, companyId));

		return Number(result[0]?.count ?? 0);
	}

	private mapToDomain(
		raw: typeof accountingPeriods.$inferSelect,
	): AccountingPeriod {
		return AccountingPeriod.fromJSON({
			year: raw.year,
			month: raw.month,
			status: raw.status,
		});
	}
}
