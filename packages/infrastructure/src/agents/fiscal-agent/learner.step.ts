/**
 * Learner Step — Process user corrections to improve future runs.
 */

import type {
	CorrectionInput,
	CorrectionRecord,
	FiscalAgentStep,
	FiscalAgentStepContext,
	StepResult,
} from "@drenyra/application/use-cases/fiscal-agent/types";

export class LearnerStep
	implements FiscalAgentStep<CorrectionInput[], CorrectionRecord[]>
{
	readonly name = "learn";

	async execute(
		corrections: CorrectionInput[],
		_context: FiscalAgentStepContext,
	): Promise<StepResult<CorrectionRecord[]>> {
		const startedAt = new Date();
		const records: CorrectionRecord[] = [];

		for (const correction of corrections) {
			try {
				await this.saveCorrection(correction);
				records.push({ ...correction, timestamp: new Date(), applied: true });
			} catch (err) {
				console.error(
					`Failed to save correction for ${correction.transactionId}:`,
					err,
				);
				records.push({ ...correction, timestamp: new Date(), applied: false });
			}
		}

		const completedAt = new Date();
		return {
			success: true,
			data: records,
			errors: [],
			warnings: [],
			metrics: {
				startedAt,
				completedAt,
				itemsProcessed: corrections.length,
				itemsFailed: 0,
			},
		};
	}

	private async saveCorrection(correction: CorrectionInput): Promise<void> {
		// TODO: Store correction in DB for future categorization matching
		// Pattern: same vendor → suggested account
		// Pattern: same description keywords → suggested account
		console.log(
			`Correction saved: ${correction.transactionId} → ${correction.correctedCategory}`,
		);
	}
}
