/**
 * Invoice Validation Workflow
 *
 * Simple workflow for Phase 1 POC:
 * 1. Analyze task complexity
 * 2. Validate invoice with SUNAT agent
 * 3. Return results
 *
 * Future phases will add:
 * - OCR extraction
 * - PCGE classification
 * - Reconciliation
 * - Evidence storage
 *
 * @module ai-swarm/workflows
 */

import { createLogger } from "../../../lib/logger";
import { SUNATAgent } from "../agents/sunat.agent";
import type {
	AgentResult,
	InvoiceData,
	TaskPriority,
	ValidationResult,
} from "../config/types";
import { OrchestratorService } from "../orchestrator/orchestrator.service";

const logger = createLogger({ module: "ai-swarm/invoice-validation-workflow" });

/**
 * Workflow input
 * @example
 * ```ts
 * const value: InvoiceValidationInput = {} as InvoiceValidationInput;
 * console.log(value);
 * ```
 */

export interface InvoiceValidationInput {
	invoices: InvoiceData[];
	priority?: TaskPriority;
}

/**
 * Workflow output
 * @example
 * ```ts
 * const value: InvoiceValidationOutput = {} as InvoiceValidationOutput;
 * console.log(value);
 * ```
 */

export interface InvoiceValidationOutput {
	totalProcessed: number;
	totalValid: number;
	totalInvalid: number;
	results: Array<{
		invoiceId: string;
		validation: ValidationResult;
		metadata: AgentResult<ValidationResult>["metadata"];
	}>;
	execution: {
		parallelized: boolean;
		batchSize: number;
		totalCostUsd: number;
		totalDurationMs: number;
	};
}

/**
 * Invoice Validation Workflow
 *
 * Orchestrates the validation of one or more invoices
 * @example
 * ```ts
 * const value = new InvoiceValidationWorkflow();
 * console.log(value);
 * ```
 */

export class InvoiceValidationWorkflow {
	private orchestrator: OrchestratorService;
	private sunatAgent: SUNATAgent;

	constructor() {
		this.orchestrator = new OrchestratorService();
		this.sunatAgent = new SUNATAgent();
	}

	/**
	 * Execute invoice validation workflow
	 *
	 * @param input - Invoices to validate
	 * @returns Validation results with execution metadata
	 */
	async execute(
		input: InvoiceValidationInput,
	): Promise<InvoiceValidationOutput> {
		const startTime = Date.now();

		// Step 1: Analyze task complexity
		const analysis = await this.orchestrator.analyzeTask({
			fileCount: input.invoices.length,
			totalSizeBytes: 0, // Not relevant for POC
			taskType: "INVOICE",
			priority: input.priority || "medium",
		});

		logger.info(
			{
				fileCount: input.invoices.length,
				shouldParallelize: analysis.shouldParallelize,
				batchSize: analysis.batchSize,
				estimatedCost: analysis.estimatedCost,
				estimatedTime: analysis.estimatedTime,
			},
			"Analyzed invoice validation workload",
		);

		// Step 2: Execute validation (parallel or sequential)
		let results: Array<{
			invoiceId: string;
			validation: ValidationResult;
			metadata: AgentResult<ValidationResult>["metadata"];
		}>;

		if (analysis.shouldParallelize) {
			results = await this.executeParallel(input.invoices, analysis.batchSize);
		} else {
			results = await this.executeSequential(input.invoices);
		}

		// Step 3: Aggregate results
		const totalValid = results.filter((r) => r.validation.isValid).length;
		const totalInvalid = results.length - totalValid;
		const totalCostUsd = results.reduce(
			(sum, r) => sum + r.metadata.costUsd,
			0,
		);
		const totalDurationMs = Date.now() - startTime;

		return {
			totalProcessed: results.length,
			totalValid,
			totalInvalid,
			results,
			execution: {
				parallelized: analysis.shouldParallelize,
				batchSize: analysis.batchSize,
				totalCostUsd,
				totalDurationMs,
			},
		};
	}

	/**
	 * Execute validations sequentially
	 */
	private async executeSequential(
		invoices: InvoiceData[],
	): Promise<InvoiceValidationOutput["results"]> {
		const results: InvoiceValidationOutput["results"] = [];

		for (const invoice of invoices) {
			const result = await this.sunatAgent.validateInvoice(invoice);

			if (result.success && result.data) {
				results.push({
					invoiceId: invoice.id,
					validation: result.data,
					metadata: result.metadata,
				});
			} else {
				// Handle error case
				results.push({
					invoiceId: invoice.id,
					validation: {
						isValid: false,
						errors: [
							{
								field: "system",
								code: "VALIDATION_FAILED",
								message: result.error?.message || "Unknown error",
								severity: "critical",
							},
						],
						warnings: [],
						confidence: 0,
					},
					metadata: result.metadata,
				});
			}
		}

		return results;
	}

	/**
	 * Execute validations in parallel batches
	 */
	private async executeParallel(
		invoices: InvoiceData[],
		batchSize: number,
	): Promise<InvoiceValidationOutput["results"]> {
		const results: InvoiceValidationOutput["results"] = [];

		// Split into batches
		for (let i = 0; i < invoices.length; i += batchSize) {
			const batch = invoices.slice(i, i + batchSize);

			logger.info(
				{
					batchNumber: i / batchSize + 1,
					batchSize: batch.length,
					totalInvoices: invoices.length,
				},
				"Processing invoice validation batch",
			);

			// Process batch in parallel
			const batchResults = await Promise.all(
				batch.map(async (invoice) => {
					const result = await this.sunatAgent.validateInvoice(invoice);

					if (result.success && result.data) {
						return {
							invoiceId: invoice.id,
							validation: result.data,
							metadata: result.metadata,
						};
					} else {
						return {
							invoiceId: invoice.id,
							validation: {
								isValid: false,
								errors: [
									{
										field: "system",
										code: "VALIDATION_FAILED",
										message: result.error?.message || "Unknown error",
										severity: "critical" as const,
									},
								],
								warnings: [],
								confidence: 0,
							},
							metadata: result.metadata,
						};
					}
				}),
			);

			results.push(...batchResults);
		}

		return results;
	}
}
