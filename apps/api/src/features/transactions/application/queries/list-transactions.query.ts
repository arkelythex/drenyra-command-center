/**
 * List Transactions — Query
 *
 * Returns transactions filtered at DB level (no in-memory filtering).
 */

import type {
	TransactionFilters,
	TransactionWithPartner,
} from "../../domain/transaction.entity";
import { transactionRepository } from "../../infrastructure/transaction.repository";

export async function listTransactions(
	filters: TransactionFilters,
): Promise<TransactionWithPartner[]> {
	return transactionRepository.list(filters);
}
