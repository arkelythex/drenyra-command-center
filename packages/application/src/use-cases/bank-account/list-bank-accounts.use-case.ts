/**
 * List Bank Accounts Use Case
 *
 * Retrieves all bank accounts for an organization
 * with optional filtering by status and currency.
 */

import type { BankAccount } from "@drenyra/domain/entities/BankAccount";
import type {
	BankAccountFilters,
	BankAccountRepository,
} from "@drenyra/domain/repositories/bank-account.repository";

/**
 * ListBankAccountsInput interface.
 *
 * @example
 * ```ts
 * const value: ListBankAccountsInput = {} as ListBankAccountsInput;
 * console.log(value);
 * ```
 */
export interface ListBankAccountsInput {
	organizationId: number;
	filters?: BankAccountFilters;
}

/**
 * ListBankAccountsOutput interface.
 *
 * @example
 * ```ts
 * const value: ListBankAccountsOutput = {} as ListBankAccountsOutput;
 * console.log(value);
 * ```
 */
export interface ListBankAccountsOutput {
	success: boolean;
	data?: BankAccount[];
	totalBalance?: {
		PEN: number;
		USD: number;
	};
	error?: string;
}

/**
 * ListBankAccountsUseCase class.
 *
 * @example
 * ```ts
 * const value = new ListBankAccountsUseCase();
 * console.log(value);
 * ```
 */
export class ListBankAccountsUseCase {
	constructor(private readonly bankAccountRepository: BankAccountRepository) {}

	async execute(input: ListBankAccountsInput): Promise<ListBankAccountsOutput> {
		try {
			const { organizationId, filters } = input;

			// Validate organization ID
			if (!organizationId || organizationId <= 0) {
				return {
					success: false,
					error: "ID de organización inválido",
				};
			}

			// Fetch bank accounts
			const accounts = await this.bankAccountRepository.findAll(
				organizationId,
				filters,
			);

			// Get total balance by currency
			const totalBalance =
				await this.bankAccountRepository.getTotalBalanceByCurrency(
					organizationId,
				);

			return {
				success: true,
				data: accounts,
				totalBalance,
			};
		} catch (error) {
			console.error("ListBankAccountsUseCase error:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error al listar cuentas bancarias",
			};
		}
	}
}
