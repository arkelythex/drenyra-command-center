/**
 * Get Accounts Use Case
 * Orchestrates querying accounts with various filters and formats
 */

import {
	type AccountFiltersDTO,
	type AccountHierarchyDTO,
	type AccountResponseDTO,
	accountFiltersSchema,
	formatBalance,
	LEVEL_NAMES,
} from "../../dtos/account/account.dto";
import type { Account } from "@arkelythex/domain/entities/Account";
import type {
	AccountFilters,
	AccountRepository,
	AccountWithChildren,
} from "@arkelythex/domain/repositories/account.repository";

/**
 * GetAccountsUseCase class.
 *
 * @example
 * ```ts
 * const value = new GetAccountsUseCase();
 * console.log(value);
 * ```
 */
export class GetAccountsUseCase {
	constructor(private readonly accountRepository: AccountRepository) {}

	/**
	 * Get all accounts for an organization with optional filters
	 */
	async execute(input: AccountFiltersDTO): Promise<AccountResponseDTO[]> {
		// 1. Validate input
		const validatedInput = accountFiltersSchema.parse(input);

		// 2. Convert DTO filters to domain filters
		const filters: AccountFilters = {
			organizationId: validatedInput.organizationId,
			searchTerm: validatedInput.searchTerm,
			type: validatedInput.type,
			currency: validatedInput.currency,
			level: validatedInput.level,
			status: validatedInput.status,
			onlyCustom: validatedInput.onlyCustom,
			onlyMovement: validatedInput.onlyMovement,
			parentId: validatedInput.parentId,
		};

		// 3. Query accounts
		const accounts = await this.accountRepository.findWithFilters(filters);

		// 4. Transform to response DTOs
		return accounts.map((account) => this.toResponseDTO(account));
	}

	/**
	 * Get accounts in hierarchical structure
	 */
	async executeHierarchy(
		organizationId: number,
	): Promise<AccountHierarchyDTO[]> {
		const hierarchy = await this.accountRepository.getHierarchy(organizationId);
		return hierarchy.map((account) => this.toHierarchyDTO(account));
	}

	/**
	 * Get a single account by ID
	 */
	async executeById(accountId: string): Promise<AccountResponseDTO | null> {
		const account = await this.accountRepository.findById(accountId);
		if (!account) return null;
		return this.toResponseDTO(account);
	}

	/**
	 * Get a single account by code
	 */
	async executeByCode(
		organizationId: number,
		code: string,
	): Promise<AccountResponseDTO | null> {
		const account = await this.accountRepository.findByCode(
			organizationId,
			code,
		);
		if (!account) return null;
		return this.toResponseDTO(account);
	}

	/**
	 * Get only movement accounts (for journal entries)
	 */
	async executeMovementAccounts(
		organizationId: number,
	): Promise<AccountResponseDTO[]> {
		const accounts =
			await this.accountRepository.findMovementAccounts(organizationId);
		return accounts.map((account) => this.toResponseDTO(account));
	}

	/**
	 * Get children of an account
	 */
	async executeChildren(parentId: string): Promise<AccountResponseDTO[]> {
		const accounts = await this.accountRepository.findChildren(parentId);
		return accounts.map((account) => this.toResponseDTO(account));
	}

	/**
	 * Transform Account entity to response DTO
	 */
	private toResponseDTO(account: Account): AccountResponseDTO {
		return {
			id: account.id,
			organizationId: account.organizationId,
			code: account.code,
			name: account.name,
			description: account.description,
			level: account.level,
			levelName: LEVEL_NAMES[account.level],
			type: account.type,
			parentId: account.parentId,
			isGroup: account.isGroup,
			isActive: account.isActive,
			isSystem: account.isSystem,
			currency: account.currency,
			destination: account.destination,
			balance: account.balance.getAmount(),
			balanceUSD: account.balanceUSD?.getAmount(),
			formattedBalance: formatBalance(account.balance.getAmount(), "PEN"),
			formattedBalanceUSD: account.balanceUSD
				? formatBalance(account.balanceUSD.getAmount(), "USD")
				: undefined,
			canBeDeleted: account.canBeDeleted(),
			canHaveChildren: account.canHaveChildren(),
			canHaveTransactions: account.canHaveTransactions(),
			createdAt: account.createdAt.toISOString(),
			updatedAt: account.updatedAt.toISOString(),
		};
	}

	/**
	 * Transform hierarchical account to hierarchy DTO
	 */
	private toHierarchyDTO(account: AccountWithChildren): AccountHierarchyDTO {
		const baseDTO = this.toResponseDTO(account as unknown as Account);
		return {
			...baseDTO,
			children: account.children.map((child) => this.toHierarchyDTO(child)),
		};
	}
}
