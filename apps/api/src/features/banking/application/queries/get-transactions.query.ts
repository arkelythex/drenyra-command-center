import type { TransactionFilters } from "../../domain/types";
import type { BankTransactionRecord } from "../../infrastructure/banking.repository";
import { bankingRepository } from "../../infrastructure/banking.repository";

export interface GetTransactionsInput {
	accountId: string;
	startDate?: Date;
	endDate?: Date;
	isReconciled?: boolean;
	limit?: number;
	offset?: number;
}

export async function getTransactions(
	input: GetTransactionsInput,
): Promise<BankTransactionRecord[]> {
	const filters: TransactionFilters = {
		startDate: input.startDate,
		endDate: input.endDate,
		isReconciled: input.isReconciled,
		limit: input.limit ?? 100,
		offset: input.offset ?? 0,
	};

	return bankingRepository.findTransactions(input.accountId, filters);
}
