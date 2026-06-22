/**
 * Vendor Repository Interface - Domain Layer
 *
 * Contract for vendor persistence.
 */

import type { PreferredPaymentMethod, Vendor } from "./vendor";

export type { Vendor };

/**
 * VendorListFilters interface.
 *
 * @example
 * ```ts
 * const value: VendorListFilters = {} as VendorListFilters;
 * console.log(value);
 * ```
 */
export interface VendorListFilters {
	companyId: string;
	includeInactive?: boolean;
	minRating?: number;
	category?: string;
}

/**
 * CreateVendorInput interface.
 *
 * @example
 * ```ts
 * const value: CreateVendorInput = {} as CreateVendorInput;
 * console.log(value);
 * ```
 */
export interface CreateVendorInput {
	companyId: string;
	taxId: string;
	legalName: string;
	email?: string;
	vendorRating?: number;
	paymentTermDays?: number;
	preferredPaymentMethod?: PreferredPaymentMethod;
	bankAccount?: string;
	purchaseCategories?: string[];
}

/**
 * UpdateVendorInput interface.
 *
 * @example
 * ```ts
 * const value: UpdateVendorInput = {} as UpdateVendorInput;
 * console.log(value);
 * ```
 */
export interface UpdateVendorInput {
	id: string;
	companyId: string;
	taxId?: string;
	legalName?: string;
	email?: string;
	vendorRating?: number;
	paymentTermDays?: number;
	preferredPaymentMethod?: PreferredPaymentMethod;
	bankAccount?: string;
	purchaseCategories?: string[];
}

/**
 * IVendorRepository interface.
 *
 * @example
 * ```ts
 * const value: IVendorRepository = {} as IVendorRepository;
 * console.log(value);
 * ```
 */
export interface IVendorRepository {
	create(input: CreateVendorInput): Promise<Vendor>;
	update(input: UpdateVendorInput): Promise<Vendor>;
	softDelete(id: string, companyId: string): Promise<Vendor>;
	findById(id: string): Promise<Vendor | null>;
	findByIdForCompany(id: string, companyId: string): Promise<Vendor | null>;
	list(filters: VendorListFilters): Promise<Vendor[]>;
	existsByTaxId(companyId: string, taxId: string): Promise<boolean>;
}
