/**
 * Categorizer Step — Classify transactions using PCGE chart of accounts.
 * Uses real PCGE catalog with keyword matching. Scalable: add ML later.
 */

import { findBestAccount } from "@drenyra/domain/services/pcge-catalog";
import type {
	CategorizeOutput,
	FiscalAgentStep,
	FiscalAgentStepContext,
	ProcessableTransaction,
	StepResult,
	TransactionCategorization,
} from "@drenyra/application/use-cases/fiscal-agent/types";

export class CategorizerStep
	implements FiscalAgentStep<ProcessableTransaction[], CategorizeOutput>
{
	readonly name = "categorize";

	async execute(
		transactions: ProcessableTransaction[],
		_context: FiscalAgentStepContext,
	): Promise<StepResult<CategorizeOutput>> {
		const startedAt = new Date();
		const errors: StepResult<CategorizeOutput>["errors"] = [];
		const categorizations: TransactionCategorization[] = [];

		for (const tx of transactions) {
			try {
				const { account, confidence } = findBestAccount(
					tx.description,
					tx.vendorName,
				);
				categorizations.push({
					transactionId: tx.id,
					suggestedAccount: account.code,
					suggestedAccountName: account.name,
					confidence: confidence / 100,
					isException: confidence < 50,
				});
			} catch (err) {
				errors.push({
					code: "CATEGORIZE_FAILED",
					message: `Failed to categorize ${tx.id}: ${err instanceof Error ? err.message : "Unknown"}`,
					itemId: tx.id,
					retryable: true,
				});
			}
		}

		const completedAt = new Date();
		return {
			success: errors.length === 0,
			data: { categorizations },
			errors,
			warnings: [],
			metrics: {
				startedAt,
				completedAt,
				itemsProcessed: transactions.length,
				itemsFailed: errors.length,
			},
		};
	}
}
