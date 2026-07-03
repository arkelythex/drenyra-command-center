/**
 * Collector Step — Pull transactions and SUNAT data for the period.
 *
 * @module agents/fiscal-agent/collector.step
 */

import type {
	CollectOutput,
	FiscalAgentStep,
	FiscalAgentStepContext,
	ProcessableTransaction,
	StepResult,
} from "@arkelythex/application/use-cases/fiscal-agent/types";

import { createTaxAuthority } from "@arkelythex/infrastructure/tax-authority";

export class CollectorStep implements FiscalAgentStep<void, CollectOutput> {
	readonly name = "collect";

	async execute(
		_input: void,
		context: FiscalAgentStepContext,
	): Promise<StepResult<CollectOutput>> {
		const startedAt = new Date();
		const errors: StepResult<CollectOutput>["errors"] = [];
		const warnings: string[] = [];

		try {
			// 1. Pull transactions from local DB
			const transactions = await this.fetchLocalTransactions(context);

			// 2. Pull SIRE data from SUNAT
			let sireRecords: { period: string; totalRecords: number; discrepancies: number }[] = [];

			try {
				const taxAuthority = await createTaxAuthority(
					context.countryCode,
					context.organizationId,
				);
				if (taxAuthority) {
					const syncResult = await taxAuthority.fullRegisterSync(
						{
							taxId: "",
							period: context.period,
							registerType: "PURCHASES",
							countryCode: context.countryCode,
						},
						[],
					);
					sireRecords = [{
						period: context.period,
						totalRecords: syncResult.totalRecords ?? 0,
						discrepancies: syncResult.discrepancies?.length ?? 0,
					}];
				}
			} catch (err) {
				warnings.push(`SIRE sync failed: ${err instanceof Error ? err.message : "Unknown"}`);
			}

			const completedAt = new Date();
			return {
				success: true,
				data: { transactions, sireRecords },
				errors,
				warnings,
				metrics: {
					startedAt,
					completedAt,
					itemsProcessed: transactions.length,
					itemsFailed: 0,
				},
			};
		} catch (error) {
			const completedAt = new Date();
			return {
				success: false,
				errors: [{
					code: "COLLECT_FAILED",
					message: error instanceof Error ? error.message : "Collect step failed",
					retryable: true,
				}],
				warnings,
				metrics: {
					startedAt,
					completedAt,
					itemsProcessed: 0,
					itemsFailed: 1,
				},
			};
		}
	}

	private async fetchLocalTransactions(
		_context: FiscalAgentStepContext,
	): Promise<ProcessableTransaction[]> {
		// TODO: Implement actual DB query using companyId + period
		return [];
	}
}
