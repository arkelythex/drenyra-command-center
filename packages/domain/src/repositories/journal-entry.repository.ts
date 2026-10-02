/**
 * Journal Entry Repository Interface
 * Defines the contract for journal entry persistence
 * This is a PORT in Clean Architecture (Application Layer)
 */

import type { JournalEntry } from "../entities/JournalEntry";
import type { TenantScope } from "../scope";

// ===== TYPES =====

/**
 * Journal entry status values
 *
 * @example
 * ```ts
 * const status: JournalEntryStatus = "borrador";
 * ```
 */
export type JournalEntryStatus = "borrador" | "mayorizado" | "declarado";

/**
 * Filters for querying journal entries
 *
 * @example
 * ```ts
 * const filters: JournalEntryFilters = {
 *   organizationId: 1,
 *   status: "borrador",
 *   dateFrom: new Date("2026-01-01"),
 * };
 * ```
 */
export interface JournalEntryFilters {
	readonly organizationId: number;
	readonly status?: JournalEntryStatus | "all";
	readonly dateFrom?: Date;
	readonly dateTo?: Date;
	readonly minAmount?: number;
	readonly maxAmount?: number;
	readonly documentNumber?: string;
}

/**
 * Pagination options for list queries
 *
 * @example
 * ```ts
 * const pagination: PaginationOptions = { limit: 50, offset: 0 };
 * ```
 */
export interface PaginationOptions {
	readonly limit?: number;
	readonly offset?: number;
}

/**
 * Sort options for list queries
 *
 * @example
 * ```ts
 * const sort: SortOptions = { field: "date", direction: "desc" };
 * ```
 */
export interface SortOptions {
	readonly field: "date" | "entryNumber" | "createdAt";
	readonly direction: "asc" | "desc";
}

// ===== REPOSITORY INTERFACE =====

/**
 * Repository contract for {@link JournalEntry} persistence and queries.
 *
 * @example
 * ```ts
 * const repo: JournalEntryRepository = getJournalEntryRepository();
 * const entries = await repo.findWithFilters({ organizationId: 1, status: "all" });
 * ```
 */
export interface JournalEntryRepository {
	/**
	 * Create a journal entry owned by the caller's company.
	 * The owning company comes from the scope, never from the entry itself.
	 * @throws {PersistenceError} if the id already exists or the operation fails
	 */
	create(scope: TenantScope, entry: JournalEntry): Promise<void>;

	/**
	 * Update a journal entry (header and lines) inside the caller's tenant scope.
	 * @throws {NotFoundError} if the entry does not exist in that scope
	 */
	update(scope: TenantScope, entry: JournalEntry): Promise<void>;

	/**
	 * Find a journal entry by ID inside the caller's tenant scope.
	 * Enforces tenant isolation: an entry owned by another company is
	 * indistinguishable from a nonexistent one.
	 * @param scope - Tenant scope (organization and company) of the caller
	 * @returns The journal entry or null if not found in that scope
	 */
	findById(scope: TenantScope, id: string): Promise<JournalEntry | null>;

	/**
	 * Find all journal entries for an organization
	 * @returns Array of journal entries, empty if none found
	 */
	findAll(organizationId: number): Promise<JournalEntry[]>;

	/**
	 * Find journal entries with filters
	 * @returns Array of matching journal entries
	 */
	findWithFilters(filters: JournalEntryFilters): Promise<JournalEntry[]>;

	/**
	 * Delete a journal entry inside the caller's tenant scope
	 * @throws {BusinessRuleError} if entry status is not 'borrador'
	 * @throws {NotFoundError} if the entry does not exist in that scope
	 */
	delete(scope: TenantScope, id: string): Promise<void>;

	/**
	 * Get next entry number for an organization
	 * @returns Formatted entry number (e.g., "2024-00001")
	 */
	getNextEntryNumber(organizationId: number, year: number): Promise<string>;

	/**
	 * Count journal entries matching filters
	 * @returns Total count of matching entries
	 */
	count(filters?: JournalEntryFilters): Promise<number>;

	/**
	 * Count journal entries that use a specific account
	 * @returns Count of entries using the account
	 */
	countByAccountId(accountId: string): Promise<number>;
}
