/**
 * FiscalNightlyRunUseCase — Orchestrates the 5-step fiscal agent pipeline.
 *
 * Steps: Collect → Categorize → Calculate → Reconcile → Report
 * Each step is independently retryable. Failures are logged and reported.
 *
 * @module use-cases/fiscal-agent/fiscal-nightly-run.use-case
 */

import {
	CalculatorStep,
	CategorizerStep,
	CollectorStep,
	LearnerStep,
	ReconcilerStep,
	ReporterStep,
} from "@drenyra/infrastructure/agents/fiscal-agent";
import type {
	CalculateOutput,
	CategorizeOutput,
	CollectOutput,
	CorrectionInput,
	FiscalAgentStepContext,
	FiscalNightlyRunReport,
	ReconcileOutput,
	ReportOutput,
	StepResult,
} from "./types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Fiscal Nightly Run Use Case.
 */
export class FiscalNightlyRunUseCase {
	async execute(params: {
		organizationId: number;
		companyId: string;
		period: string;
		countryCode: "PE" | "MX" | "CL" | "CO";
		userId?: string;
	}): Promise<FiscalNightlyRunReport> {
		const runId = crypto.randomUUID();
		const context: FiscalAgentStepContext = {
			organizationId: params.organizationId,
			companyId: params.companyId,
			countryCode: params.countryCode,
			period: params.period,
			runId,
			userId: params.userId ?? "system",
		};

		const startedAt = new Date();
		const stepResults: FiscalNightlyRunReport["steps"] = [];

		// Step 1: Collect
		const collect = await this.runStep(
			new CollectorStep(),
			undefined,
			context,
			stepResults,
		);

		// Step 2: Categorize
		const categorize = collect.success
			? await this.runStep(
					new CategorizerStep(),
					collect.data?.transactions ?? [],
					context,
					stepResults,
				)
			: ({ success: false } as StepResult<CategorizeOutput>);

		// Step 3: Calculate
		const calculate =
			categorize.success && collect.data
				? await this.runStep(
						new CalculatorStep(),
						{
							transactions: collect.data.transactions,
							categorizations: categorize.data?.categorizations ?? [],
						},
						context,
						stepResults,
					)
				: ({ success: false } as StepResult<CalculateOutput>);

		// Step 4: Reconcile
		const reconcile = collect.data
			? await this.runStep(
					new ReconcilerStep(),
					collect.data.transactions,
					context,
					stepResults,
				)
			: ({ success: false } as StepResult<ReconcileOutput>);

		// Step 5: Report
		const report = await this.runStep(
			new ReporterStep(),
			{
				collect: collect.data ?? { transactions: [], sireRecords: [] },
				categorize: categorize.data ?? { categorizations: [] },
				calculate: calculate.data ?? { calculations: [] },
				reconcile: reconcile.data ?? {
					discrepancies: [],
					matchedCount: 0,
					unmatchedLocalCount: 0,
					unmatchedSunatCount: 0,
				},
			},
			context,
			stepResults,
		);

		const completedAt = new Date();
		const allSuccess = stepResults.every((s) => s.success);

		return {
			runId,
			organizationId: params.organizationId,
			companyId: params.companyId,
			period: params.period,
			status: allSuccess
				? "SUCCESS"
				: stepResults.some((s) => s.success)
					? "PARTIAL"
					: "FAILED",
			steps: stepResults,
			summary: report.data?.summary ?? {
				totalTransactions: 0,
				categorized: 0,
				exceptions: 0,
				discrepancies: 0,
				completedSteps: [],
				failedSteps: [],
				durationMs: completedAt.getTime() - startedAt.getTime(),
			},
			createdAt: completedAt,
		};
	}

	private async runStep<TInput, TOutput>(
		step: {
			readonly name: string;
			execute(
				input: TInput,
				context: FiscalAgentStepContext,
			): Promise<StepResult<TOutput>>;
		},
		input: TInput,
		context: FiscalAgentStepContext,
		results: FiscalNightlyRunReport["steps"],
	): Promise<StepResult<TOutput>> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				const result = await step.execute(input, context);
				results.push({
					name: step.name,
					success: result.success,
					metrics: result.metrics,
					errors: result.errors,
				});
				return result;
			} catch (err) {
				lastError = err instanceof Error ? err : new Error(String(err));
				if (attempt < MAX_RETRIES) {
					await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
				}
			}
		}

		const failed: StepResult<TOutput> = {
			success: false,
			errors: [
				{
					code: "STEP_FAILED",
					message: lastError?.message ?? "Step failed after retries",
					retryable: false,
				},
			],
			warnings: [],
			metrics: {
				startedAt: new Date(),
				completedAt: new Date(),
				itemsProcessed: 0,
				itemsFailed: 1,
			},
		};
		results.push({
			name: step.name,
			success: false,
			metrics: failed.metrics,
			errors: failed.errors,
		});
		return failed;
	}
}

/**
 * CorrectionUseCase — Process user-submitted corrections.
 */
export class CorrectionUseCase {
	async execute(
		corrections: CorrectionInput[],
	): Promise<{ applied: number; failed: number }> {
		const learner = new LearnerStep();
		const result = await learner.execute(corrections, {
			organizationId: 0,
			companyId: "",
			countryCode: "PE",
			period: "",
			runId: crypto.randomUUID(),
			userId: corrections[0]?.userId ?? "unknown",
		});

		const applied = result.data?.filter((r) => r.applied).length ?? 0;
		return { applied, failed: corrections.length - applied };
	}
}
