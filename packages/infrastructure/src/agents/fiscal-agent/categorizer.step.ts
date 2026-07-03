/**
 * Categorizer Step — Classify transactions using PCGE chart of accounts.
 */

import type {
	CategorizeOutput,
	FiscalAgentStep,
	FiscalAgentStepContext,
	ProcessableTransaction,
	StepResult,
	TransactionCategorization,
} from "@arkelythex/application/use-cases/fiscal-agent/types";

export class CategorizerStep implements FiscalAgentStep<ProcessableTransaction[], CategorizeOutput> {
	readonly name = "categorize";

	async execute(
		transactions: ProcessableTransaction[],
		context: FiscalAgentStepContext,
	): Promise<StepResult<CategorizeOutput>> {
		const startedAt = new Date();
		const errors: StepResult<CategorizeOutput>["errors"] = [];
		const warnings: string[] = [];
		const categorizations: TransactionCategorization[] = [];

		for (const tx of transactions) {
			try {
				const result = await this.categorizeOne(tx, context);
				categorizations.push(result);
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
			warnings,
			metrics: {
				startedAt,
				completedAt,
				itemsProcessed: transactions.length,
				itemsFailed: errors.length,
			},
		};
	}

	private async categorizeOne(
		tx: ProcessableTransaction,
		_context: FiscalAgentStepContext,
	): Promise<TransactionCategorization> {
		// TODO: Integrate with PCGE agent for AI-powered categorization
		// Use: vendor-name → account mapping from corrections history
		// Use: description pattern matching
		const isException = false;
		return {
			transactionId: tx.id,
			suggestedAccount: "7011.11",
			suggestedAccountName: "Servicios",
			confidence: 0.95,
			isException,
		};
	}
}
