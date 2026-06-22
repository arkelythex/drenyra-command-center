/**
 * Delete Account Use Case
 * Orchestrates the deletion of an accounting account
 * Enforces business rules preventing deletion of system accounts
 * and accounts with children or transactions
 */

import type { AccountRepository } from "@arkelythex/domain/repositories/account.repository";
import type { JournalEntryRepository } from "@arkelythex/domain/repositories/journal-entry.repository";

/**
 * DeleteAccountResult interface.
 *
 * @example
 * ```ts
 * const value: DeleteAccountResult = {} as DeleteAccountResult;
 * console.log(value);
 * ```
 */
export interface DeleteAccountResult {
	success: boolean;
	deletedAccountId: string;
	deletedCode: string;
}

/**
 * DeleteAccountUseCase class.
 *
 * @example
 * ```ts
 * const value = new DeleteAccountUseCase();
 * console.log(value);
 * ```
 */
export class DeleteAccountUseCase {
	constructor(
		private readonly accountRepository: AccountRepository,
		private readonly journalRepository?: JournalEntryRepository,
	) {}

	async execute(accountId: string): Promise<DeleteAccountResult> {
		// 1. Find existing account
		const account = await this.accountRepository.findById(accountId);
		if (!account) {
			throw new Error("Cuenta no encontrada");
		}

		// 2. Check if account can be deleted (domain rule)
		if (!account.canBeDeleted()) {
			throw new Error("No se puede eliminar una cuenta del sistema");
		}

		// 3. Check if account has children
		const hasChildren = await this.accountRepository.hasChildren(accountId);
		if (hasChildren) {
			throw new Error("No se puede eliminar una cuenta que tiene subcuentas");
		}

		// 4. Check if account has transactions (if journal repository available)
		if (this.journalRepository) {
			const transactionCount =
				await this.journalRepository.countByAccountId(accountId);
			if (transactionCount > 0) {
				throw new Error(
					`No se puede eliminar la cuenta porque tiene ${transactionCount} asiento(s) contable(s) asociado(s)`,
				);
			}
		}

		// 5. Check balance is zero
		if (account.balance.getAmount() !== 0) {
			throw new Error(
				"No se puede eliminar una cuenta con saldo diferente de cero",
			);
		}

		// 6. Delete the account
		await this.accountRepository.delete(accountId);

		return {
			success: true,
			deletedAccountId: accountId,
			deletedCode: account.code,
		};
	}
}
