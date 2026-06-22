/**
 * Bill Repository Interface - Domain Layer
 * Defines the contract for bill persistence
 *
 * 2026 Best Practices:
 * - Interface Segregation: Repository per aggregate root
 * - Dependency Inversion: Domain defines contract, infrastructure implements
 * - No framework types in interface (pure TypeScript)
 */

import type { Bill, BillStatus } from "./bill.entity";

// Filter DTO for listing bills
/**
 * Filters for listing bills with pagination.
 *
 * @example
 * ```ts
 * const filters: BillListFilters = { companyId: 'cmp_123', limit: 20, offset: 0 };
 * ```
 */
export interface BillListFilters {
	companyId: string;
	status?: BillStatus;
	vendorId?: string;
	startDate?: Date;
	endDate?: Date;
	minAmount?: number;
	maxAmount?: number;
	search?: string;
	limit?: number;
	offset?: number;
}

// Result DTO with pagination
/**
 * Bill list result with pagination metadata.
 *
 * @example
 * ```ts
 * const result = { bills: [], total: 0, limit: 20, offset: 0 } as BillListResult;
 * ```
 */
export interface BillListResult {
	bills: Bill[];
	total: number;
	limit: number;
	offset: number;
}

// Repository Interface
/**
 * Repository contract for bill persistence (domain-owned interface).
 *
 * @example
 * ```ts
 * async function load(repo: IBillRepository, id: string) {
 *   return repo.findById(id);
 * }
 * ```
 */
export interface IBillRepository {
	/**
	 * Create a new bill
	 */
	create(bill: Bill): Promise<Bill>;

	/**
	 * Find bill by ID
	 */
	findById(id: string): Promise<Bill | null>;

	/**
	 * Find bill by bill number
	 */
	findByNumber(billNumber: string, companyId: string): Promise<Bill | null>;

	/**
	 * List bills with filters
	 */
	list(filters: BillListFilters): Promise<BillListResult>;

	/**
	 * Update bill
	 */
	update(bill: Bill): Promise<Bill>;

	/**
	 * Update bill status
	 */
	updateStatus(
		id: string,
		status: BillStatus,
		notes?: string,
		legacyUserId?: string,
	): Promise<void>;

	/**
	 * Apply payment to bill
	 */
	applyPayment(id: string, amount: string): Promise<void>;

	/**
	 * Delete bill (DRAFT only)
	 */
	delete(id: string): Promise<void>;

	/**
	 * Check if bill number exists
	 */
	exists(billNumber: string, companyId: string): Promise<boolean>;

	/**
	 * Get overdue bills
	 */
	getOverdue(companyId: string, asOfDate?: Date): Promise<Bill[]>;

	/**
	 * Get bills by vendor
	 */
	getByVendor(vendorId: string, limit?: number): Promise<Bill[]>;
}
