import { Money } from "@drenyra/domain";
import type { Currency } from "@drenyra/domain/value-objects/Money";
import type { BankTransactionType } from "@drenyra/domain/value-objects/TransactionType";
import { SecureLogger } from "@drenyra/shared/secure-logger";
import type { CreateTransactionDTO } from "../../../../types/banking.types";
import type { BankTransactionRecord } from "../../infrastructure/banking.repository";
import { bankingRepository } from "../../infrastructure/banking.repository";

/**
 * Input payload for bulk transaction import (normalized from external sources).
 *
 * @example
 * ```ts
 * const row: ImportTransactionInput = { date: new Date(), description: 'DEPÓSITO', amount: 10, type: 'CREDIT' };
 * ```
 */
export interface ImportTransactionInput {
	date: Date;
	description: string;
	amount: number;
	type: BankTransactionType;
	reference?: string;
}

/**
 * Application service for managing bank transactions.
 *
 * @deprecated Use CQRS handlers instead:
 * - Write ops: {@link RecordTransactionHandler}, {@link ReconcileTransactionHandler}, {@link ImportTransactionsHandler}
 * - Read ops: {@link GetTransactionsQuery} (coming in next iteration)
 * This service will be removed in a future version.
 *
 * @example
 * ```ts
 * const service = new TransactionService();
 * await service.listTransactions('acc_123');
 * ```
 */
export class TransactionService {
	private readonly logger = SecureLogger.namespace("TransactionService");

	constructor(private readonly repository = bankingRepository) {}

	async listTransactions(accountId: string, startDate?: Date, endDate?: Date) {
		return this.repository.findTransactions(accountId, {
			...(startDate !== undefined ? { startDate } : {}),
			...(endDate !== undefined ? { endDate } : {}),
		});
	}

	async createTransaction(companyId: string, data: CreateTransactionDTO) {
		const account = await this.repository.findAccountById(data.accountId);
		if (!account) throw new Error("Account not found");

		const currency = toCurrency(account.currency);
		const currentBalance = Money.fromAmount(
			Number(account.currentBalance),
			currency,
		);
		const delta = Money.fromAmount(data.amount, currency);
		const newBalance =
			data.type === "CREDIT"
				? currentBalance.add(delta)
				: currentBalance.subtract(delta);
		const formattedDate = formatDateLocal(data.transactionDate);
		const balanceValue = newBalance.getAmount().toFixed(2);

		const transactionInput: Omit<BankTransactionRecord, "id" | "createdAt"> = {
			companyId,
			accountId: data.accountId,
			transactionDate: formattedDate,
			description: data.description,
			reference: data.reference ?? null,
			type: data.type,
			amount: data.amount.toString(),
			balance: balanceValue,
			category: data.category ?? null,
			tags: data.tags ? JSON.stringify(data.tags) : null,
			isReconciled: false,
			reconciledAt: null,
			reconciledBy: null,
			invoiceId: null,
			billId: null,
			importedFrom: "MANUAL",
		};
		const transaction =
			await this.repository.createTransaction(transactionInput);

		await this.repository.updateAccount(account.id, {
			currentBalance: balanceValue,
		});

		return transaction;
	}

	async reconcileTransaction(
		transactionId: string,
		userId: string,
		documentId?: string,
		documentType?: "INVOICE" | "BILL",
	) {
		await this.repository.reconcileTransaction(
			transactionId,
			userId,
			documentId,
			documentType,
		);
	}

	async importTransactions(
		companyId: string,
		accountId: string,
		transactions: ImportTransactionInput[],
	) {
		let imported = 0;

		for (const tx of transactions) {
			try {
				await this.createTransaction(companyId, {
					accountId,
					transactionDate: tx.date,
					description: tx.description,
					...(tx.reference !== undefined ? { reference: tx.reference } : {}),
					type: tx.type,
					amount: tx.amount,
				});
				imported += 1;
			} catch (error) {
				this.logger.error("Failed to import transaction", { error });
			}
		}

		return imported;
	}
}

function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function toCurrency(value: string | null | undefined): Currency {
	return value === "USD" ? "USD" : "PEN";
}
