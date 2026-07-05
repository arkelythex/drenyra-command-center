import type { CreateAccountDTO } from "../../../../types/banking.types";
import type { BankAccountRecord } from "../../infrastructure/banking.repository";
import { bankingRepository } from "../../infrastructure/banking.repository";

/**
 * Application service for managing bank accounts.
 *
 * @example
 * ```ts
 * const service = new AccountService();
 * await service.listAccounts('cmp_123');
 * ```
 */
export class AccountService {
	constructor(private readonly repository = bankingRepository) {}

	async listAccounts(companyId: string) {
		return this.repository.findAllAccounts(companyId);
	}

	async getAccount(id: string) {
		return this.repository.findAccountById(id);
	}

	async createAccount(companyId: string, data: CreateAccountDTO) {
		const currentBalance = data.currentBalance?.toString() ?? "0";
		const currency = data.currency ?? "PEN";

		return this.repository.createAccount({
			companyId,
			accountName: data.accountName,
			accountNumber: data.accountNumber,
			accountType: data.accountType,
			bankName: data.bankName,
			bankCode: data.bankCode ?? null,
			branch: data.branch ?? null,
			currency,
			currentBalance,
			availableBalance: currentBalance,
			isActive: true,
			isDefault: false,
		});
	}

	async updateAccount(id: string, data: Partial<CreateAccountDTO>) {
		const update: Partial<BankAccountRecord> = {
			accountName: data.accountName,
			accountNumber: data.accountNumber,
			accountType: data.accountType,
			bankName: data.bankName,
			bankCode: data.bankCode ?? undefined,
			branch: data.branch ?? undefined,
			currency: data.currency ?? undefined,
			currentBalance:
				data.currentBalance !== undefined
					? data.currentBalance.toString()
					: undefined,
		};
		await this.repository.updateAccount(id, update);
	}

	async deleteAccount(id: string) {
		await this.repository.softDeleteAccount(id);
	}

	async getBalance(accountId: string) {
		const account = await this.repository.findAccountById(accountId);
		if (!account) throw new Error("Account not found");

		return {
			current: account.currentBalance,
			available: account.availableBalance ?? account.currentBalance,
		};
	}
}
