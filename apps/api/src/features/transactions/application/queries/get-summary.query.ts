/**
 * Get Summary by Type — Query
 *
 * Returns aggregated counts, totals, and IGV grouped by transaction type (income/expense).
 */

import type { TypeSummaryEntry } from "../../domain/transaction.entity";
import { transactionRepository } from "../../infrastructure/transaction.repository";

export async function getSummary(
	companyId: string,
): Promise<Record<string, TypeSummaryEntry>> {
	return transactionRepository.getSummaryByType(companyId);
}
