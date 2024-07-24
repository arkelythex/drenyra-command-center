/**
 * Postgres Client Repository Implementation
 *
 * Concrete implementation of ClientRepository using PostgreSQL with Drizzle ORM.
 *
 * Transitional note:
 * - Public contract still speaks in `organizationId: number`
 * - Persistence now uses the modular `business_partners + customer_profiles`
 * - Bridge is resolved by matching legacy `organizations.ruc` to `companies.ruc`
 */

import type {
	Client,
	ClientFilters,
	ClientRepository,
	CreateClientDTO,
	UpdateClientDTO,
} from "@drenyra/domain/repositories/client.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { randomUUID } from "crypto";
import { and, eq, ilike, like, sql } from "drizzle-orm";
import { db } from "../client";
import { businessPartners, customerProfiles } from "../schema";
import {
	resolveCompanyIdFromOrganization,
	resolveOrganizationIdFromCompany,
} from "./support/organization-resolver";

/**
 * PostgresClientRepository class.
 *
 * @example
 * ```ts
 * const value = new PostgresClientRepository();
 * console.log(value);
 * ```
 */
export class PostgresClientRepository implements ClientRepository {
	async save(data: CreateClientDTO): Promise<Client> {
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
					taxId: data.documentNumber,
					partnerDocumentType: data.documentType,
					legalName: data.name,
					email: data.email ?? null,
					phone: data.phone ?? null,
					address: data.address ?? null,
					createdAt: now,
				})
				.returning();

			const [profile] = await tx
				.insert(customerProfiles)
				.values({
					id,
					creditLimit: data.creditLimit ?? "0",
					creditDays: data.creditDays ?? 30,
					updatedAt: now,
					createdAt: now,
				})
				.returning();

			return { partner, profile };
		});

		return this.mapToClient(
			created.partner,
			created.profile,
			data.organizationId,
		);
	}

	async update(id: string, data: UpdateClientDTO): Promise<Client> {
		const existing = await this.findClientContext(id);

		if (!existing) {
			throw new Error(`Client with id ${id} not found`);
		}

		const now = new Date();

		const updated = await db.transaction(async (tx) => {
			const [partner] = await tx
				.update(businessPartners)
				.set({
					taxId: data.documentNumber ?? existing.partner.taxId,
					partnerDocumentType:
						data.documentType ?? existing.partner.partnerDocumentType,
					legalName: data.name ?? existing.partner.legalName,
					email: data.email ?? existing.partner.email ?? null,
					phone: data.phone ?? existing.partner.phone ?? null,
					address: data.address ?? existing.partner.address ?? null,
				})
				.where(eq(businessPartners.id, id))
				.returning();

			const [profile] = await tx
				.update(customerProfiles)
				.set({
					creditLimit: data.creditLimit ?? existing.profile.creditLimit,
					creditDays: data.creditDays ?? existing.profile.creditDays,
					updatedAt: now,
				})
				.where(eq(customerProfiles.id, id))
				.returning();

			return { partner, profile };
		});

		return this.mapToClient(
			updated.partner,
			updated.profile,
			existing.organizationId,
		);
	}

	async delete(id: string): Promise<void> {
		await db.delete(businessPartners).where(eq(businessPartners.id, id));
	}

	async findById(
		scope: TenantScope,
		id: string,
	): Promise<Client | null> {
		const rows = await db
			.select({ partner: businessPartners, profile: customerProfiles })
			.from(customerProfiles)
			.innerJoin(businessPartners, eq(customerProfiles.id, businessPartners.id))
			.where(
				and(
					eq(businessPartners.id, id),
					eq(businessPartners.companyId, scope.companyId),
				),
			)
			.limit(1);

		if (rows.length === 0) return null;

		const organizationId = await resolveOrganizationIdFromCompany(
			rows[0].partner.companyId,
		);

		return this.mapToClient(
			rows[0].partner,
			rows[0].profile,
			organizationId,
		);
	}



	async findAll(
		organizationId: number,
		filters?: ClientFilters,
	): Promise<Client[]> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const conditions = [eq(businessPartners.companyId, companyId)];

		if (filters?.name) {
			conditions.push(ilike(businessPartners.legalName, `%${filters.name}%`));
		}
		if (filters?.documentType) {
			conditions.push(
				eq(businessPartners.partnerDocumentType, filters.documentType),
			);
		}
		if (filters?.documentNumber) {
			conditions.push(
				like(businessPartners.taxId, `%${filters.documentNumber}%`),
			);
		}
		if (filters?.email) {
			conditions.push(ilike(businessPartners.email, `%${filters.email}%`));
		}

		const rows = await db
			.select({ partner: businessPartners, profile: customerProfiles })
			.from(customerProfiles)
			.innerJoin(businessPartners, eq(customerProfiles.id, businessPartners.id))
			.where(and(...conditions))
			.orderBy(businessPartners.legalName);

		return rows.map((row) =>
			this.mapToClient(row.partner, row.profile, organizationId),
		);
	}

	async count(
		organizationId: number,
		filters?: ClientFilters,
	): Promise<number> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const conditions = [eq(businessPartners.companyId, companyId)];

		if (filters?.name) {
			conditions.push(ilike(businessPartners.legalName, `%${filters.name}%`));
		}
		if (filters?.documentType) {
			conditions.push(
				eq(businessPartners.partnerDocumentType, filters.documentType),
			);
		}
		if (filters?.documentNumber) {
			conditions.push(
				like(businessPartners.taxId, `%${filters.documentNumber}%`),
			);
		}
		if (filters?.email) {
			conditions.push(ilike(businessPartners.email, `%${filters.email}%`));
		}

		const [result] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(customerProfiles)
			.innerJoin(businessPartners, eq(customerProfiles.id, businessPartners.id))
			.where(and(...conditions));

		return result?.count ?? 0;
	}

	async findByDocumentNumber(
		organizationId: number,
		documentNumber: string,
	): Promise<Client | null> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);

		const rows = await db
			.select({ partner: businessPartners, profile: customerProfiles })
			.from(customerProfiles)
			.innerJoin(businessPartners, eq(customerProfiles.id, businessPartners.id))
			.where(
				and(
					eq(businessPartners.companyId, companyId),
					eq(businessPartners.taxId, documentNumber),
				),
			)
			.limit(1);

		if (rows.length === 0) return null;

		return this.mapToClient(rows[0].partner, rows[0].profile, organizationId);
	}

	private async findClientContext(id: string) {
		const rows = await db
			.select({ partner: businessPartners, profile: customerProfiles })
			.from(customerProfiles)
			.innerJoin(businessPartners, eq(customerProfiles.id, businessPartners.id))
			.where(eq(businessPartners.id, id))
			.limit(1);

		if (rows.length === 0) return null;

		const organizationId = await resolveOrganizationIdFromCompany(
			rows[0].partner.companyId,
		);

		return {
			partner: rows[0].partner,
			profile: rows[0].profile,
			organizationId,
		};
	}

	private mapToClient(
		partner: typeof businessPartners.$inferSelect,
		profile: typeof customerProfiles.$inferSelect,
		organizationId: number,
	): Client {
		return {
			id: partner.id,
			organizationId,
			name: partner.legalName,
			documentType: (partner.partnerDocumentType ?? "RUC") as
				| "RUC"
				| "DNI"
				| "CE",
			documentNumber: partner.taxId,
			email: partner.email ?? undefined,
			phone: partner.phone ?? undefined,
			address: partner.address ?? undefined,
			creditLimit: profile.creditLimit ?? undefined,
			creditDays: profile.creditDays ?? undefined,
			createdAt: partner.createdAt,
			updatedAt: profile.updatedAt,
		};
	}
}
