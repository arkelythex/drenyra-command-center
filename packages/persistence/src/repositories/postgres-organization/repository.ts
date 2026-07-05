import type { FirmMetrics } from "@drenyra/domain/entities/organization";
import {
	Organization,
	type OrganizationProps,
} from "@drenyra/domain/entities/organization";
import type {
	OrganizationFilters,
	OrganizationRepository,
} from "@drenyra/domain/repositories/organization.repository";
import { and, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { db } from "../../client";
import { organizationMetrics, organizations } from "../../schema";

export class PostgresOrganizationRepository implements OrganizationRepository {
	async findById(id: string): Promise<Organization | null> {
		const numericId = Number(id);
		if (Number.isNaN(numericId)) return null;

		const row = await db
			.select()
			.from(organizations)
			.where(eq(organizations.id, numericId))
			.limit(1);

		return row[0] ? this.mapRowToEntity(row[0]) : null;
	}

	async findAll(filters?: OrganizationFilters): Promise<Organization[]> {
		const conditions = this.buildFilterConditions(filters);
		const limit = filters?.limit ?? 50;
		const offset = filters?.offset ?? 0;

		const rows = await db
			.select()
			.from(organizations)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.limit(limit)
			.offset(offset)
			.orderBy(organizations.name);

		return rows.map((row) => this.mapRowToEntity(row));
	}

	async count(filters?: OrganizationFilters): Promise<number> {
		const conditions = this.buildFilterConditions(filters);

		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(organizations)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		return Number(result[0].count);
	}

	async save(entity: Organization): Promise<Organization> {
		await db.insert(organizations).values(this.mapEntityToRow(entity));
		return entity;
	}

	async update(entity: Organization): Promise<Organization> {
		await db
			.update(organizations)
			.set(this.mapEntityToRow(entity))
			.where(eq(organizations.id, Number(entity.id)));

		return entity;
	}

	async delete(id: string): Promise<void> {
		const numericId = Number(id);
		if (Number.isNaN(numericId)) return;

		await db.delete(organizations).where(eq(organizations.id, numericId));
	}

	async saveForOrganization(
		entity: Organization,
		_organizationId: string,
	): Promise<Organization> {
		return this.save(entity);
	}

	async findForOrganization(
		organizationId: string,
		filters?: OrganizationFilters,
	): Promise<Organization[]> {
		const numericId = Number(organizationId);
		if (Number.isNaN(numericId)) return [];

		const conditions = [
			eq(organizations.id, numericId),
			...this.buildFilterConditions(filters),
		];
		const limit = filters?.limit ?? 50;
		const offset = filters?.offset ?? 0;

		const rows = await db
			.select()
			.from(organizations)
			.where(and(...conditions))
			.limit(limit)
			.offset(offset);

		return rows.map((row) => this.mapRowToEntity(row));
	}

	async countForOrganization(
		organizationId: string,
		filters?: OrganizationFilters,
	): Promise<number> {
		const numericId = Number(organizationId);
		if (Number.isNaN(numericId)) return 0;

		const conditions = [
			eq(organizations.id, numericId),
			...this.buildFilterConditions(filters),
		];

		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(organizations)
			.where(and(...conditions));

		return Number(result[0].count);
	}

	async deleteForOrganization(
		id: string,
		organizationId: string,
	): Promise<void> {
		const numericId = Number(id);
		const numericOrgId = Number(organizationId);
		if (Number.isNaN(numericId) || Number.isNaN(numericOrgId)) return;

		await db
			.delete(organizations)
			.where(
				and(
					eq(organizations.id, numericId),
					eq(organizations.id, numericOrgId),
				),
			);
	}

	async findByRuc(ruc: string): Promise<Organization | null> {
		const row = await db
			.select()
			.from(organizations)
			.where(eq(organizations.ruc, ruc))
			.limit(1);

		return row[0] ? this.mapRowToEntity(row[0]) : null;
	}

	async findBySlug(slug: string): Promise<Organization | null> {
		const row = await db
			.select()
			.from(organizations)
			.where(eq(organizations.slug, slug))
			.limit(1);

		return row[0] ? this.mapRowToEntity(row[0]) : null;
	}

	async findActive(): Promise<Organization[]> {
		const rows = await db
			.select()
			.from(organizations)
			.where(eq(organizations.status, "ACTIVE"))
			.orderBy(organizations.name);

		return rows.map((row) => this.mapRowToEntity(row));
	}

	async getFirmMetrics(organizationId: string): Promise<FirmMetrics> {
		const numericId = Number(organizationId);

		const latestMetrics = await db
			.select()
			.from(organizationMetrics)
			.where(eq(organizationMetrics.organizationId, numericId))
			.orderBy(organizationMetrics.periodStart)
			.limit(1);

		if (latestMetrics.length > 0) {
			const m = latestMetrics[0];
			return {
				totalCompanies: m.totalCompanies,
				activeCompanies: m.activeCompanies,
				pendingReconciliations: m.pendingReconciliations,
				overdueDocuments: m.overdueDocuments,
				healthPercentage: m.healthPercentage,
			};
		}

		return {
			totalCompanies: 0,
			activeCompanies: 0,
			pendingReconciliations: 0,
			overdueDocuments: 0,
			healthPercentage: 0,
		};
	}

	private buildFilterConditions(filters?: OrganizationFilters): SQL<unknown>[] {
		const conditions: SQL<unknown>[] = [];

		if (!filters) return conditions;

		if (filters.status) {
			conditions.push(eq(organizations.status, filters.status));
		}

		if (filters.search) {
			conditions.push(
				or(
					ilike(organizations.name, `%${filters.search}%`),
					ilike(organizations.ruc, `%${filters.search}%`),
					ilike(organizations.slug, `%${filters.search}%`),
				) as SQL<unknown>,
			);
		}

		return conditions;
	}

	private mapRowToEntity(row: typeof organizations.$inferSelect): Organization {
		return Organization.fromPrimitives({
			id: String(row.id),
			name: row.name,
			ruc: row.ruc,
			slug: row.slug,
			settings: row.settings ?? undefined,
			status: row.status,
			healthScore: row.healthScore ?? undefined,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		});
	}

	private mapEntityToRow(
		entity: Organization,
	): typeof organizations.$inferInsert {
		const json = entity.toJSON();
		return {
			id: Number(json.id),
			name: json.name as string,
			ruc: json.ruc as string,
			slug: json.slug as string,
			status: json.status as "ACTIVE" | "SUSPENDED" | "INACTIVE",
			healthScore: (json.healthScore as number) ?? 0,
			settings: (json.settings ?? {}) as Record<string, unknown>,
			businessName: json.name as string,
			isActive: json.status === "ACTIVE",
			createdAt: new Date(json.createdAt as string),
			updatedAt: new Date(json.updatedAt as string),
		};
	}
}
