/**
 * Workflow Orchestrator V2 - Paralelismo Real + Observabilidad
 *
 * Mejoras sobre V1:
 * - Ejecución verdaderamente paralela con Promise.allSettled
 * - Circuit breaker para resiliencia
 * - Métricas integradas (processing time, success rate)
 * - Timeout configurable por agente
 * - Structured logging con correlation IDs
 *
 * Inspirado en: Kimi K2.5 Agent Swarm, AutoGen, CrewAI
 * @version 2.0.0
 */

import { createHash, randomUUID } from "node:crypto";
import { loggers } from "../../../logger";
import type {
	AgentRunStatus,
	AgentWorkflowState,
} from "../../../session/session.types";
import type {
	ArbitratorAgent,
	ParserAgent,
	ReaderAgent,
	ValidatorAgent,
} from "../../agents";
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
} from "../../types";
import { EventBus } from "../event.bus";

import type {
	AgentMetrics,
	OrchestratorConfig,
	ParallelExecutionResult,
	PhaseSkipOptions,
} from "./types";

/** Minimal OSE service client shape used by the orchestrator (no hard dependency on infrastructure) */
interface OSEServiceClient {
	sendInvoice: (data: {
		xmlContent: string;
		invoiceNumber: string;
		invoiceType: string;
	}) => Promise<{
		success: boolean;
		cdrContent?: string;
		cdrStatus?: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
		cdrMessage?: string;
		sunatCode?: string;
		error?: string;
	}>;
}

import {
	SessionNotFoundError,
	SessionStoreError,
} from "../../../session/session.types";
import { AgentMetricsCollector, CircuitBreaker } from "./steps";

/**
 * WorkflowOrchestratorV2 class.
 *
 * @example
 * ```ts
 * const value = new WorkflowOrchestratorV2();
 * console.log(value);
 * ```
 */
export class WorkflowOrchestratorV2 {
	private eventBus: EventBus;
	private activeProcesses: Map<string, WorkflowContext>;
	private metricsCollector: AgentMetricsCollector;
	private circuitBreakers: Map<string, CircuitBreaker>;

	// Agents
	private readerAgent: ReaderAgent;
	private parserAgent: ParserAgent;
	private validatorAgent: ValidatorAgent;
	private arbitratorAgent: ArbitratorAgent;

	// Config
	private config: OrchestratorConfig;

	constructor(
		readerAgent: ReaderAgent,
		parserAgent: ParserAgent,
		validatorAgent: ValidatorAgent,
		arbitratorAgent: ArbitratorAgent,
		config: Partial<OrchestratorConfig> = {},
		eventBus?: EventBus,
	) {
		this.readerAgent = readerAgent;
		this.parserAgent = parserAgent;
		this.validatorAgent = validatorAgent;
		this.arbitratorAgent = arbitratorAgent;
		this.eventBus = eventBus || new EventBus();
		this.activeProcesses = new Map();
		this.metricsCollector = new AgentMetricsCollector();
		this.circuitBreakers = new Map();

		this.config = {
			agentTimeoutMs: config.agentTimeoutMs || 30000,
			maxRetries: config.maxRetries || 2,
			enableCircuitBreaker: config.enableCircuitBreaker ?? true,
			enableMetrics: config.enableMetrics ?? true,
			sessionStore: config.sessionStore,
			contextMonitor: config.contextMonitor,
			pruner: config.pruner,
			oseService: config.oseService,
		};

		// Subscribe to PRUNE_REQUESTED events for reactive pruning
		if (this.config.pruner) {
			const sub = this.eventBus.on("PRUNE_REQUESTED", (event) => {
				try {
					const pruneEvent =
						event as import("../../types/workflow.types").PruneRequestedEvent;
					loggers.ai.info(
						"Orchestrator: PRUNE_REQUESTED received, triggering reactive pruning",
						{
							processId: pruneEvent.processId,
							usagePercent: pruneEvent.usage?.usagePercent,
						},
					);

					// The actual message buffer lives in the gateway, so the pruner
					// is called without messages here — the gateway hook handles
					// proactive pruning on the next chat() call.
					// This subscriber exists to satisfy the contract (FR-5) and
					// provides a hook for future direct buffer integration.
					if (this.config.pruner) {
						this.config.pruner.prune([], pruneEvent.processId);
					}
				} catch (err) {
					loggers.ai.warn("Orchestrator: PRUNE_REQUESTED handler failed", {
						error: String(err),
					});
				}
			});
			this.prunerSubscriptionId = sub.id;
		}

		// Initialize circuit breakers
		if (this.config.enableCircuitBreaker) {
			["reader", "parser", "validator"].forEach((agent) => {
				this.circuitBreakers.set(agent, new CircuitBreaker(5, 60000));
			});
		}

		loggers.ai.info("OrchestratorV2 initialized");
	}

	/**
	 * Process invoice with true parallel execution
	 *
	 * @param input - The reader input (image, PDF, XML)
	 * @param runId - Optional run ID for recovery mode. If not provided, a new UUID is generated.
	 * @param phaseSkip - Optional phase skip options for session recovery.
	 *                    When provided, the listed phases are skipped using prebuilt data.
	 */
	async processInvoice(
		input: ReaderInput,
		runId?: string,
		phaseSkip?: PhaseSkipOptions,
	): Promise<ProcessedInvoice> {
		const processId = runId ?? randomUUID();
		const startTime = new Date();

		loggers.ai.info("OrchestratorV2 process started", { processId });

		const context: WorkflowContext = {
			processId,
			state: "IDLE",
			input,
			startTime,
		};

		this.activeProcesses.set(processId, context);

		this.eventBus.emit({
			type: "INVOICE_RECEIVED",
			timestamp: new Date(),
			processId,
			payload: input,
		});

		// Persist initial "running" state
		await this.persistRunState(processId, {
			status: "running" as AgentRunStatus,
			workflowState: "IDLE" as AgentWorkflowState,
			companyId: input.metadata?.ruc ? `ruc-${input.metadata.ruc}` : "unknown",
			context: { inputType: input.type, metadata: input.metadata ?? {} },
		});

		// Persist input data for session recovery
		await this.persistInput(processId, input);

		this.appendSessionEvent(
			processId,
			"PROCESS_STARTED",
			{ inputType: input.type },
			input.metadata?.ruc ?? "unknown",
		);

		try {
			// Stage 1: TRUE PARALLEL execution of all agents
			const executionResult = await this.executeAgentsInParallel(
				processId,
				input,
				phaseSkip,
			);

			// Check if we have minimum required data
			if (!executionResult.reader?.result) {
				throw new Error(
					"Reader agent failed - cannot proceed without extracted data",
				);
			}

			context.extractedData = executionResult.reader.result;
			context.parsedData = executionResult.parser?.result ?? undefined;
			context.validationResult = executionResult.validator?.result ?? undefined;

			// Check context threshold after initial agent execution
			this.checkContextThreshold(processId);

			// Stage 2: Detect conflicts (only if we have multiple successful results)
			const conflicts = this.detectConflictsFromResults(executionResult);
			context.conflicts = conflicts;

			if (conflicts.length > 0) {
				this.eventBus.emit({
					type: "CONFLICT_DETECTED",
					timestamp: new Date(),
					processId,
					conflicts,
				});

				// Persist ARBITRATING state before arbitration phase
				await this.persistRunState(processId, {
					workflowState: "ARBITRATING" as AgentWorkflowState,
				});

				// Stage 3: Arbitrate conflicts
				const arbitration = await this.arbitrateConflicts(
					processId,
					executionResult,
					conflicts,
				);
				context.arbitrationDecision = arbitration;

				if (arbitration.requiresManualReview) {
					return this.createManualReviewResult(processId, context);
				}
			}

			// Check context threshold again after validation/arbitration
			this.checkContextThreshold(processId);

			// Stage 4: Generate final result
			const finalData = this.aggregateResults(executionResult);
			const xmlContent = executionResult.validator?.result?.generatedXML || "";

			// Stage 5: OSE Submission (non-blocking — failure does NOT fail the pipeline)
			let oseStageLog: StageLog | undefined;
			let cdrResponse: import("../../types").CDRResponse | undefined;
			const oseStartTime = new Date();

			if (this.config.oseService && xmlContent && finalData?.invoiceNumber) {
				try {
					await this.persistRunState(processId, {
						workflowState: "OSE_SUBMITTING" as AgentWorkflowState,
					});

					this.eventBus.emit({
						type: "OSE_SUBMISSION_STARTED",
						timestamp: new Date(),
						processId,
					});

					const oseResult = await this.config.oseService.sendInvoice({
						xmlContent,
						invoiceNumber: finalData.invoiceNumber,
						invoiceType: finalData.invoiceType || "01",
					});

					if (oseResult.success) {
						cdrResponse = {
							status: oseResult.cdrStatus || "ACEPTADO",
							message: oseResult.cdrMessage || "",
							code: oseResult.sunatCode || "0",
							cdrContent: oseResult.cdrContent || "",
							receivedAt: new Date(),
						};

						oseStageLog = this.createStageLog(
							"ose",
							oseStartTime,
							new Date(),
							"success",
						);

						this.eventBus.emit({
							type: "OSE_SENT",
							timestamp: new Date(),
							processId,
							cdr: cdrResponse,
						});
					} else {
						oseStageLog = this.createStageLog(
							"ose",
							oseStartTime,
							new Date(),
							"failed",
							undefined,
							oseResult.error,
						);

						this.eventBus.emit({
							type: "OSE_FAILED",
							timestamp: new Date(),
							processId,
							error: oseResult.error || "OSE submission failed",
							retryCount: 0,
						});
					}
				} catch (oseError) {
					// Non-blocking: OSE failure does NOT fail the pipeline
					loggers.ai.warn("[OSE] Submission error (non-blocking):", oseError);
					oseStageLog = this.createStageLog(
						"ose",
						oseStartTime,
						new Date(),
						"failed",
						undefined,
						oseError instanceof Error ? oseError.message : "Unknown OSE error",
					);

					this.eventBus.emit({
						type: "OSE_FAILED",
						timestamp: new Date(),
						processId,
						error:
							oseError instanceof Error
								? oseError.message
								: "Unknown OSE error",
						retryCount: 0,
					});
				}
			} else {
				oseStageLog = this.createStageLog(
					"ose",
					oseStartTime,
					oseStartTime,
					"skipped",
				);
			}

			context.state = "COMPLETED";
			context.endTime = new Date();

			// Persist completed state
			await this.persistRunState(processId, {
				status: "completed" as AgentRunStatus,
				workflowState: "COMPLETED" as AgentWorkflowState,
			});

			this.appendSessionEvent(
				processId,
				"PROCESS_COMPLETED",
				{ duration: executionResult.totalDuration },
				input.metadata?.ruc ?? "unknown",
			);

			this.eventBus.emit({
				type: "PROCESS_COMPLETED",
				timestamp: new Date(),
				processId,
				duration: executionResult.totalDuration,
				metrics: this.config.enableMetrics
					? this.getMetricsSnapshot()
					: undefined,
			});

			return this.createSuccessResult(
				processId,
				context,
				finalData,
				xmlContent,
				oseStageLog,
				cdrResponse,
			);
		} catch (error) {
			context.state = "FAILED";
			context.error = error as Error;
			context.endTime = new Date();

			// Persist failed state
			await this.persistRunState(processId, {
				status: "failed" as AgentRunStatus,
				workflowState: "FAILED" as AgentWorkflowState,
				error: (error as Error).message ?? "Unknown orchestrator error",
			});

			this.appendSessionEvent(
				processId,
				"PROCESS_FAILED",
				{ error: (error as Error).message },
				input.metadata?.ruc ?? "unknown",
			);

			this.eventBus.emit({
				type: "PROCESS_FAILED",
				timestamp: new Date(),
				processId,
				error: context.error ?? "Unknown orchestrator error",
				stage: context.state,
			});

			return this.createFailedResult(processId, context, error as Error);
		} finally {
			this.activeProcesses.delete(processId);
		}
	}

	/**
	 * Execute all agents in TRUE PARALLEL with Promise.allSettled
	 * This is the key improvement over V1
	 *
	 * @param processId - The process ID
	 * @param input - The reader input
	 * @param phaseSkip - Optional phase skip options for session recovery.
	 *                    When skipPhases includes a phase, the corresponding
	 *                    prebuilt data is used instead of running the agent.
	 */
	private async executeAgentsInParallel(
		processId: string,
		input: ReaderInput,
		phaseSkip?: PhaseSkipOptions,
	): Promise<ParallelExecutionResult> {
		loggers.ai.info("Executing agents in parallel", {
			processId,
			skipPhases: phaseSkip?.skipPhases,
		});

		const parallelStartTime = Date.now();
		const skipSet = new Set(phaseSkip?.skipPhases ?? []);

		// 1. First, start Reader and Parser in parallel
		const [readerSettlement, parserSettlement] = await Promise.allSettled([
			this.executeReaderAgent(processId, input, skipSet, phaseSkip),
			this.executeParserAgent(processId, input, skipSet, phaseSkip),
		]);

		// 2. Once we have at least one source of truth (Reader or Parser), start Validator
		const extractedData =
			readerSettlement.status === "fulfilled"
				? readerSettlement.value.result
				: null;
		const parsedData =
			parserSettlement.status === "fulfilled"
				? parserSettlement.value.result
				: null;
		const bestSource = extractedData || parsedData;

		let validatorSettlement: PromiseSettledResult<{
			result: ValidationResult;
			metrics: AgentMetrics;
		}>;

		if (bestSource || skipSet.has("validator")) {
			validatorSettlement = await this.executeValidatorAgent(
				processId,
				bestSource,
				skipSet,
				phaseSkip,
			);
		} else {
			validatorSettlement = {
				status: "rejected",
				reason: new Error(
					"No data available for validation (both Reader and Parser failed)",
				),
			};
		}

		const totalDuration = Date.now() - parallelStartTime;
		loggers.ai.info("Swarm pipeline completed", { processId, totalDuration });

		// Process results into ParallelExecutionResult
		const result: ParallelExecutionResult = {
			reader: null,
			parser: null,
			validator: null,
			errors: [],
			totalDuration,
		};

		// Handle Reader result
		if (readerSettlement.status === "fulfilled") {
			const { result: data, metrics } = readerSettlement.value;
			result.reader = {
				result: data as ExtractedData,
				log: this.createStageLog(
					"reader",
					new Date(metrics.startTime),
					new Date(metrics.endTime || Date.now()),
					"success",
					data,
				),
				metrics,
			};
			// Persist EXTRACTING state with extracted data for recovery
			await this.persistRunState(processId, {
				workflowState: "EXTRACTING" as AgentWorkflowState,
				context: { extractedData: data },
			});
		} else {
			result.errors.push({
				agent: "reader",
				error: readerSettlement.reason as Error,
			});
		}

		// Handle Parser result
		if (parserSettlement.status === "fulfilled") {
			const { result: data, metrics } = parserSettlement.value;
			result.parser = {
				result: data as ParsedInvoice,
				log: this.createStageLog(
					"parser",
					new Date(metrics.startTime),
					new Date(metrics.endTime || Date.now()),
					"success",
					data,
				),
				metrics,
			};
			// Persist PARSING state with extracted + parsed data for recovery
			const persistContext: Record<string, unknown> = {};
			if (result.reader?.result) {
				persistContext.extractedData = result.reader.result;
			}
			persistContext.parsedData = data;
			await this.persistRunState(processId, {
				workflowState: "PARSING" as AgentWorkflowState,
				context: persistContext,
			});
		} else {
			result.errors.push({
				agent: "parser",
				error: parserSettlement.reason as Error,
			});
		}

		// Handle Validator result
		if (validatorSettlement.status === "fulfilled") {
			const { result: data, metrics } = validatorSettlement.value;
			result.validator = {
				result: data as ValidationResult,
				log: this.createStageLog(
					"validator",
					new Date(metrics.startTime),
					new Date(metrics.endTime || Date.now()),
					"success",
					data,
				),
				metrics,
			};
			// Persist VALIDATING state with all data for recovery
			const persistContext: Record<string, unknown> = {};
			if (result.reader?.result)
				persistContext.extractedData = result.reader.result;
			if (result.parser?.result)
				persistContext.parsedData = result.parser.result;
			persistContext.validationResult = data;
			await this.persistRunState(processId, {
				workflowState: "VALIDATING" as AgentWorkflowState,
				context: persistContext,
			});
		} else {
			result.errors.push({
				agent: "validator",
				error: validatorSettlement.reason as Error,
			});
		}

		return result;
	}

	/**
	 * Execute the reader agent, or use prebuilt data when skipping.
	 */
	private async executeReaderAgent(
		processId: string,
		input: ReaderInput,
		skipSet: Set<string>,
		phaseSkip?: PhaseSkipOptions,
	): Promise<{ result: ExtractedData; metrics: AgentMetrics }> {
		if (skipSet.has("reader") && phaseSkip?.prebuiltExtractedData) {
			loggers.ai.info("Skipping reader phase — using prebuilt extracted data", {
				processId,
			});
			const now = Date.now();
			return {
				result: phaseSkip.prebuiltExtractedData,
				metrics: {
					agentName: "reader",
					startTime: now,
					endTime: now,
					status: "success",
					retryCount: 0,
				},
			};
		}

		return this.executeAgentWithRetry("reader", async () => {
			this.eventBus.emit({
				type: "EXTRACTION_STARTED",
				timestamp: new Date(),
				processId,
				agent: "reader",
			});

			const result = await this.readerAgent.process(input);

			this.eventBus.emit({
				type: "EXTRACTION_COMPLETE",
				timestamp: new Date(),
				processId,
				agent: "reader",
				data: result,
			});

			return result;
		});
	}

	/**
	 * Execute the parser agent, or use prebuilt data when skipping.
	 */
	private async executeParserAgent(
		processId: string,
		input: ReaderInput,
		skipSet: Set<string>,
		phaseSkip?: PhaseSkipOptions,
	): Promise<{ result: ParsedInvoice; metrics: AgentMetrics }> {
		if (skipSet.has("parser") && phaseSkip?.prebuiltParsedData) {
			loggers.ai.info("Skipping parser phase — using prebuilt parsed data", {
				processId,
			});
			const now = Date.now();
			return {
				result: phaseSkip.prebuiltParsedData,
				metrics: {
					agentName: "parser",
					startTime: now,
					endTime: now,
					status: "success",
					retryCount: 0,
				},
			};
		}

		return this.executeAgentWithRetry("parser", async () => {
			this.eventBus.emit({
				type: "PARSING_STARTED",
				timestamp: new Date(),
				processId,
				agent: "parser",
			});

			if (input.type === "invoice_xml" && input.data) {
				const result = await this.parserAgent.process({
					xmlContent: input.data,
					schemaVersion: "UBL_2.1",
				});

				this.eventBus.emit({
					type: "PARSING_COMPLETE",
					timestamp: new Date(),
					processId,
					agent: "parser",
					data: result,
				});

				return result;
			}

			const placeholderResult = {
				parsedData: {} as InvoiceData,
				schemaVersion: "UBL_2.1" as const,
				discrepancies: [],
				needsMigration: false,
				processingTime: 0,
				agentId: "parser-placeholder",
			};

			this.eventBus.emit({
				type: "PARSING_SKIPPED",
				timestamp: new Date(),
				processId,
				agent: "parser",
				reason: "No XML content available",
			});

			return placeholderResult;
		});
	}

	/**
	 * Execute the validator agent, or use prebuilt data when skipping.
	 */
	private async executeValidatorAgent(
		processId: string,
		bestSource: InvoiceData | null,
		skipSet: Set<string>,
		phaseSkip?: PhaseSkipOptions,
	): Promise<
		PromiseSettledResult<{ result: ValidationResult; metrics: AgentMetrics }>
	> {
		// If validator is skipped and prebuilt data is provided, return it
		if (skipSet.has("validator") && phaseSkip?.prebuiltValidationResult) {
			loggers.ai.info(
				"Skipping validator phase — using prebuilt validation result",
				{ processId },
			);
			const now = Date.now();
			return {
				status: "fulfilled" as const,
				value: {
					result: phaseSkip.prebuiltValidationResult,
					metrics: {
						agentName: "validator",
						startTime: now,
						endTime: now,
						status: "success",
						retryCount: 0,
					},
				},
			};
		}

		try {
			const res = await this.executeAgentWithRetry("validator", async () => {
				this.eventBus.emit({
					type: "VALIDATION_STARTED",
					timestamp: new Date(),
					processId,
					agent: "validator",
				});

				const result = await this.validatorAgent.process({
					proposedInvoice: bestSource!,
					complianceYear: 2026,
					invoiceType: bestSource?.invoiceType || "01",
				});

				this.eventBus.emit({
					type: "VALIDATION_COMPLETE",
					timestamp: new Date(),
					processId,
					agent: "validator",
					data: result,
				});

				return result;
			});
			return { status: "fulfilled" as const, value: res };
		} catch (error) {
			return { status: "rejected" as const, reason: error };
		}
	}

	/**
	 * Execute agent with retry logic and circuit breaker
	 */
	private async executeAgentWithRetry<T>(
		agentName: string,
		fn: () => Promise<T>,
	): Promise<{ result: T; metrics: AgentMetrics }> {
		const metrics = this.metricsCollector.startAgent(agentName);
		let lastError: Error | undefined;

		const executeWithTimeout = async (): Promise<T> => {
			return new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					reject(
						new Error(
							`Agent ${agentName} timed out after ${this.config.agentTimeoutMs}ms`,
						),
					);
				}, this.config.agentTimeoutMs);

				fn()
					.then((result) => {
						clearTimeout(timeoutId);
						resolve(result);
					})
					.catch((error) => {
						clearTimeout(timeoutId);
						reject(error);
					});
			});
		};

		for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
			try {
				let result: T;

				if (this.config.enableCircuitBreaker) {
					const circuitBreaker = this.circuitBreakers.get(agentName);
					if (circuitBreaker) {
						result = await circuitBreaker.execute(() => executeWithTimeout());
					} else {
						result = await executeWithTimeout();
					}
				} else {
					result = await executeWithTimeout();
				}

				this.metricsCollector.finishAgent(metrics, "success");
				return { result, metrics };
			} catch (error) {
				lastError = error as Error;
				metrics.retryCount++;

				if (attempt < this.config.maxRetries) {
					loggers.ai.warn("Retrying agent execution", {
						agentName,
						attempt: attempt + 2,
						maxAttempts: this.config.maxRetries + 1,
					});
					// Exponential backoff with jitter to prevent thundering herd
					const baseDelay = 1000 * (attempt + 1);
					const jitter = Math.random() * 1000; // Random 0-1000ms
					await this.delay(baseDelay + jitter);
				}
			}
		}

		this.metricsCollector.finishAgent(metrics, "failed", lastError);
		throw lastError;
	}

	/**
	 * Detect conflicts from parallel execution results
	 */
	private detectConflictsFromResults(
		results: ParallelExecutionResult,
	): Conflict[] {
		const conflicts: Conflict[] = [];

		// Only detect conflicts if we have reader and at least one other result
		if (!results.reader?.result) return conflicts;

		const readerData = results.reader.result.extractedData;

		// Compare with parser if available
		if (results.parser?.result?.parsedData) {
			const parserData = results.parser.result.parsedData;
			const criticalFields: Array<keyof InvoiceData> = [
				"total",
				"subtotal",
				"igv",
				"issuerRuc",
				"customerRuc",
				"invoiceNumber",
			];

			for (const field of criticalFields) {
				const readerVal = readerData[field];
				const parserVal = parserData[field];

				if (readerVal !== parserVal && parserVal !== undefined) {
					conflicts.push({
						field,
						sources: { reader: readerVal, parser: parserVal },
						severity: ["total", "issuerRuc", "customerRuc"].includes(field)
							? "high"
							: "medium",
					});
				}
			}
		}

		// Check validator compliance issues
		if (results.validator?.result) {
			const violations = results.validator.result.violations || [];
			for (const violation of violations) {
				conflicts.push({
					field: violation.field as keyof InvoiceData,
					sources: { validator: violation.description },
					severity: violation.severity === "critical" ? "high" : "medium",
				});
			}
		}

		return conflicts;
	}

	/**
	 * Arbitrate conflicts using the arbitrator agent
	 */
	private async arbitrateConflicts(
		processId: string,
		results: ParallelExecutionResult,
		conflicts: Conflict[],
	): Promise<Awaited<ReturnType<ArbitratorAgent["process"]>>> {
		this.eventBus.emit({
			type: "ARBITRATION_STARTED",
			timestamp: new Date(),
			processId,
			agent: "arbitrator",
			conflicts,
		});

		// Use arbitrator agent to resolve conflicts
		const arbitration = await this.arbitratorAgent.process({
			readerOutput: results.reader?.result || null,
			parserOutput: results.parser?.result || null,
			validatorOutput: results.validator?.result || null,
			conflicts,
		});

		this.eventBus.emit({
			type: "ARBITRATION_COMPLETED",
			timestamp: new Date(),
			processId,
			agent: "arbitrator",
			decision: arbitration,
		});

		return arbitration;
	}

	/**
	 * Aggregate results from all agents
	 */
	private aggregateResults(results: ParallelExecutionResult): InvoiceData {
		// Priority: Reader > Parser > Placeholder
		return (
			results.reader?.result.extractedData ||
			results.parser?.result.parsedData ||
			({} as InvoiceData)
		);
	}

	/**
	 * Get current metrics snapshot
	 */
	getMetricsSnapshot(): Record<
		string,
		{ successRate: number; avgProcessingTime: number }
	> {
		return {
			reader: {
				successRate: this.metricsCollector.getSuccessRate("reader"),
				avgProcessingTime:
					this.metricsCollector.getAverageProcessingTime("reader"),
			},
			parser: {
				successRate: this.metricsCollector.getSuccessRate("parser"),
				avgProcessingTime:
					this.metricsCollector.getAverageProcessingTime("parser"),
			},
			validator: {
				successRate: this.metricsCollector.getSuccessRate("validator"),
				avgProcessingTime:
					this.metricsCollector.getAverageProcessingTime("validator"),
			},
		};
	}

	/**
	 * Health check for the orchestrator
	 */
	async healthCheck(): Promise<{
		status: "healthy" | "degraded" | "unhealthy";
		agents: Record<string, { status: string; successRate: number }>;
		circuitBreakers: Record<string, string>;
	}> {
		const agentHealth: Record<string, { status: string; successRate: number }> =
			{};

		for (const agentName of ["reader", "parser", "validator"]) {
			const successRate = this.metricsCollector.getSuccessRate(agentName);
			agentHealth[agentName] = {
				status:
					successRate > 0.8
						? "healthy"
						: successRate > 0.5
							? "degraded"
							: "unhealthy",
				successRate,
			};
		}

		const circuitBreakerStates: Record<string, string> = {};
		this.circuitBreakers.forEach((cb, name) => {
			circuitBreakerStates[name] = cb.getState();
		});

		const overallStatus = Object.values(agentHealth).every(
			(h) => h.status === "healthy",
		)
			? "healthy"
			: Object.values(agentHealth).some((h) => h.status === "unhealthy")
				? "unhealthy"
				: "degraded";

		return {
			status: overallStatus,
			agents: agentHealth,
			circuitBreakers: circuitBreakerStates,
		};
	}

	// ============================================================================
	// SESSION RECOVERY
	// ============================================================================

	/**
	 * Recover a failed or degraded run from the last known phase.
	 *
	 * Loads the persisted run state and intermediate agent outputs, then
	 * resumes execution from the last incomplete phase. Completed phases
	 * are skipped using preconstructed data from the recovered context.
	 *
	 * @param runId - The run ID to recover
	 * @param input - The re-submitted reader input (must match the original for checksum)
	 * @returns A WorkflowContext with the recovery result
	 * @throws SessionStoreError if sessionStore is not configured
	 * @throws SessionNotFoundError if the run has no persisted state
	 * @throws SessionStoreError if the run is still active or already completed
	 */
	async recoverRun(
		runId: string,
		input: ReaderInput,
	): Promise<WorkflowContext> {
		// Validate sessionStore is configured
		if (!this.config.sessionStore) {
			throw new SessionStoreError(
				"SessionStore not configured — recovery unavailable",
			);
		}

		loggers.ai.info("Starting recovery for run", {
			runId,
			inputType: input.type,
		});

		// 1. Load current state snapshot
		const snapshot = await this.config.sessionStore.recoverRunState(runId);
		if (!snapshot) {
			loggers.ai.warn("Recovery failed: no persisted state found", { runId });
			throw new SessionNotFoundError(runId);
		}

		const { state: runState } = snapshot;

		// 2. Validate recoverability
		if (runState.status === "running") {
			loggers.ai.warn("Recovery blocked: run is still active", { runId });
			throw new SessionStoreError(
				`Run ${runId} is still active — cannot recover`,
			);
		}

		if (runState.status === "completed") {
			loggers.ai.warn("Recovery blocked: run already completed", { runId });
			throw new SessionStoreError(
				`Run ${runId} already completed — no recovery needed`,
			);
		}

		const workflowState = runState.workflowState;
		if (!workflowState || !this.isIntermediateState(workflowState)) {
			loggers.ai.warn("Recovery blocked: no intermediate workflow state", {
				runId,
				workflowState,
			});
			throw new SessionStoreError(
				`Run ${runId} has no intermediate workflow state (${workflowState ?? "none"}) — cannot determine recovery point`,
			);
		}

		const recoveredContext = (runState.context ?? {}) as Record<
			string,
			unknown
		>;
		const recoveryStartTime = Date.now();

		// 3. Emit RECOVERY_STARTED event
		this.eventBus.emit({
			type: "RECOVERY_STARTED",
			timestamp: new Date(),
			processId: runId,
			workflowState,
		});

		// Append to session event log
		this.appendSessionEvent(
			runId,
			"RECOVERY_STARTED",
			{ workflowState, recoveredAt: new Date().toISOString() },
			runState.companyId,
		);

		try {
			// 4. Determine recovery path based on last completed phase
			let result: ProcessedInvoice;

			switch (workflowState) {
				case "IDLE":
				case "EXTRACTING": {
					// Full restart from reader
					loggers.ai.info("Recovery: full restart from reader", { runId });
					result = await this.processInvoice(input, runId);
					break;
				}

				case "PARSING": {
					// Skip reader, resume from parser
					loggers.ai.info("Recovery: skip reader, resume from parser", {
						runId,
					});
					const prebuiltExtractedData = recoveredContext.extractedData as
						| ExtractedData
						| undefined;
					if (!prebuiltExtractedData) {
						throw new SessionStoreError(
							`Cannot recover run ${runId} from PARSING state: no extractedData in persisted context`,
						);
					}
					result = await this.processInvoice(input, runId, {
						skipPhases: ["reader"],
						prebuiltExtractedData,
					});
					break;
				}

				case "VALIDATING": {
					// Skip reader + parser, resume from validator
					loggers.ai.info(
						"Recovery: skip reader + parser, resume from validator",
						{ runId },
					);
					const prebuiltExtractedData = recoveredContext.extractedData as
						| ExtractedData
						| undefined;
					const prebuiltParsedData = recoveredContext.parsedData as
						| ParsedInvoice
						| undefined;
					if (!prebuiltExtractedData || !prebuiltParsedData) {
						throw new SessionStoreError(
							`Cannot recover run ${runId} from VALIDATING state: missing extractedData or parsedData in persisted context`,
						);
					}
					result = await this.processInvoice(input, runId, {
						skipPhases: ["reader", "parser"],
						prebuiltExtractedData,
						prebuiltParsedData,
					});
					break;
				}

				case "ARBITRATING": {
					// All phases completed — no agent re-execution needed
					loggers.ai.info("Recovery: all phases already completed for run", {
						runId,
					});
					const prebuiltExtractedData = recoveredContext.extractedData as
						| ExtractedData
						| undefined;
					const prebuiltParsedData = recoveredContext.parsedData as
						| ParsedInvoice
						| undefined;
					const prebuiltValidationResult = recoveredContext.validationResult as
						| ValidationResult
						| undefined;
					if (
						!prebuiltExtractedData ||
						!prebuiltParsedData ||
						!prebuiltValidationResult
					) {
						throw new SessionStoreError(
							`Cannot recover run ${runId} from ARBITRATING state: missing intermediate data in persisted context`,
						);
					}
					result = await this.processInvoice(input, runId, {
						skipPhases: ["reader", "parser", "validator"],
						prebuiltExtractedData,
						prebuiltParsedData,
						prebuiltValidationResult,
					});
					break;
				}

				default: {
					throw new SessionStoreError(
						`Unexpected workflow state for recovery: ${workflowState}`,
					);
				}
			}

			// 5. Reconstruct WorkflowContext from recovery result
			const context = this.buildRecoveryContext(
				runId,
				input,
				result,
				workflowState,
				recoveryStartTime,
			);

			// 6. Emit RECOVERY_COMPLETED event
			const duration = Date.now() - recoveryStartTime;
			this.eventBus.emit({
				type: "RECOVERY_COMPLETED",
				timestamp: new Date(),
				processId: runId,
				workflowState,
				duration,
			});

			this.appendSessionEvent(
				runId,
				"RECOVERY_COMPLETED",
				{ workflowState, status: result.status, duration },
				runState.companyId,
			);

			loggers.ai.info("Recovery completed successfully", {
				runId,
				duration,
				status: result.status,
			});
			return context;
		} catch (error) {
			// 7. Emit RECOVERY_FAILED event
			const errorMessage = (error as Error).message ?? "Unknown recovery error";
			loggers.ai.error("Recovery failed", { runId, error: errorMessage });

			this.eventBus.emit({
				type: "RECOVERY_FAILED",
				timestamp: new Date(),
				processId: runId,
				error: errorMessage,
			});

			this.appendSessionEvent(
				runId,
				"RECOVERY_FAILED",
				{ error: errorMessage, workflowState },
				runState?.companyId ?? "unknown",
			);

			throw error;
		}
	}

	/**
	 * Build a WorkflowContext from a recovered ProcessedInvoice result.
	 */
	private buildRecoveryContext(
		runId: string,
		input: ReaderInput,
		result: ProcessedInvoice,
		_previousWorkflowState: string,
		recoveryStartTime: number,
	): WorkflowContext {
		const endTime = new Date();
		const startTime = new Date(Date.now() - (Date.now() - recoveryStartTime));

		const stateMap: Record<
			string,
			| "IDLE"
			| "EXTRACTING"
			| "PARSING"
			| "VALIDATING"
			| "ARBITRATING"
			| "COMPLETED"
			| "FAILED"
			| "MANUAL_REVIEW"
		> = {
			success: "COMPLETED",
			failed: "FAILED",
			manual_review: "MANUAL_REVIEW",
		};

		return {
			processId: runId,
			input,
			state: stateMap[result.status] || "FAILED",
			extractedData:
				result.processingLog.stages.reading.status === "success"
					? (result.processingLog.stages.reading.output as ExtractedData)
					: undefined,
			parsedData:
				result.processingLog.stages.parsing.status === "success"
					? (result.processingLog.stages.parsing.output as ParsedData)
					: undefined,
			validationResult:
				result.processingLog.stages.validation.status === "success"
					? (result.processingLog.stages.validation.output as ValidationResult)
					: undefined,
			error: result.errors?.[0] ?? undefined,
			startTime,
			endTime,
		};
	}

	/**
	 * Check if a workflow state is an intermediate state (recoverable).
	 */
	private isIntermediateState(state: string): boolean {
		return [
			"IDLE",
			"EXTRACTING",
			"PARSING",
			"VALIDATING",
			"ARBITRATING",
			"OSE_SUBMITTING",
		].includes(state);
	}

	// ============================================================================
	// PERSISTENCE METHODS
	// ============================================================================

	/**
	 * Persist current run state to session store (fire-and-forget safe).
	 * No-ops when no sessionStore is configured.
	 * Uses AgentRunStatus for type-safe status transitions.
	 */
	private async persistRunState(
		runId: string,
		state: Partial<{
			status: AgentRunStatus;
			workflowState: AgentWorkflowState;
			error: string | null;
			context: Record<string, unknown>;
			companyId: string;
		}>,
	): Promise<void> {
		if (!this.config.sessionStore) return;
		try {
			await this.config.sessionStore.saveRunState(runId, state);
		} catch (err) {
			loggers.ai.error("Failed to persist run state", { runId, error: err });
		}
	}

	/**
	 * Persist reader input data for session recovery.
	 * Computes SHA-256 checksum for integrity verification on recovery.
	 * No-ops when no sessionStore is configured.
	 */
	private async persistInput(runId: string, input: ReaderInput): Promise<void> {
		if (!this.config.sessionStore) return;
		try {
			const checksum = createHash("sha256").update(input.data).digest("hex");
			await this.config.sessionStore.saveInput(
				runId,
				input.type,
				input.data,
				checksum,
			);
		} catch (err) {
			loggers.ai.error("Failed to persist input for recovery", {
				runId,
				error: err,
			});
		}
	}

	/**
	 * Append an event to the run's event log (fire-and-forget with .catch()).
	 */
	private appendSessionEvent(
		runId: string,
		eventType: string,
		payload: Record<string, unknown> | null,
		companyId: string,
	): void {
		if (!this.config.sessionStore) return;
		this.config.sessionStore
			.appendEvent(runId, {
				runId,
				eventType,
				payload,
				companyId,
			})
			.catch((err) => {
				loggers.ai.warn("Failed to persist session event", {
					runId,
					eventType,
					error: err,
				});
			});
	}

	// ============================================================================
	// UTILITY METHODS
	// ============================================================================

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private createStageLog(
		agentId: string,
		startTime: Date,
		endTime: Date,
		status: "success" | "failed" | "skipped",
		output?: StageLog["output"],
		error?: string,
	): StageLog {
		return {
			startTime,
			endTime,
			duration: endTime.getTime() - startTime.getTime(),
			status,
			agentId,
			output,
			error,
		};
	}

	private createSuccessResult(
		_processId: string,
		context: WorkflowContext,
		invoiceData: InvoiceData,
		xmlContent: string,
		oseStageLog?: StageLog,
		cdrResponse?: import("../../types").CDRResponse,
	): ProcessedInvoice {
		return {
			status: "success",
			invoiceData,
			xmlContent,
			cdrResponse,
			processingLog: this.createProcessingLog(context, oseStageLog),
		};
	}

	private createFailedResult(
		_processId: string,
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

	private createProcessingLog(
		context: WorkflowContext,
		oseStageLog?: StageLog,
	): ProcessingLog {
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
					status: context.extractedData ? "success" : "skipped",
					agentId: "reader",
				},
				parsing: {
					startTime: context.startTime,
					endTime: context.startTime,
					duration: 0,
					status: context.parsedData ? "success" : "skipped",
					agentId: "parser",
				},
				validation: {
					startTime: context.startTime,
					endTime: context.startTime,
					duration: 0,
					status: context.validationResult ? "success" : "skipped",
					agentId: "validator",
				},
				oseSubmission: oseStageLog || {
					startTime: context.startTime,
					endTime: context.startTime,
					duration: 0,
					status: "skipped" as const,
					agentId: "ose",
				},
			},
		};
	}

	/**
	 * Check context threshold and emit PRUNE_REQUESTED event if exceeded.
	 *
	 * Non-blocking — errors are caught and logged.
	 * No-ops when no contextMonitor is configured.
	 */
	private checkContextThreshold(processId: string): void {
		if (!this.config.contextMonitor) return;

		try {
			const shouldPrune = this.config.contextMonitor.shouldPrune(processId);
			if (shouldPrune) {
				const usage = this.config.contextMonitor.getRunUsage(processId);
				if (usage) {
					this.eventBus.emit({
						type: "PRUNE_REQUESTED",
						timestamp: new Date(),
						processId,
						usage: {
							totalTokens: usage.totalTokens,
							contextWindow: usage.modelContextWindow,
							usagePercent:
								(usage.totalTokens / usage.modelContextWindow) * 100,
						},
						threshold: usage.usageRatio,
					});
				}
			}
		} catch (err) {
			loggers.ai.warn("Context threshold check failed", {
				processId,
				error: err,
			});
		}
	}
}
