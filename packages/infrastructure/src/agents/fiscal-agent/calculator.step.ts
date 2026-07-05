/**
 * Calculator Step — Calculate IGV, detracciones, retenciones using TaxRegime.
 */

import type {
	CalculateOutput,
	FiscalAgentStep,
	FiscalAgentStepContext,
	ProcessableTransaction,
	StepResult,
	TaxCalculation,
	TransactionCategorization,
} from "@drenyra/application/use-cases/fiscal-agent/types";
import type { Money } from "@drenyra/domain";
import { PeruGeneralRegime } from "@drenyra/domain/services/tax-regime/peru";

export class CalculatorStep
	implements
		FiscalAgentStep<
			{
				transactions: ProcessableTransaction[];
				categorizations: TransactionCategorization[];
			},
			CalculateOutput
		>
{
	readonly name = "calculate";
	private regime = new PeruGeneralRegime();

	async execute(
		input: {
			transactions: ProcessableTransaction[];
			categorizations: TransactionCategorization[];
		},
		_context: FiscalAgentStepContext,
	): Promise<StepResult<CalculateOutput>> {
		const startedAt = new Date();
		const errors: StepResult<CalculateOutput>["errors"] = [];
		const calculations: TaxCalculation[] = [];

		for (const tx of input.transactions) {
			try {
				const calc = this.calculateOne(tx);
				calculations.push(calc);
			} catch (err) {
				errors.push({
					code: "CALCULATE_FAILED",
					message: `Failed to calculate tax for ${tx.id}: ${err instanceof Error ? err.message : "Unknown"}`,
					itemId: tx.id,
					retryable: false,
				});
			}
		}

		const completedAt = new Date();
		return {
			success: errors.length === 0,
			data: { calculations },
			errors,
			warnings: [],
			metrics: {
				startedAt,
				completedAt,
				itemsProcessed: input.transactions.length,
				itemsFailed: errors.length,
			},
		};
	}

	private calculateOne(tx: ProcessableTransaction): TaxCalculation {
		const result = this.regime.calculateIGV(tx.amount);
		return {
			transactionId: tx.id,
			taxType: "IGV",
			taxRate: 0.18,
			taxAmount: result.taxAmount,
			baseAmount: result.baseAmount,
			totalAmount: result.totalAmount,
			anomalies: [],
		};
	}
}
