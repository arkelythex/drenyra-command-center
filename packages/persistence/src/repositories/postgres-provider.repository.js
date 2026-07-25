import { randomUUID } from "node:crypto";
import { and, eq, ilike, like, sql } from "drizzle-orm";
import { db } from "../client";
import { businessPartners, vendorProfiles } from "../schema";
import {
	resolveCompanyIdFromOrganization,
	resolveOrganizationIdFromCompany,
} from "./support/organization-resolver";
export class PostgresProviderRepository {
	async save(data) {
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
		return this.mapToProvider(
			created.partner,
			created.profile,
			data.organizationId,
		);
	}
	async update(id, data) {
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
		return this.mapToProvider(
			updated.partner,
			updated.profile,
			existing.organizationId,
		);
	}
	async delete(id) {
		await db.delete(businessPartners).where(eq(businessPartners.id, id));
	}
	async findById(id) {
		const context = await this.findProviderContext(id);
		if (!context) return null;
		return this.mapToProvider(
			context.partner,
			context.profile,
			context.organizationId,
		);
	}
	async findAll(organizationId, filters) {
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
	async count(organizationId, filters) {
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
			.select({ count: sql`count(*)::int` })
			.from(vendorProfiles)
			.innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
			.where(and(...conditions));
		return result?.count ?? 0;
	}
	async findByRUC(organizationId, ruc) {
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
		return this.mapToProvider(rows[0].partner, rows[0].profile, organizationId);
	}
	async findProviderContext(id) {
		const rows = await db
			.select({ partner: businessPartners, profile: vendorProfiles })
			.from(vendorProfiles)
			.innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
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
	mapToProvider(partner, profile, organizationId) {
		return {
			id: partner.id,
			organizationId,
			name: partner.legalName,
			ruc: partner.taxId,
			email: partner.email ?? undefined,
			paymentTerms: profile.paymentTermDays ?? 30,
			createdAt: partner.createdAt,
			updatedAt: profile.updatedAt,
		};
	}
}
