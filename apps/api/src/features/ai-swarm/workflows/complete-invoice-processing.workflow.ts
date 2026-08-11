/**
 * Complete Invoice Processing Workflow
 *
 * Full end-to-end workflow using multiple agents in parallel:
 * 1. OCR: Extract data from PDF/image
 * 2. SUNAT: Validate against regulations (parallel)
 * 3. PCGE: Classify into accounting entries (parallel)
 * 4. Evidence: Store document for audit trail
 *
 * @module ai-swarm/workflows
 */

import { createLogger } from "../../../lib/logger";
import { EvidenceAgent, type EvidenceMetadata } from "../agents/evidence.agent";
import { OCRAgent } from "../agents/ocr.agent";
import { PCGEAgent } from "../agents/pcge.agent";
import { SUNATAgent } from "../agents/sunat.agent";
import type {
	InvoiceData,
	PCGEClassification,
	TaskPriority,
	ValidationResult,
} from "../config/types";
import { OrchestratorService } from "../orchestrator/orchestrator.service";

const logger = createLogger({
	module: "ai-swarm/complete-invoice-processing-workflow",
});

/**
 * Workflow input
 * @example
 * ```ts
 * const value: CompleteProcessingInput = {} as CompleteProcessingInput;
 * console.log(value);
 * ```
 */

export interface CompleteProcessingInput {
	documents: Array<{
		id: string;
		imageUrl: string;
		file?: Buffer;
		filename: string;
		mimeType: string;
	}>;
	priority?: TaskPriority;
}

/**
 * Per-document result
 * @example
 * ```ts
 * const value: DocumentResult = {} as DocumentResult;
 * console.log(value);
 * ```
 */

export interface DocumentResult {
	documentId: string;
	ocr: {
		success: boolean;
		data?: InvoiceData | undefined;
		error?: string | undefined;
		durationMs: number;
		costUsd: number;
	};
	sunat: {
		success: boolean;
		data?: ValidationResult | undefined;
		error?: string | undefined;
		durationMs: number;
		costUsd: number;
	};
	pcge: {
		success: boolean;
		data?: PCGEClassification[] | undefined;
		error?: string | undefined;
		durationMs: number;
		costUsd: number;
	};
	evidence: {
		success: boolean;
		data?: EvidenceMetadata | undefined;
		error?: string | undefined;
		durationMs: number;
	};
}

/**
 * Workflow output
 * @example
 * ```ts
 * const value: CompleteProcessingOutput = {} as CompleteProcessingOutput;
 * console.log(value);
 * ```
 */

export interface CompleteProcessingOutput {
	totalProcessed: number;
	totalSuccess: number;
	totalFailed: number;
	results: DocumentResult[];
	execution: {
		parallelized: boolean;
		batchSize: number;
		totalCostUsd: number;
		totalDurationMs: number;
		agentsUsed: string[];
	};
}

/**
 * Complete Invoice Processing Workflow
 *
 * Orchestrates full pipeline with multiple agents in parallel
 * @example
 * ```ts
 * const value = new CompleteInvoiceProcessingWorkflow();
 * console.log(value);
 * ```
 */

export class CompleteInvoiceProcessingWorkflow {
	private orchestrator: OrchestratorService;
	private ocrAgent: OCRAgent;
	private sunatAgent: SUNATAgent;
	private pcgeAgent: PCGEAgent;
	private evidenceAgent: EvidenceAgent;

	constructor() {
		this.orchestrator = new OrchestratorService();
		this.ocrAgent = new OCRAgent();
		this.sunatAgent = new SUNATAgent();
		this.pcgeAgent = new PCGEAgent();
		this.evidenceAgent = new EvidenceAgent();
	}

	/**
	 * Execute complete processing workflow
	 *
	 * Pipeline:
	 * 1. OCR: Extract invoice data (sequential - vision models are expensive)
	 * 2. SUNAT + PCGE: Validate and classify (PARALLEL)
	 * 3. Evidence: Store document (parallel)
	 *
	 * @param input - Documents to process
	 * @returns Complete processing results
	 */
	async execute(
		input: CompleteProcessingInput,
	): Promise<CompleteProcessingOutput> {
		const startTime = Date.now();

		// Step 1: Analyze task complexity
		const analysis = await this.orchestrator.analyzeTask({
			fileCount: input.documents.length,
			totalSizeBytes: 0,
			taskType: "INVOICE",
			priority: input.priority || "medium",
		});

		logger.info(
			{
				fileCount: input.documents.length,
				shouldParallelize: analysis.shouldParallelize,
				batchSize: analysis.batchSize,
				estimatedCost: analysis.estimatedCost,
				estimatedTime: analysis.estimatedTime,
				agentsRequired: analysis.agentsRequired,
			},
			"Analyzed complete invoice processing workload",
		);

		// Step 2: Execute workflow
		let results: DocumentResult[];

		if (analysis.shouldParallelize) {
			results = await this.executeParallel(input.documents, analysis.batchSize);
		} else {
			results = await this.executeSequential(input.documents);
		}

		// Step 3: Aggregate results
		const totalSuccess = results.filter(
			(r) => r.ocr.success && r.sunat.success && r.pcge.success,
		).length;
		const totalFailed = results.length - totalSuccess;
		const totalCostUsd = results.reduce(
			(sum, r) => sum + r.ocr.costUsd + r.sunat.costUsd + r.pcge.costUsd,
			0,
		);
		const totalDurationMs = Date.now() - startTime;

		return {
			totalProcessed: results.length,
			totalSuccess,
			totalFailed,
			results,
			execution: {
				parallelized: analysis.shouldParallelize,
				batchSize: analysis.batchSize,
				totalCostUsd,
				totalDurationMs,
				agentsUsed: ["ocr", "sunat", "pcge", "evidence"],
			},
		};
	}

	/**
	 * Execute workflow sequentially
	 */
	private async executeSequential(
		documents: CompleteProcessingInput["documents"],
	): Promise<DocumentResult[]> {
		const results: DocumentResult[] = [];

		for (const doc of documents) {
			const result = await this.processDocument(doc);
			results.push(result);
		}

		return results;
	}

	/**
	 * Execute workflow in parallel batches
	 */
	private async executeParallel(
		documents: CompleteProcessingInput["documents"],
		batchSize: number,
	): Promise<DocumentResult[]> {
		const results: DocumentResult[] = [];

		// Process in batches
		for (let i = 0; i < documents.length; i += batchSize) {
			const batch = documents.slice(i, i + batchSize);

			logger.info(
				{
					batchNumber: i / batchSize + 1,
					batchSize: batch.length,
					totalDocuments: documents.length,
				},
				"Processing complete invoice workflow batch",
			);

			// Process batch in parallel
			const batchResults = await Promise.all(
				batch.map((doc) => this.processDocument(doc)),
			);

			results.push(...batchResults);
		}

		return results;
	}

	/**
	 * Process single document through all agents
	 *
	 * Agent execution order:
	 * 1. OCR (must complete first)
	 * 2. SUNAT + PCGE (parallel after OCR)
	 * 3. Evidence (parallel)
	 */
	private async processDocument(
		doc: CompleteProcessingInput["documents"][0],
	): Promise<DocumentResult> {
		// Step 1: OCR - Extract invoice data
		const ocrResult = await this.ocrAgent.extractInvoice(doc.imageUrl, doc.id);

		// If OCR fails, skip remaining steps
		if (!ocrResult.success || !ocrResult.data) {
			return {
				documentId: doc.id,
				ocr: {
					success: false,
					error: ocrResult.error?.message,
					durationMs: ocrResult.metadata.durationMs,
					costUsd: ocrResult.metadata.costUsd,
				},
				sunat: { success: false, durationMs: 0, costUsd: 0 },
				pcge: { success: false, durationMs: 0, costUsd: 0 },
				evidence: { success: false, durationMs: 0 },
			};
		}

		const invoiceData = ocrResult.data;

		// Step 2: SUNAT + PCGE in parallel
		const [sunatResult, pcgeResult, evidenceResult] = await Promise.all([
			this.sunatAgent.validateInvoice(invoiceData),
			this.pcgeAgent.classifyInvoice(invoiceData),
			doc.file
				? this.evidenceAgent.storeEvidence(doc.file, {
						invoiceId: doc.id,
						documentType: "invoice",
						originalFilename: doc.filename,
						mimeType: doc.mimeType,
					})
				: Promise.resolve({
						success: true,
						data: undefined,
						metadata: {
							agentType: "evidence" as const,
							modelUsed: "none",
							tokensUsed: 0,
							costUsd: 0,
							durationMs: 0,
							timestamp: new Date(),
						},
					}),
		]);

		return {
			documentId: doc.id,
			ocr: {
				success: true,
				data: invoiceData,
				durationMs: ocrResult.metadata.durationMs,
				costUsd: ocrResult.metadata.costUsd,
			},
			sunat: {
				success: sunatResult.success,
				data: sunatResult.data,
				error: sunatResult.error?.message,
				durationMs: sunatResult.metadata.durationMs,
				costUsd: sunatResult.metadata.costUsd,
			},
			pcge: {
				success: pcgeResult.success,
				data: pcgeResult.data,
				error: pcgeResult.error?.message,
				durationMs: pcgeResult.metadata.durationMs,
				costUsd: pcgeResult.metadata.costUsd,
			},
			evidence: {
				success: evidenceResult.success,
				data: evidenceResult.data,
				error:
					"error" in evidenceResult ? evidenceResult.error?.message : undefined,
				durationMs: evidenceResult.metadata.durationMs,
			},
		};
	}
}
