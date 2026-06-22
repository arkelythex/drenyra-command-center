import type {
	CreateAccountDTO,
	CreateTransactionDTO,
} from "../../../../types/banking.types";
import type { ImportRow } from "../commands/import-transactions.command";
import { importTransactions } from "../commands/import-transactions.command";
import { reconcileTransaction } from "../commands/reconcile-transaction.command";
import { recordTransaction } from "../commands/record-transaction.command";
import { getBankingSummary } from "../queries/get-banking-summary.query";
import { getTransactions } from "../queries/get-transactions.query";
import { AccountService } from "./account.service";
import { ReconciliationService } from "./reconciliation.service";

export class BankingApplicationService {
	constructor(
		private readonly accountService: Pick<
			AccountService,
			| "listAccounts"
			| "getAccount"
			| "createAccount"
			| "updateAccount"
			| "deleteAccount"
			| "getBalance"
		> = new AccountService(),
		private readonly reconciliation: Pick<
			ReconciliationService,
			"autoReconcile"
		> = new ReconciliationService(),
	) {}

	async listAccounts(companyId: string) {
		return this.accountService.listAccounts(companyId);
	}

	async getAccount(id: string) {
		return this.accountService.getAccount(id);
	}

	async createAccount(companyId: string, data: CreateAccountDTO) {
		return this.accountService.createAccount(companyId, data);
	}

	async updateAccount(id: string, data: Partial<CreateAccountDTO>) {
		await this.accountService.updateAccount(id, data);
	}

	async deleteAccount(id: string) {
		await this.accountService.deleteAccount(id);
	}

	async getBalance(accountId: string) {
		return this.accountService.getBalance(accountId);
	}

	async listTransactions(accountId: string, startDate?: Date, endDate?: Date) {
		return getTransactions({ accountId, startDate, endDate });
	}

	async createTransaction(companyId: string, data: CreateTransactionDTO) {
		const result = await recordTransaction({
			companyId,
			accountId: data.accountId,
			transactionDate: data.transactionDate,
			description: data.description,
			reference: data.reference,
			type: data.type,
			amount: data.amount,
			category: data.category,
			tags: data.tags,
		});
		return { id: result.transactionId, balance: result.newBalance };
	}

	async reconcileTransaction(
		transactionId: string,
		userId: string,
		documentId?: string,
		documentType?: "INVOICE" | "BILL",
	) {
		await reconcileTransaction({
			transactionId,
			userId,
			documentId,
			documentType,
		});
	}

	async getSummary(companyId: string) {
		return getBankingSummary({ companyId });
	}

	async importTransactions(
		companyId: string,
		accountId: string,
		transactions: ImportRow[],
	) {
		return importTransactions({
			companyId,
			accountId,
			source: "CSV",
			transactions,
		});
	}

	async autoReconcile(companyId: string, accountId: string) {
		return this.reconciliation.autoReconcile(companyId, accountId);
	}
}
