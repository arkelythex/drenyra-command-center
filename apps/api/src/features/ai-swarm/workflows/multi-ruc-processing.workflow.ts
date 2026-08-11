/**
 * Multi-RUC Processing Workflow
 *
 * Processes invoices for multiple companies (RUCs) in parallel.
 * Killer feature for accounting firms managing multiple clients.
 *
 * @module ai-swarm/workflows
 */

import { createLogger } from "../../../lib/logger";
import type { TaskPriority } from "../config/types";
import type {
	CompleteProcessingInput,
	CompleteProcessingOutput,
} from "./complete-invoice-processing.workflow";
import { CompleteInvoiceProcessingWorkflow } from "./complete-invoice-processing.workflow";

const logger = createLogger({ module: "ai-swarm/multi-ruc-workflow" });

function maskRuc(ruc: string): string {
	if (ruc.length <= 4) return "***";
	return `${"*".repeat(Math.max(0, ruc.length - 4))}${ruc.slice(-4)}`;
}

/**
 * Multi-RUC input
 * @example
 * ```ts
 * const value: MultiRucInput = {} as MultiRucInput;
 * console.log(value);
 * ```
 */

export interface MultiRucInput {
	companies: Array<{
		ruc: string;
		companyName: string;
		documents: CompleteProcessingInput["documents"];
	}>;
	priority?: TaskPriority;
}

/**
 * Multi-RUC output
 * @example
 * ```ts
 * const value: MultiRucOutput = {} as MultiRucOutput;
 * console.log(value);
 * ```
 */

export interface MultiRucOutput {
	totalCompanies: number;
	totalDocuments: number;
	successfulCompanies: number;
	failedCompanies: number;
	results: Array<{
		ruc: string;
		companyName: string;
		processing: CompleteProcessingOutput;
	}>;
	execution: {
		parallelized: boolean;
		totalCostUsd: number;
		totalDurationMs: number;
		averageCostPerCompany: number;
		averageTimePerCompany: number;
	};
}

/**
 * Multi-RUC Processing Workflow
 *
 * Processes multiple companies in parallel
 * @example
 * ```ts
 * const value = new MultiRucProcessingWorkflow();
 * console.log(value);
 * ```
 */

export class MultiRucProcessingWorkflow {
	private processingWorkflow: CompleteInvoiceProcessingWorkflow;

	constructor() {
		this.processingWorkflow = new CompleteInvoiceProcessingWorkflow();
	}

	/**
	 * Execute multi-RUC processing
	 *
	 * Strategy:
	 * - Always process companies in PARALLEL (each RUC is independent)
	 * - Each company's documents follow their own parallelization strategy
	 *
	 * Example: 10 companies with 5 docs each
	 * → 10 parallel company processes
	 * → Each company processes 5 docs sequentially (< 5 threshold)
	 *
	 * @param input - Companies to process
	 * @returns Multi-RUC results
	 */
	async execute(input: MultiRucInput): Promise<MultiRucOutput> {
		const startTime = Date.now();

		logger.info(
			{
				companyCount: input.companies.length,
				priority: input.priority ?? "medium",
			},
			"Processing multiple companies in parallel",
		);

		// Step 1: Analyze overall complexity
		const totalDocuments = input.companies.reduce(
			(sum, company) => sum + company.documents.length,
			0,
		);

		logger.info(
			{ totalDocuments },
			"Calculated total documents for multi-RUC workflow",
		);

		// Step 2: Process all companies in parallel
		const results = await Promise.all(
			input.companies.map(async (company) => {
				logger.info(
					{
						companyName: company.companyName,
						companyRucMasked: maskRuc(company.ruc),
						documentCount: company.documents.length,
					},
					"Processing company in multi-RUC workflow",
				);

				const processing = await this.processingWorkflow.execute({
					documents: company.documents,
					...(input.priority !== undefined ? { priority: input.priority } : {}),
				});

				return {
					ruc: company.ruc,
					companyName: company.companyName,
					processing,
				};
			}),
		);

		// Step 3: Aggregate results
		const successfulCompanies = results.filter(
			(r) => r.processing.totalSuccess > 0,
		).length;
		const failedCompanies = results.length - successfulCompanies;
		const totalCostUsd = results.reduce(
			(sum, r) => sum + r.processing.execution.totalCostUsd,
			0,
		);
		const totalDurationMs = Date.now() - startTime;

		return {
			totalCompanies: input.companies.length,
			totalDocuments,
			successfulCompanies,
			failedCompanies,
			results,
			execution: {
				parallelized: true,
				totalCostUsd,
				totalDurationMs,
				averageCostPerCompany: totalCostUsd / input.companies.length,
				averageTimePerCompany: totalDurationMs / input.companies.length,
			},
		};
	}

	/**
	 * Generate summary report for accounting firm
	 */
	generateReport(output: MultiRucOutput): {
		summary: string;
		statistics: {
			totalInvoicesProcessed: number;
			totalCost: number;
			averageCostPerInvoice: number;
			processingTime: string;
			successRate: number;
		};
		byCompany: Array<{
			ruc: string;
			companyName: string;
			invoices: number;
			cost: number;
			time: number;
			successRate: number;
		}>;
	} {
		const totalInvoicesProcessed = output.totalDocuments;
		const averageCostPerInvoice =
			output.execution.totalCostUsd / totalInvoicesProcessed;
		const processingTime = `${(output.execution.totalDurationMs / 1000).toFixed(2)}s`;
		const successRate = output.successfulCompanies / output.totalCompanies;

		const summary = `
Procesamiento Multi-RUC completado:
- Empresas procesadas: ${output.totalCompanies}
- Facturas totales: ${totalInvoicesProcessed}
- Costo total: $${output.execution.totalCostUsd.toFixed(4)}
- Tiempo total: ${processingTime}
- Tasa de éxito: ${(successRate * 100).toFixed(1)}%
    `.trim();

		const byCompany = output.results.map((r) => ({
			ruc: r.ruc,
			companyName: r.companyName,
			invoices: r.processing.totalProcessed,
			cost: r.processing.execution.totalCostUsd,
			time: r.processing.execution.totalDurationMs,
			successRate: r.processing.totalSuccess / r.processing.totalProcessed,
		}));

		return {
			summary,
			statistics: {
				totalInvoicesProcessed,
				totalCost: output.execution.totalCostUsd,
				averageCostPerInvoice,
				processingTime,
				successRate,
			},
			byCompany,
		};
	}
}
