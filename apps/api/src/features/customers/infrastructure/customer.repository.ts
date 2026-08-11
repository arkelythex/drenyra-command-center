/**
 * Customer Repository - Infrastructure Layer
 *
 * Persists customers across:
 * - business_partners (base fields)
 * - customer_profiles (AR-specific settings)
 */

import { db } from "@drenyra/persistence/client";
import { and, desc, eq } from "@drenyra/persistence/query";
import {
	businessPartners,
	customerProfiles,
} from "@drenyra/persistence/schema";
import { withCompanyRlsTransaction } from "../../security/rls-db-context";
import { Customer } from "../domain/customer";
import type {
	CreateCustomerInput,
	CustomerListFilters,
	CustomerSegment,
	ICustomerRepository,
	UpdateCustomerInput,
} from "../domain/customer.repository.interface";

function normalizeSegment(value: unknown): CustomerSegment {
	if (value === "WHOLESALE" || value === "GOVERNMENT" || value === "RETAIL")
		return value;
	return "RETAIL";
}

type BusinessPartnerRow = typeof businessPartners.$inferSelect;
type CustomerProfileRow = typeof customerProfiles.$inferSelect;

/**
 * CustomerRepository class.
 *
 * @example
 * ```ts
 * const value = new CustomerRepository();
 * console.log(value);
 * ```
 */
export class CustomerRepository implements ICustomerRepository {
	async create(input: CreateCustomerInput): Promise<Customer> {
		const now = new Date();

		const creditLimit = input.creditLimit ?? 0;
		const creditDays = input.creditDays ?? 30;
		const customerSegment = input.customerSegment ?? "RETAIL";

		const created = await withCompanyRlsTransaction(
			input.companyId,
			async (tx) => {
				const [partner] = await tx
					.insert(businessPartners)
					.values({
						companyId: input.companyId,
						taxId: input.taxId,
						legalName: input.legalName,
						email: input.email ?? null,
						sunatCondition: "HABIDO",
						complianceScore: 100,
						createdAt: now,
					})
					.returning();
					if (partner === undefined) {
						throw new Error("Failed to create customer partner");
					}

				const [profile] = await tx
					.insert(customerProfiles)
					.values({
						id: partner.id,
						creditLimit: String(creditLimit),
						creditDays,
						customerSegment,
						paymentBehaviorScore: 100,
						lastPurchaseDate: null,
						totalPurchases: "0",
						createdAt: now,
						updatedAt: now,
					})
					.returning();

				return { partner, profile };
			},
		);

		if (created.partner === undefined || created.profile === undefined) {
			throw new Error("Failed to create customer");
		}
		return this.mapToDomain(created.partner, created.profile);
	}

	async update(input: UpdateCustomerInput): Promise<Customer> {
		const now = new Date();

		const existing = await this.findByIdForCompany(input.id, input.companyId);
		if (!existing) throw new Error("Cliente no encontrado");

		const updated = await withCompanyRlsTransaction(
			input.companyId,
			async (tx) => {
				const [partner] = await tx
					.update(businessPartners)
					.set({
						taxId: input.taxId ?? existing.taxId,
						legalName: input.legalName ?? existing.legalName,
						email: input.email ?? existing.email ?? null,
					})
					.where(
						and(
							eq(businessPartners.id, input.id),
							eq(businessPartners.companyId, input.companyId),
						),
					)
					.returning();

				const [profile] = await tx
					.update(customerProfiles)
					.set({
						creditLimit: String(input.creditLimit ?? existing.creditLimit),
						creditDays: input.creditDays ?? existing.creditDays,
						customerSegment: input.customerSegment ?? existing.customerSegment,
						updatedAt: now,
					})
					.where(eq(customerProfiles.id, input.id))
					.returning();

				return { partner, profile };
			},
		);

		if (updated.partner === undefined || updated.profile === undefined) {
			throw new Error("Failed to update customer");
		}
		return this.mapToDomain(updated.partner, updated.profile);
	}

	async softDelete(id: string, companyId: string): Promise<Customer> {
		const now = new Date();

		const existing = await this.findByIdForCompany(id, companyId);
		if (!existing) throw new Error("Cliente no encontrado");

		const { partner, profile } = await withCompanyRlsTransaction(
			companyId,
			async (tx) => {
				const [updatedPartner] = await tx
					.update(businessPartners)
					.set({ sunatCondition: "INACTIVO" })
					.where(
						and(
							eq(businessPartners.id, id),
							eq(businessPartners.companyId, companyId),
						),
					)
					.returning();

				const [updatedProfile] = await tx
					.update(customerProfiles)
					.set({ updatedAt: now })
					.where(eq(customerProfiles.id, id))
					.returning();

				return {
					partner: updatedPartner,
					profile: updatedProfile,
				};
			},
		);

		if (partner === undefined || profile === undefined) {
			throw new Error("Failed to soft-delete customer");
		}
		return this.mapToDomain(partner, profile);
	}

	async findById(id: string): Promise<Customer | null> {
		const companyId = await this.resolveCompanyIdByCustomerId(id);

		if (!companyId) {
			return null;
		}

		return withCompanyRlsTransaction(companyId, async (tx) => {
			const partner = await tx.query.businessPartners.findFirst({
				where: eq(businessPartners.id, id),
			});
			if (!partner) return null;

			const profile = await tx.query.customerProfiles.findFirst({
				where: eq(customerProfiles.id, id),
			});
			if (!profile) return null;

			return this.mapToDomain(partner, profile);
		});
	}

	async findByIdForCompany(
		id: string,
		companyId: string,
	): Promise<Customer | null> {
		return withCompanyRlsTransaction(companyId, async (tx) => {
			const partner = await tx.query.businessPartners.findFirst({
				where: and(
					eq(businessPartners.id, id),
					eq(businessPartners.companyId, companyId),
				),
			});
			if (!partner) return null;

			const profile = await tx.query.customerProfiles.findFirst({
				where: eq(customerProfiles.id, id),
			});
			if (!profile) return null;

			return this.mapToDomain(partner, profile);
		});
	}

	async list(filters: CustomerListFilters): Promise<Customer[]> {
		const rows = await withCompanyRlsTransaction(
			filters.companyId,
			async (tx) => {
				return await tx
					.select({ partner: businessPartners, profile: customerProfiles })
					.from(customerProfiles)
					.innerJoin(
						businessPartners,
						eq(customerProfiles.id, businessPartners.id),
					)
					.where(eq(businessPartners.companyId, filters.companyId))
					.orderBy(desc(businessPartners.createdAt));
			},
		);

		const customers = rows.map((row) =>
			this.mapToDomain(row.partner, row.profile),
		);

		return customers.filter((customer) => {
			if (!filters.includeInactive && customer.isInactive) return false;
			if (
				filters.minPaymentScore !== undefined &&
				customer.paymentBehaviorScore < filters.minPaymentScore
			)
				return false;
			if (filters.segment && customer.customerSegment !== filters.segment)
				return false;
			return true;
		});
	}

	async existsByTaxId(companyId: string, taxId: string): Promise<boolean> {
		return withCompanyRlsTransaction(companyId, async (tx) => {
			const row = await tx.query.businessPartners.findFirst({
				where: and(
					eq(businessPartners.companyId, companyId),
					eq(businessPartners.taxId, taxId),
				),
			});

			if (!row) return false;

			const profile = await tx.query.customerProfiles.findFirst({
				where: eq(customerProfiles.id, row.id),
			});
			return Boolean(profile);
		});
	}

	private async resolveCompanyIdByCustomerId(
		id: string,
	): Promise<string | null> {
		const partner = await db.query.businessPartners.findFirst({
			columns: {
				companyId: true,
			},
			where: eq(businessPartners.id, id),
		});

		return partner?.companyId ?? null;
	}

	private mapToDomain(
		partner: BusinessPartnerRow,
		profile: CustomerProfileRow,
	): Customer {
		const creditLimit = Number(profile.creditLimit ?? 0);
		const totalPurchases = Number(profile.totalPurchases ?? 0);

		return new Customer({
			id: partner.id,
			companyId: partner.companyId,
			taxId: partner.taxId,
			legalName: partner.legalName,
			...(partner.email != null ? { email: partner.email } : {}),
			...(partner.address != null ? { address: partner.address } : {}),
			...(partner.phone != null ? { phone: partner.phone } : {}),
			creditLimit: Number.isFinite(creditLimit) ? creditLimit : 0,
			creditDays: profile.creditDays ?? 30,
			customerSegment: normalizeSegment(profile.customerSegment),
			paymentBehaviorScore: profile.paymentBehaviorScore ?? 100,
			...(profile.lastPurchaseDate != null ? { lastPurchaseDate: profile.lastPurchaseDate } : {}),
			totalPurchases: Number.isFinite(totalPurchases) ? totalPurchases : 0,
			complianceScore: partner.complianceScore ?? 100,
			sunatCondition: partner.sunatCondition ?? "HABIDO",
			...(partner.logoUrl != null ? { logoUrl: partner.logoUrl } : {}),
			createdAt: partner.createdAt,
			updatedAt: profile.updatedAt ?? partner.createdAt,
		});
	}
}
