/**
 * Postgres Provider Repository Implementation
 *
 * Concrete implementation of ProviderRepository using PostgreSQL with Drizzle ORM.
 *
 * Transitional note:
 * - Public contract still speaks in `organizationId: number`
 * - Persistence now uses the modular `business_partners + vendor_profiles`
 * - Bridge is resolved by matching legacy `organizations.ruc` to `companies.ruc`
 */

import { randomUUID } from "node:crypto";
import type {
	CreateProviderDTO,
	Provider,
	ProviderFilters,
	ProviderRepository,
	UpdateProviderDTO,
} from "@drenyra/domain/repositories/provider.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { and, eq, ilike, like, sql } from "drizzle-orm";
import { db } from "../client";
import { businessPartners, vendorProfiles } from "../schema";
import {
	resolveCompanyIdFromOrganization,
	resolveOrganizationIdFromCompany,
} from "./support/organization-resolver";

/**
 * PostgresProviderRepository class.
 *
 * @example
 * ```ts
 * const value = new PostgresProviderRepository();
 * console.log(value);
 * ```
 */
export class PostgresProviderRepository implements ProviderRepository {
	async save(data: CreateProviderDTO): Promise<Provider> {
		const now = new Date();
		const companyId = await resolveCompanyIdFromOrganization(
			data.organizationId,
		);
		const id = randomUUID();

		const created = await db.transaction(async (tx) => {
			const [partner] = await tx
				.insert(businessPartners)
				.values({
					id,
					companyId,
					taxId: data.ruc,
					legalName: data.name,
					email: data.email ?? null,
					createdAt: now,
				})
				.returning();

			const [profile] = await tx
				.insert(vendorProfiles)
				.values({
					id,
					paymentTermDays: data.paymentTerms || 30,
					updatedAt: now,
					createdAt: now,
				})
				.returning();

    			return { partner, profile };
    		});
    
    		if (created.partner === undefined || created.profile === undefined) {
    			throw new Error(
    				`Failed to create provider ${id}: missing partner/profile row`,
    			);
    		}
    
    		return this.mapToProvider(
    			created.partner,
    			created.profile,
    			data.organizationId,
    		);
	}

	async update(id: string, data: UpdateProviderDTO): Promise<Provider> {
		const existing = await this.findProviderContext(id);

		if (!existing) {
			throw new Error(`Provider with id ${id} not found`);
		}

		const now = new Date();

		const updated = await db.transaction(async (tx) => {
			const [partner] = await tx
				.update(businessPartners)
				.set({
					taxId: data.ruc ?? existing.partner.taxId,
					legalName: data.name ?? existing.partner.legalName,
					email: data.email ?? existing.partner.email ?? null,
				})
				.where(eq(businessPartners.id, id))
				.returning();

			const [profile] = await tx
				.update(vendorProfiles)
				.set({
					paymentTermDays:
						data.paymentTerms ?? existing.profile.paymentTermDays,
					updatedAt: now,
				})
				.where(eq(vendorProfiles.id, id))
				.returning();

    			return { partner, profile };
    		});
    
    		if (updated.partner === undefined || updated.profile === undefined) {
    			throw new Error(
    				`Failed to update provider ${id}: missing partner/profile row`,
    			);
    		}
    
    		return this.mapToProvider(
    			updated.partner,
    			updated.profile,
    			existing.organizationId,
    		);
	}

	async delete(id: string): Promise<void> {
		await db.delete(businessPartners).where(eq(businessPartners.id, id));
	}

	async findById(scope: TenantScope, id: string): Promise<Provider | null> {
		const rows = await db
			.select({ partner: businessPartners, profile: vendorProfiles })
			.from(vendorProfiles)
			.innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
			.where(
				and(
					eq(businessPartners.id, id),
					eq(businessPartners.companyId, scope.companyId),
				),
			)
			.limit(1);

		if (rows.length === 0) return null;
		const row = rows[0];
		if (row === undefined) return null;
    
		const organizationId = await resolveOrganizationIdFromCompany(
			row.partner.companyId,
		);
    
		return this.mapToProvider(row.partner, row.profile, organizationId);
	}

	async findAll(
		organizationId: number,
		filters?: ProviderFilters,
	): Promise<Provider[]> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const conditions = [eq(businessPartners.companyId, companyId)];

		if (filters?.name) {
			conditions.push(ilike(businessPartners.legalName, `%${filters.name}%`));
		}
		if (filters?.ruc) {
			conditions.push(like(businessPartners.taxId, `%${filters.ruc}%`));
		}
		if (filters?.email) {
			conditions.push(ilike(businessPartners.email, `%${filters.email}%`));
		}

		const rows = await db
			.select({ partner: businessPartners, profile: vendorProfiles })
			.from(vendorProfiles)
			.innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
			.where(and(...conditions))
			.orderBy(businessPartners.legalName);

		return rows.map((row) =>
			this.mapToProvider(row.partner, row.profile, organizationId),
		);
	}

	async count(
		organizationId: number,
		filters?: ProviderFilters,
	): Promise<number> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const conditions = [eq(businessPartners.companyId, companyId)];

		if (filters?.name) {
			conditions.push(ilike(businessPartners.legalName, `%${filters.name}%`));
		}
		if (filters?.ruc) {
			conditions.push(like(businessPartners.taxId, `%${filters.ruc}%`));
		}
		if (filters?.email) {
			conditions.push(ilike(businessPartners.email, `%${filters.email}%`));
		}

		const [result] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(vendorProfiles)
			.innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
			.where(and(...conditions));

		return result?.count ?? 0;
	}

	async findByRUC(
		organizationId: number,
		ruc: string,
	): Promise<Provider | null> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);

		const rows = await db
			.select({ partner: businessPartners, profile: vendorProfiles })
			.from(vendorProfiles)
			.innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
			.where(
				and(
					eq(businessPartners.companyId, companyId),
					eq(businessPartners.taxId, ruc),
				),
			)
			.limit(1);

		if (rows.length === 0) return null;
		const row = rows[0];
		if (row === undefined) return null;
    
		return this.mapToProvider(row.partner, row.profile, organizationId);
	}

	private async findProviderContext(id: string) {
		const rows = await db
			.select({ partner: businessPartners, profile: vendorProfiles })
			.from(vendorProfiles)
			.innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
			.where(eq(businessPartners.id, id))
			.limit(1);

		if (rows.length === 0) return null;
		const row = rows[0];
		if (row === undefined) return null;
    
		const organizationId = await resolveOrganizationIdFromCompany(
			row.partner.companyId,
		);
    
		return {
			partner: row.partner,
			profile: row.profile,
			organizationId,
		};
	}
	private mapToProvider(
		partner: typeof businessPartners.$inferSelect,
		profile: typeof vendorProfiles.$inferSelect,
		organizationId: number,
	): Provider {
		return {
			id: partner.id,
			organizationId,
			name: partner.legalName,
			ruc: partner.taxId,
			...(partner.email !== null ? { email: partner.email } : {}),
			paymentTerms: profile.paymentTermDays ?? 30,
			createdAt: partner.createdAt,
			updatedAt: profile.updatedAt,
		};
	}
}
