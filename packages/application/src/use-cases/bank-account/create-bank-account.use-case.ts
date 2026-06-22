/**
 * Create Bank Account Use Case
 *
 * Creates a new bank account for an organization.
 */

import {
	BankAccount,
	type BankAccountType,
	type Currency,
} from "@arkelythex/domain/entities/BankAccount";
import type { BankAccountRepository } from "@arkelythex/domain/repositories/bank-account.repository";

/**
 * CreateBankAccountInput interface.
 *
 * @example
 * ```ts
 * const value: CreateBankAccountInput = {} as CreateBankAccountInput;
 * console.log(value);
 * ```
 */
export interface CreateBankAccountInput {
	organizationId: number;
	bankName: string;
	accountNumber: string;
	accountType: BankAccountType;
	currency: Currency;
	initialBalance?: number;
	accountingAccountId?: string;
	cci?: string;
	swiftCode?: string;
	notes?: string;
}

/**
 * CreateBankAccountOutput interface.
 *
 * @example
 * ```ts
 * const value: CreateBankAccountOutput = {} as CreateBankAccountOutput;
 * console.log(value);
 * ```
 */
export interface CreateBankAccountOutput {
	success: boolean;
	data?: BankAccount;
	error?: string;
}

/**
 * CreateBankAccountUseCase class.
 *
 * @example
 * ```ts
 * const value = new CreateBankAccountUseCase();
 * console.log(value);
 * ```
 */
export class CreateBankAccountUseCase {
	constructor(private readonly bankAccountRepository: BankAccountRepository) {}

	async execute(
		input: CreateBankAccountInput,
	): Promise<CreateBankAccountOutput> {
		try {
			const { organizationId, accountNumber } = input;

			// Validate organization ID
			if (!organizationId || organizationId <= 0) {
				return {
					success: false,
					error: "ID de organización inválido",
				};
			}

			// Check for duplicate account number
			const existing = await this.bankAccountRepository.findByAccountNumber(
				accountNumber,
				organizationId,
			);

			if (existing) {
				return {
					success: false,
					error: `Ya existe una cuenta con el número ${accountNumber}`,
				};
			}

			// Create the bank account entity
			const account = BankAccount.createNew({
				organizationId,
				bankName: input.bankName,
				accountNumber: input.accountNumber,
				accountType: input.accountType,
				currency: input.currency,
				initialBalance: input.initialBalance,
				accountingAccountId: input.accountingAccountId,
				cci: input.cci,
				swiftCode: input.swiftCode,
				notes: input.notes,
			});

			// Save to repository
			const saved = await this.bankAccountRepository.save(account);

			return {
				success: true,
				data: saved,
			};
		} catch (error) {
			console.error("CreateBankAccountUseCase error:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Error al crear cuenta bancaria",
			};
		}
	}
}
