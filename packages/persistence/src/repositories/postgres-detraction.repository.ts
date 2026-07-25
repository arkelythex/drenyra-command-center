/**
 * PostgreSQL Implementation of DetractionRepository
 *
 * Infrastructure layer — implements domain repository interface.
 */

import {
	Detraccion,
	type DetraccionStatus,
} from "@drenyra/domain/accounting/detraccion";
import type { DetractionRepository } from "@drenyra/domain/repositories/detraction.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { db } from "@drenyra/persistence/client";
import { detractions } from "@drenyra/persistence/schema";
import { and, between, eq, sql } from "drizzle-orm";

export class PostgresDetractionRepository implements DetractionRepository {
	async save(detraction: Detraccion, companyId: string): Promise<void> {
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

	async findById(scope: TenantScope, id: string): Promise<Detraccion | null> {
		const result = await db
			.select()
			.from(detractions)
			.where(
				and(eq(detractions.id, id), eq(detractions.companyId, scope.companyId)),
			)
			.limit(1);

		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}

	async findByReference(
		referenceType: string,
		referenceId: string,
	): Promise<Detraccion[]> {
		// referenceType is used as a prefix convention on the reference field
		// e.g., "invoice:550e8400-..."
		const prefix = `${referenceType}:${referenceId}`;

		const result = await db
			.select()
			.from(detractions)
			.where(sql`${detractions.reference} LIKE ${`${prefix}%`}`)
			.orderBy(sql`${detractions.createdAt} DESC`);

		return result.map((row) => this.mapToDomain(row));
	}

	async findByCompanyAndPeriod(
		companyId: string,
		year: number,
		month: number,
	): Promise<Detraccion[]> {
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

	async findByStatus(
		companyId: string,
		status: DetraccionStatus,
	): Promise<Detraccion[]> {
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

	async findPendingByCompany(companyId: string): Promise<Detraccion[]> {
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

	async delete(id: string): Promise<void> {
		await db.delete(detractions).where(eq(detractions.id, id));
	}

	async count(companyId: string): Promise<number> {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(detractions)
			.where(eq(detractions.companyId, companyId));

		return Number(result[0]?.count ?? 0);
	}

	private mapToDomain(raw: typeof detractions.$inferSelect): Detraccion {
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
