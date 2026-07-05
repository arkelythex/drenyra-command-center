/**
 * Workflow Orchestrator
 * Central coordinator for multi-agent invoice processing
 *
 * Flow:
 * 1. Receive invoice (image/PDF/XML)
 * 2. Execute agents in parallel (Reader, Parser, Validator)
 * 3. Detect conflicts
 * 4. Arbitrate if needed
 * 5. Generate final XML
 * 6. Send to OSE
 * 7. Store CDR
 */

import { randomUUID } from "crypto";
import { loggers } from "../../logger";
import type {
	ArbitratorAgent,
	ParserAgent,
	ReaderAgent,
	ValidatorAgent,
} from "../agents";
import type {
	Conflict,
	ExtractedData,
	InvoiceData,
	ParsedInvoice,
	ProcessedInvoice,
	ProcessingLog,
	ReaderInput,
	StageLog,
	ValidationResult,
	WorkflowContext,
} from "../types";
import { EventBus } from "./event.bus";

/**
 * WorkflowOrchestrator class.
 *
 * @example
 * ```ts
 * const value = new WorkflowOrchestrator();
 * console.log(value);
 * ```
 */
export class WorkflowOrchestrator {
	private eventBus: EventBus;
	private activeProcesses: Map<string, WorkflowContext>;

	// Agents
	private readerAgent: ReaderAgent;
	private parserAgent: ParserAgent;
	private validatorAgent: ValidatorAgent;
	private arbitratorAgent: ArbitratorAgent;

	constructor(
		readerAgent: ReaderAgent,
		parserAgent: ParserAgent,
		validatorAgent: ValidatorAgent,
		arbitratorAgent: ArbitratorAgent,
		eventBus?: EventBus,
	) {
		this.readerAgent = readerAgent;
		this.parserAgent = parserAgent;
		this.validatorAgent = validatorAgent;
		this.arbitratorAgent = arbitratorAgent;
		this.eventBus = eventBus || new EventBus();
		this.activeProcesses = new Map();

		loggers.ai.info("WorkflowOrchestrator initialized");
	}

	/**
	 * Process invoice (main entry point)
	 */
	async processInvoice(input: ReaderInput): Promise<ProcessedInvoice> {
		const processId = randomUUID();
		const startTime = new Date();

		loggers.ai.info("WorkflowOrchestrator process started", { processId });

		// Initialize workflow context
		const context: WorkflowContext = {
			processId,
			state: "IDLE",
			input,
			startTime,
		};

		this.activeProcesses.set(processId, context);

		// Emit start event
		this.eventBus.emit({
			type: "INVOICE_RECEIVED",
			timestamp: new Date(),
			processId,
			payload: input,
		});

		try {
			// Stage 1: Parallel extraction, parsing, validation
			const { reader, parser, validator } = await this.executeAgentsInParallel(
				processId,
				input,
			);

			context.extractedData = reader.result;
			context.parsedData = parser.result;
			context.validationResult = validator.result;

			// Stage 2: Detect conflicts
			const conflicts = this.detectConflicts(
				reader.result,
				parser.result,
				validator.result,
			);
			context.conflicts = conflicts;

			if (conflicts.length > 0) {
				this.eventBus.emit({
					type: "CONFLICT_DETECTED",
					timestamp: new Date(),
					processId,
					conflicts,
					requiresArbitration: true,
				});

				// Stage 3: Arbitration
				loggers.ai.info("Invoking arbitrator for conflicts", {
					processId,
					conflicts: conflicts.length,
				});

				const arbitrationStartTime = new Date();
				this.eventBus.emit({
					type: "ARBITRATION_STARTED",
					timestamp: arbitrationStartTime,
					processId,
					agent: "arbitrator",
					conflicts,
				});

				const decision = await this.arbitratorAgent.process({
					reader: reader.result,
					parser: parser.result,
					validator: validator.result,
					conflicts,
				});

				context.arbitrationDecision = decision;

				this.eventBus.emit({
					type: "ARBITRATION_COMPLETE",
					timestamp: new Date(),
					processId,
					agent: "arbitrator",
					decision,
				});

				// Check decision
				if (decision.decision === "REJECTED") {
					return this.createRejectedResult(
						processId,
						context,
						"Rejected by arbitrator",
					);
				}

				if (decision.decision === "MANUAL_REVIEW") {
					return this.createManualReviewResult(processId, context);
				}
			}

			// Stage 4: Generate XML (if compliant)
			const finalData =
				context.arbitrationDecision?.finalData || reader.result.extractedData;

			if (!validator.result.isCompliant) {
				return this.createRejectedResult(
					processId,
					context,
					`Compliance violations: ${validator.result.violations.length}`,
				);
			}

			const xmlContent =
				validator.result.generatedXML || this.generateFallbackXML(finalData);
			context.xmlContent = xmlContent;

			this.eventBus.emit({
				type: "XML_GENERATED",
				timestamp: new Date(),
				processId,
				xml: xmlContent,
			});

			// Stage 5: Success
			context.state = "COMPLETED";
			context.endTime = new Date();

			this.eventBus.emit({
				type: "PROCESS_COMPLETED",
				timestamp: new Date(),
				processId,
				invoiceNumber: finalData.invoiceNumber,
				totalTime: context.endTime.getTime() - context.startTime.getTime(),
			});

			return this.createSuccessResult(
				processId,
				context,
				finalData,
				xmlContent,
			);
		} catch (error) {
			context.state = "FAILED";
			context.error = error instanceof Error ? error.message : "Unknown error";
			context.endTime = new Date();

			this.eventBus.emit({
				type: "PROCESS_FAILED",
				timestamp: new Date(),
				processId,
				error: context.error,
				stage: context.state,
			});

			return this.createFailedResult(processId, context, error as Error);
		} finally {
			this.activeProcesses.delete(processId);
		}
	}

	/**
	 * Execute agents in parallel
	 */
	private async executeAgentsInParallel(processId: string, input: ReaderInput) {
		loggers.ai.info("Executing agents in parallel");

		const startTime = Date.now();

		// Execute Reader and Validator in parallel
		// (Parser needs XML, which might not be available for image-only inputs)
		const [readerResult, validatorResultPromise] = await Promise.all([
			// Reader Agent
			(async () => {
				this.eventBus.emit({
					type: "EXTRACTION_STARTED",
					timestamp: new Date(),
					processId,
					agent: "reader",
				});

				const stageStart = new Date();
				const result = await this.readerAgent.process(input);

				this.eventBus.emit({
					type: "EXTRACTION_COMPLETE",
					timestamp: new Date(),
					processId,
					agent: "reader",
					data: result,
				});

				return {
					stage: "reading" as const,
					result,
					log: this.createStageLog(
						"reader",
						stageStart,
						new Date(),
						"success",
						result,
					),
				};
			})(),

			// Validator Agent (validate extracted data)
			(async () => {
				// Wait a bit for reader to provide initial data
				await new Promise((resolve) => setTimeout(resolve, 100));

				this.eventBus.emit({
					type: "VALIDATION_STARTED",
					timestamp: new Date(),
					processId,
					agent: "validator",
				});

				const stageStart = new Date();

				// Validator needs InvoiceData - we'll use a placeholder until Reader completes
				// In practice, we'll run Validator after Reader in the actual flow
				return { stage: "validation" as const, stageStart };
			})(),
		]);

		// Now run Validator with Reader's data
		const validatorStageStart = (await validatorResultPromise).stageStart;
		const validatorResult = await this.validatorAgent.process({
			proposedInvoice: readerResult.result.extractedData,
			complianceYear: 2026,
			invoiceType: readerResult.result.extractedData.invoiceType,
		});

		this.eventBus.emit({
			type: "VALIDATION_COMPLETE",
			timestamp: new Date(),
			processId,
			agent: "validator",
			data: validatorResult,
		});

		const parserStageStart = new Date();

		// For now, create a mock parser result since we don't have XML input
		// In production, this would parse actual XML if available
		const parserResult: ParsedInvoice = {
			parsedData: readerResult.result.extractedData,
			schemaVersion: "UBL_2.1",
			discrepancies: [],
			needsMigration: false,
			processingTime: 0,
			agentId: "parser-mock",
		};

		const totalTime = Date.now() - startTime;
		loggers.ai.info("All agents completed", { totalTime });

		return {
			reader: {
				stage: "reading" as const,
				result: readerResult.result,
				log: readerResult.log,
			},
			parser: {
				stage: "parsing" as const,
				result: parserResult,
				log: this.createStageLog(
					"parser",
					parserStageStart,
					new Date(),
					"success",
					parserResult,
				),
			},
			validator: {
				stage: "validation" as const,
				result: validatorResult,
				log: this.createStageLog(
					"validator",
					validatorStageStart,
					new Date(),
					"success",
					validatorResult,
				),
			},
		};
	}

	/**
	 * Detect conflicts between agents
	 */
	private detectConflicts(
		reader: ExtractedData,
		parser: ParsedInvoice,
		_validator: ValidationResult,
	): Conflict[] {
		const conflicts: Conflict[] = [];

		// Compare critical fields
		const criticalFields: Array<keyof InvoiceData> = [
			"total",
			"subtotal",
			"igv",
			"issuerRuc",
			"customerRuc",
			"invoiceNumber",
		];

		for (const field of criticalFields) {
			const readerVal = reader.extractedData[field];
			const parserVal = parser.parsedData[field];

			// Simple comparison (in production, use more sophisticated logic)
			if (readerVal !== parserVal && parserVal !== undefined) {
				conflicts.push({
					field,
					sources: {
						reader: readerVal,
						parser: parserVal,
					},
					severity: this.getConflictSeverity(field),
				});
			}
		}

		return conflicts;
	}

	/**
	 * Get conflict severity
	 */
	private getConflictSeverity(
		field: keyof InvoiceData,
	): "low" | "medium" | "high" {
		const highSeverity: Array<keyof InvoiceData> = [
			"total",
			"issuerRuc",
			"customerRuc",
		];
		if (highSeverity.includes(field)) return "high";
		return "medium";
	}

	/**
	 * Create stage log
	 */
	private createStageLog(
		agentId: string,
		startTime: Date,
		endTime: Date,
		status: "success" | "failed" | "skipped",
		output?: StageLog["output"],
	): StageLog {
		return {
			startTime,
			endTime,
			duration: endTime.getTime() - startTime.getTime(),
			status,
			agentId,
			output,
		};
	}

	/**
	 * Generate fallback XML (simplified)
	 */
	private generateFallbackXML(data: InvoiceData): string {
		return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Fallback XML - Use validator's generated XML in production -->
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${data.issueDate.toISOString().split("T")[0]}</cbc:IssueDate>
  <!-- Full UBL 2.1 structure would be generated by Validator Agent -->
</Invoice>`;
	}

	/**
	 * Create success result
	 */
	private createSuccessResult(
		processId: string,
		context: WorkflowContext,
		invoiceData: InvoiceData,
		xmlContent: string,
	): ProcessedInvoice {
		return {
			status: "success",
			invoiceData,
			xmlContent,
			processingLog: this.createProcessingLog(context),
		};
	}

	/**
	 * Create rejected result
	 */
	private createRejectedResult(
		processId: string,
		context: WorkflowContext,
		reason: string,
	): ProcessedInvoice {
		return {
			status: "failed",
			invoiceData: context.extractedData?.extractedData || ({} as InvoiceData),
			processingLog: this.createProcessingLog(context),
			errors: [new Error(reason)],
		};
	}

	/**
	 * Create manual review result
	 */
	private createManualReviewResult(
		processId: string,
		context: WorkflowContext,
	): ProcessedInvoice {
		this.eventBus.emit({
			type: "MANUAL_REVIEW_REQUIRED",
			timestamp: new Date(),
			processId,
			reason: "Low confidence or unresolvable conflicts",
			conflicts: context.conflicts || [],
		});

		return {
			status: "manual_review",
			invoiceData:
				context.arbitrationDecision?.finalData || ({} as InvoiceData),
			processingLog: this.createProcessingLog(context),
		};
	}

	/**
	 * Create failed result
	 */
	private createFailedResult(
		processId: string,
		context: WorkflowContext,
		error: Error,
	): ProcessedInvoice {
		return {
			status: "failed",
			invoiceData: {} as InvoiceData,
			processingLog: this.createProcessingLog(context),
			errors: [error],
		};
	}

	/**
	 * Create processing log
	 */
	private createProcessingLog(context: WorkflowContext): ProcessingLog {
		const endTime = context.endTime || new Date();
		const totalTime = endTime.getTime() - context.startTime.getTime();

		return {
			startTime: context.startTime,
			endTime,
			totalTime,
			stages: {
				reading: {
					startTime: context.startTime,
					endTime: context.startTime,
					duration: 0,
					status: "skipped",
					agentId: "reader",
				},
				parsing: {
					startTime: context.startTime,
					endTime: context.startTime,
					duration: 0,
					status: "skipped",
					agentId: "parser",
				},
				validation: {
					startTime: context.startTime,
					endTime: context.startTime,
					duration: 0,
					status: "skipped",
					agentId: "validator",
				},
			},
		};
	}

	/**
	 * Get active processes
	 */
	getActiveProcesses(): WorkflowContext[] {
		return Array.from(this.activeProcesses.values());
	}

	/**
	 * Get event bus
	 */
	getEventBus(): EventBus {
		return this.eventBus;
	}
}
