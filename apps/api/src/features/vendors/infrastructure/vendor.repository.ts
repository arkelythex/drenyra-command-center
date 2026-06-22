/**
 * Vendor Repository - Infrastructure Layer
 *
 * Persists vendors across:
 * - business_partners (base fields)
 * - vendor_profiles (AP-specific settings)
 */

import { db } from '@arkelythex/persistence/client';
import { and, desc, eq } from '@arkelythex/persistence/query';
import { businessPartners, vendorProfiles } from '@arkelythex/persistence/schema';
import type { PreferredPaymentMethod } from '../domain/vendor';
import { Vendor } from '../domain/vendor';
import type {
  CreateVendorInput,
  IVendorRepository,
  UpdateVendorInput,
  VendorListFilters,
} from '../domain/vendor.repository.interface';
import { withCompanyRlsTransaction } from '../../security/rls-db-context';

function normalizeCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string').map((s) => s.trim()).filter(Boolean);
}

type BusinessPartnerRow = typeof businessPartners.$inferSelect;
type VendorProfileRow = typeof vendorProfiles.$inferSelect;

/**
 * VendorRepository class.
 *
 * @example
 * ```ts
 * const value = new VendorRepository();
 * console.log(value);
 * ```
 */
export class VendorRepository implements IVendorRepository {
  async create(input: CreateVendorInput): Promise<Vendor> {
    const now = new Date();

    const vendorRating = input.vendorRating ?? 100;
    const paymentTermDays = input.paymentTermDays ?? 30;
    const preferredPaymentMethod: PreferredPaymentMethod = input.preferredPaymentMethod ?? 'TRANSFER';
    const categories = input.purchaseCategories ?? [];

    const created = await withCompanyRlsTransaction(input.companyId, async (tx) => {
      const [partner] = await tx
        .insert(businessPartners)
        .values({
          companyId: input.companyId,
          taxId: input.taxId,
          legalName: input.legalName,
          email: input.email ?? null,
          sunatCondition: 'HABIDO',
          complianceScore: 100,
          createdAt: now,
        })
        .returning();

      const [profile] = await tx
        .insert(vendorProfiles)
        .values({
          id: partner.id,
          paymentTermDays,
          preferredPaymentMethod,
          bankAccount: input.bankAccount ?? null,
          purchaseCategories: categories,
          vendorRating,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return { partner, profile };
    });

    return this.mapToDomain(created.partner, created.profile);
  }

  async update(input: UpdateVendorInput): Promise<Vendor> {
    const now = new Date();

    const existing = await this.findByIdForCompany(input.id, input.companyId);
    if (!existing) throw new Error('Proveedor no encontrado');

    const updated = await withCompanyRlsTransaction(input.companyId, async (tx) => {
      const [partner] = await tx
        .update(businessPartners)
        .set({
          taxId: input.taxId ?? existing.taxId,
          legalName: input.legalName ?? existing.legalName,
          email: input.email ?? existing.email ?? null,
        })
        .where(and(eq(businessPartners.id, input.id), eq(businessPartners.companyId, input.companyId)))
        .returning();

      const [profile] = await tx
        .update(vendorProfiles)
        .set({
          vendorRating: input.vendorRating ?? existing.vendorRating,
          paymentTermDays: input.paymentTermDays ?? existing.paymentTermDays,
          preferredPaymentMethod: (input.preferredPaymentMethod ?? existing.preferredPaymentMethod) as PreferredPaymentMethod,
          bankAccount: input.bankAccount ?? existing.bankAccount ?? null,
          purchaseCategories: input.purchaseCategories ?? existing.purchaseCategories,
          updatedAt: now,
        })
        .where(eq(vendorProfiles.id, input.id))
        .returning();

      return { partner, profile };
    });

    return this.mapToDomain(updated.partner, updated.profile);
  }

  async softDelete(id: string, companyId: string): Promise<Vendor> {
    const now = new Date();

    const existing = await this.findByIdForCompany(id, companyId);
    if (!existing) throw new Error('Proveedor no encontrado');

    const { partner, profile } = await withCompanyRlsTransaction(companyId, async (tx) => {
      const [updatedPartner] = await tx
        .update(businessPartners)
        .set({ sunatCondition: 'INACTIVO' })
        .where(and(eq(businessPartners.id, id), eq(businessPartners.companyId, companyId)))
        .returning();

      const [updatedProfile] = await tx
        .update(vendorProfiles)
        .set({ updatedAt: now })
        .where(eq(vendorProfiles.id, id))
        .returning();

      return {
        partner: updatedPartner,
        profile: updatedProfile,
      };
    });

    return this.mapToDomain(partner, profile);
  }

  async findById(id: string): Promise<Vendor | null> {
    const companyId = await this.resolveCompanyIdByVendorId(id);

    if (!companyId) {
      return null;
    }

    return withCompanyRlsTransaction(companyId, async (tx) => {
      const partner = await tx.query.businessPartners.findFirst({
        where: eq(businessPartners.id, id),
      });

      if (!partner) return null;

      const profile = await tx.query.vendorProfiles.findFirst({
        where: eq(vendorProfiles.id, id),
      });

      if (!profile) return null;

      return this.mapToDomain(partner, profile);
    });
  }

  async findByIdForCompany(id: string, companyId: string): Promise<Vendor | null> {
    return withCompanyRlsTransaction(companyId, async (tx) => {
      const partner = await tx.query.businessPartners.findFirst({
        where: and(eq(businessPartners.id, id), eq(businessPartners.companyId, companyId)),
      });

      if (!partner) return null;

      const profile = await tx.query.vendorProfiles.findFirst({
        where: eq(vendorProfiles.id, id),
      });

      if (!profile) return null;

      return this.mapToDomain(partner, profile);
    });
  }

  async list(filters: VendorListFilters): Promise<Vendor[]> {
    const rows = await withCompanyRlsTransaction(filters.companyId, async (tx) => {
      return await tx
        .select({
          partner: businessPartners,
          profile: vendorProfiles,
        })
        .from(vendorProfiles)
        .innerJoin(businessPartners, eq(vendorProfiles.id, businessPartners.id))
        .where(eq(businessPartners.companyId, filters.companyId))
        .orderBy(desc(businessPartners.createdAt));
    });

    const vendors = rows.map((row) => this.mapToDomain(row.partner, row.profile));

    return vendors.filter((vendor) => {
      if (!filters.includeInactive && vendor.isInactive) return false;
      if (filters.minRating !== undefined && vendor.vendorRating < filters.minRating) return false;
      if (filters.category) {
        const needle = filters.category.trim().toLowerCase();
        if (!needle) return true;
        return vendor.purchaseCategories.some((c) => c.toLowerCase() === needle);
      }
      return true;
    });
  }

  async existsByTaxId(companyId: string, taxId: string): Promise<boolean> {
    return withCompanyRlsTransaction(companyId, async (tx) => {
      const row = await tx.query.businessPartners.findFirst({
        where: and(eq(businessPartners.companyId, companyId), eq(businessPartners.taxId, taxId)),
      });

      if (!row) return false;

      // Must be a vendor (has profile).
      const profile = await tx.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.id, row.id) });
      return Boolean(profile);
    });
  }

  private async resolveCompanyIdByVendorId(id: string): Promise<string | null> {
    const partner = await db.query.businessPartners.findFirst({
      columns: {
        companyId: true,
      },
      where: eq(businessPartners.id, id),
    });

    return partner?.companyId ?? null;
  }

  private mapToDomain(partner: BusinessPartnerRow, profile: VendorProfileRow): Vendor {
    return new Vendor({
      id: partner.id,
      companyId: partner.companyId,
      taxId: partner.taxId,
      legalName: partner.legalName,
      email: partner.email ?? undefined,
      sunatCondition: partner.sunatCondition ?? 'HABIDO',
      vendorRating: profile.vendorRating ?? 100,
      paymentTermDays: profile.paymentTermDays ?? 30,
      preferredPaymentMethod: (profile.preferredPaymentMethod ?? 'TRANSFER') as PreferredPaymentMethod,
      bankAccount: profile.bankAccount ?? undefined,
      purchaseCategories: normalizeCategories(profile.purchaseCategories),
      createdAt: partner.createdAt,
      updatedAt: profile.updatedAt ?? partner.createdAt,
    });
  }
}
