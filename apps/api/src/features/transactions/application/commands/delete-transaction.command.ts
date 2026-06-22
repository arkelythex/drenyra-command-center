/**
 * Delete Transaction — Command
 */

import { transactionRepository } from "../../infrastructure/transaction.repository";

export async function deleteTransaction(
	id: string,
	companyId: string,
): Promise<{ message: string }> {
	const deleted = await transactionRepository.delete(id, companyId);
	if (!deleted) throw new Error("Transaction not found");
	return { message: "Transaction deleted" };
}
