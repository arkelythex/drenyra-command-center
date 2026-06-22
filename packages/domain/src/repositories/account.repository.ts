/**
 * Account Repository Interface
 * Defines the contract for account persistence operations
 *
 * This interface follows the Repository pattern from DDD,
 * allowing the domain layer to remain agnostic of persistence details.
 */

import type {
	Account,
	AccountLevel,
	AccountType,
	Currency,
} from "../entities/Account";

/**
 * Filters for querying accounts
 *
 * @example
 * ```ts
 * const filters: AccountFilters = {
 *   organizationId: 1,
 *   searchTerm: "Caja",
 *   status: "active",
 * };
 * ```
 */
export interface AccountFilters {
	organizationId: number;
	searchTerm?: string;
	type?: AccountType;
	currency?: Currency;
	level?: AccountLevel;
	status?: "active" | "inactive" | "all";
	onlyCustom?: boolean; // Exclude system accounts
	onlyMovement?: boolean; // Only movement accounts (not groups)
	parentId?: string; // Filter by parent
}

/**
 * Hierarchical account with children
 *
 * @example
 * ```ts
 * const account = {} as Account;
 * const tree: AccountWithChildren = { ...account, children: [] };
 * ```
 */
export interface AccountWithChildren extends Account {
	children: AccountWithChildren[];
}

/**
 * Account Repository Interface
 *
 * @example
 * ```ts
 * const repo: AccountRepository = getAccountRepository();
 * const hierarchy = await repo.getHierarchy(1);
 * ```
 */
export interface AccountRepository {
	/**
	 * Save an account (create or update)
	 */
	save(account: Account): Promise<void>;

	/**
	 * Find an account by ID
	 */
	findById(id: string): Promise<Account | null>;

	/**
	 * Find an account by code within an organization
	 */
	findByCode(organizationId: number, code: string): Promise<Account | null>;

	/**
	 * Find all accounts for an organization
	 */
	findAll(organizationId: number): Promise<Account[]>;

	/**
	 * Find accounts with filters
	 */
	findWithFilters(filters: AccountFilters): Promise<Account[]>;

	/**
	 * Find children of an account
	 */
	findChildren(parentId: string): Promise<Account[]>;

	/**
	 * Find only movement accounts (non-group accounts)
	 */
	findMovementAccounts(organizationId: number): Promise<Account[]>;

	/**
	 * Get hierarchical account structure
	 * Returns root accounts with nested children
	 */
	getHierarchy(organizationId: number): Promise<AccountWithChildren[]>;

	/**
	 * Delete an account
	 */
	delete(id: string): Promise<void>;

	/**
	 * Check if an account has children
	 */
	hasChildren(id: string): Promise<boolean>;

	/**
	 * Check if a code exists in an organization
	 */
	codeExists(
		organizationId: number,
		code: string,
		excludeId?: string,
	): Promise<boolean>;

	/**
	 * Count accounts matching filters
	 */
	count(filters?: AccountFilters): Promise<number>;

	/**
	 * Get the next available code for a given parent
	 * Useful for auto-generating account codes
	 */
	getNextChildCode(parentId: string): Promise<string>;
}
