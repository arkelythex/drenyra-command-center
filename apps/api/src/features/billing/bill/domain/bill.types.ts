/**
 * Bill Types - Domain Layer
 * Shared types and value objects for Bill domain
 */

import type { BillStatus, Currency } from "./bill.entity";

// Branded types for type safety
/**
 * Branded identifier type for a Bill.
 *
 * @example
 * ```ts
 * const id: BillId = createBillId('bill_123');
 * ```
 */
export type BillId = string & { readonly __brand: "BillId" };

/**
 * Branded identifier type for a Company.
 *
 * @example
 * ```ts
 * const id: CompanyId = createCompanyId('cmp_123');
 * ```
 */
export type CompanyId = string & { readonly __brand: "CompanyId" };

/**
 * Branded identifier type for a Vendor.
 *
 * @example
 * ```ts
 * const id: VendorId = createVendorId('ven_123');
 * ```
 */
export type VendorId = string & { readonly __brand: "VendorId" };

// Helper to create branded types
/**
 * Creates a branded {@link BillId} from a raw string.
 *
 * @param id - Raw id value
 * @returns Branded BillId
 *
 * @example
 * ```ts
 * const billId = createBillId('bill_123');
 * ```
 */
export function createBillId(id: string): BillId {
	return id as BillId;
}

/**
 * Creates a branded {@link CompanyId} from a raw string.
 *
 * @param id - Raw id value
 * @returns Branded CompanyId
 *
 * @example
 * ```ts
 * const companyId = createCompanyId('cmp_123');
 * ```
 */
export function createCompanyId(id: string): CompanyId {
	return id as CompanyId;
}

/**
 * Creates a branded {@link VendorId} from a raw string.
 *
 * @param id - Raw id value
 * @returns Branded VendorId
 *
 * @example
 * ```ts
 * const vendorId = createVendorId('ven_123');
 * ```
 */
export function createVendorId(id: string): VendorId {
	return id as VendorId;
}

// Input DTO for creating a bill item
/**
 * Input DTO for creating a bill item.
 *
 * @example
 * ```ts
 * const item: CreateBillItemInput = { description: 'Servicio', quantity: '1', unitPrice: '10.00' };
 * ```
 */
export interface CreateBillItemInput {
	productId?: string;
	description: string;
	quantity: string;
	unitPrice: string;
}

// Output DTO for bill responses
/**
 * Bill response DTO used by the API/application layer.
 *
 * @example
 * ```ts
 * const dto = { id: 'bill_123', billNumber: 'B001-0001', status: 'DRAFT' } as BillDTO;
 * ```
 */
export interface BillDTO {
	id: string;
	companyId: string;
	vendorId: string;
	billNumber: string;
	issueDate: Date;
	dueDate: Date;
	currency: Currency;
	exchangeRate: number;
	status: BillStatus;
	subtotal: { amount: string; currency: Currency };
	igvAmount: { amount: string; currency: Currency };
	totalAmount: { amount: string; currency: Currency };
	balanceDue: { amount: string; currency: Currency };
	items: BillItemDTO[];
	notes?: string;
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Bill item response DTO.
 *
 * @example
 * ```ts
 * const item = { id: 'item_1', description: 'Servicio', quantity: 1 } as BillItemDTO;
 * ```
 */
export interface BillItemDTO {
	id: string;
	productId?: string;
	description: string;
	quantity: number;
	unitPrice: { amount: string; currency: Currency };
	total: { amount: string; currency: Currency };
}

// List response DTO
/**
 * Bill list response DTO with pagination.
 *
 * @example
 * ```ts
 * const list = { bills: [], total: 0, limit: 20, offset: 0 } as BillListDTO;
 * ```
 */
export interface BillListDTO {
	bills: BillDTO[];
	total: number;
	limit: number;
	offset: number;
}

// Summary DTO for dashboard widgets
/**
 * Summary DTO for bill dashboard widgets.
 *
 * @example
 * ```ts
 * const summary = { totalCount: 0, draftCount: 0, overdueCount: 0 } as BillSummaryDTO;
 * ```
 */
export interface BillSummaryDTO {
	totalCount: number;
	draftCount: number;
	overdueCount: number;
	totalOutstanding: { amount: string; currency: Currency };
}
