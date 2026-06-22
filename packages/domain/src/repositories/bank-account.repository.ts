import type {
	BankAccount,
	BankAccountType,
	Currency,
} from "../entities/BankAccount";

/**
 * Filters for bank account queries
 *
 * @example
 * ```ts
 * const filters: BankAccountFilters = {
 *   bankName: "BCP",
 *   isActive: true,
 * };
 * ```
 */
export interface BankAccountFilters {
	bankName?: string;
	accountType?: BankAccountType;
	currency?: Currency;
	isActive?: boolean;
	hasAccountingLink?: boolean;
}

/**
 * Bank Account Repository Interface
 *
 * Defines methods for persisting and retrieving bank accounts.
 *
 * @example
 * ```ts
 * const repo: BankAccountRepository = getBankAccountRepository();
 * const accounts = await repo.findAll(1, { isActive: true });
 * ```
 */
export interface BankAccountRepository {
	/**
	 * Save a new bank account
	 */
	save(account: BankAccount): Promise<BankAccount>;

	/**
	 * Update an existing bank account
	 */
	update(account: BankAccount): Promise<BankAccount>;

	/**
	 * Find a bank account by ID
	 */
	findById(id: number, organizationId: number): Promise<BankAccount | null>;

	/**
	 * Find a bank account by account number
	 */
	findByAccountNumber(
		accountNumber: string,
		organizationId: number,
	): Promise<BankAccount | null>;

	/**
	 * Find all bank accounts for an organization
	 */
	findAll(
		organizationId: number,
		filters?: BankAccountFilters,
	): Promise<BankAccount[]>;

	/**
	 * Find all active bank accounts
	 */
	findAllActive(organizationId: number): Promise<BankAccount[]>;

	/**
	 * Find detracciones account for an organization
	 */
	findDetraccionesAccount(organizationId: number): Promise<BankAccount | null>;

	/**
	 * Update account balance
	 * This is an optimized method for updating just the balance
	 */
	updateBalance(
		id: number,
		newBalance: number,
		currency: Currency,
	): Promise<void>;

	/**
	 * Get total balance across all accounts by currency
	 */
	getTotalBalanceByCurrency(
		organizationId: number,
	): Promise<Record<Currency, number>>;

	/**
	 * Count bank accounts
	 */
	count(organizationId: number, filters?: BankAccountFilters): Promise<number>;

	/**
	 * Delete a bank account (soft delete - marks as inactive)
	 */
	delete(id: number, organizationId: number): Promise<void>;
}
