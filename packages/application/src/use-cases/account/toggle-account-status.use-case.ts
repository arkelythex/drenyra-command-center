/**
 * Toggle Account Status Use Case
 * Orchestrates activating/deactivating an accounting account
 */

import type { Account } from "@arkelythex/domain/entities/Account";
import type { AccountRepository } from "@arkelythex/domain/repositories/account.repository";

/**
 * ToggleAccountStatusResult interface.
 *
 * @example
 * ```ts
 * const value: ToggleAccountStatusResult = {} as ToggleAccountStatusResult;
 * console.log(value);
 * ```
 */
export interface ToggleAccountStatusResult {
	account: Account;
	previousStatus: boolean;
	newStatus: boolean;
}

/**
 * ToggleAccountStatusUseCase class.
 *
 * @example
 * ```ts
 * const value = new ToggleAccountStatusUseCase();
 * console.log(value);
 * ```
 */
export class ToggleAccountStatusUseCase {
	constructor(private readonly accountRepository: AccountRepository) {}

	async execute(accountId: string): Promise<ToggleAccountStatusResult> {
		// 1. Find existing account
		const account = await this.accountRepository.findById(accountId);
		if (!account) {
			throw new Error("Cuenta no encontrada");
		}

		// 2. Store previous status
		const previousStatus = account.isActive;

		// 3. If deactivating, check if account has active children
		if (account.isActive) {
			const children = await this.accountRepository.findChildren(accountId);
			const activeChildren = children.filter((child) => child.isActive);

			if (activeChildren.length > 0) {
				throw new Error(
					`No se puede desactivar la cuenta porque tiene ${activeChildren.length} subcuenta(s) activa(s)`,
				);
			}
		}

		// 4. If activating, check if parent is active (if has parent)
		if (!account.isActive && account.parentId) {
			const parent = await this.accountRepository.findById(account.parentId);
			if (parent && !parent.isActive) {
				throw new Error(
					"No se puede activar una cuenta cuya cuenta padre está inactiva",
				);
			}
		}

		// 5. Toggle status using domain method
		const updatedAccount = account.toggleStatus();

		// 6. Persist changes
		await this.accountRepository.save(updatedAccount);

		return {
			account: updatedAccount,
			previousStatus,
			newStatus: updatedAccount.isActive,
		};
	}

	/**
	 * Activate an account
	 */
	async activate(accountId: string): Promise<Account> {
		const account = await this.accountRepository.findById(accountId);
		if (!account) {
			throw new Error("Cuenta no encontrada");
		}

		if (account.isActive) {
			throw new Error("La cuenta ya está activa");
		}

		// Check parent is active
		if (account.parentId) {
			const parent = await this.accountRepository.findById(account.parentId);
			if (parent && !parent.isActive) {
				throw new Error(
					"No se puede activar una cuenta cuya cuenta padre está inactiva",
				);
			}
		}

		const activatedAccount = account.activate();
		await this.accountRepository.save(activatedAccount);

		return activatedAccount;
	}

	/**
	 * Deactivate an account
	 */
	async deactivate(accountId: string): Promise<Account> {
		const account = await this.accountRepository.findById(accountId);
		if (!account) {
			throw new Error("Cuenta no encontrada");
		}

		if (!account.isActive) {
			throw new Error("La cuenta ya está inactiva");
		}

		// Check no active children
		const children = await this.accountRepository.findChildren(accountId);
		const activeChildren = children.filter((child) => child.isActive);

		if (activeChildren.length > 0) {
			throw new Error(
				`No se puede desactivar la cuenta porque tiene ${activeChildren.length} subcuenta(s) activa(s)`,
			);
		}

		const deactivatedAccount = account.deactivate();
		await this.accountRepository.save(deactivatedAccount);

		return deactivatedAccount;
	}
}
