/**
 * Get Transaction by ID — Query
 */

import type { TransactionWithPartner } from "../../domain/transaction.entity";
import { transactionRepository } from "../../infrastructure/transaction.repository";

export async function getTransaction(
	id: string,
	companyId: string,
): Promise<TransactionWithPartner | undefined> {
	return transactionRepository.findById(id, companyId);
}
