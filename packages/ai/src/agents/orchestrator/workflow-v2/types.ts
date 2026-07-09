import type {
	ExtractedData,
	ParsedInvoice,
	StageLog,
	ValidationResult,
} from "../../types";

interface AgentMetrics {
	readonly agentName: string;
	readonly startTime: number;
	readonly endTime?: number;
	readonly duration?: number;
	readonly status: "pending" | "running" | "success" | "failed" | "timeout";
	readonly error?: Error;
	readonly retryCount: number;
}

interface ParallelExecutionResult {
	readonly reader: {
		readonly result: ExtractedData;
		readonly log: StageLog;
		readonly metrics: AgentMetrics;
	} | null;
	readonly parser: {
		readonly result: ParsedInvoice;
		readonly log: StageLog;
		readonly metrics: AgentMetrics;
	} | null;
	readonly validator: {
		readonly result: ValidationResult;
		readonly log: StageLog;
		readonly metrics: AgentMetrics;
	} | null;
	readonly errors: readonly { readonly agent: string; readonly error: Error }[];
	readonly totalDuration: number;
}

interface OrchestratorConfig {
	readonly agentTimeoutMs: number;
	readonly maxRetries: number;
	readonly enableCircuitBreaker: boolean;
	readonly enableMetrics: boolean;
	readonly sessionStore?: import("../../../session/session-store").SessionStore;
	readonly contextMonitor?: import("../../../context-monitor").ContextMonitor;
	readonly pruner?: import("../../../context-monitor").ContextPruner;
	readonly oseService?: {
		readonly sendInvoice: (data: {
			readonly xmlContent: string;
			readonly invoiceNumber: string;
			readonly invoiceType: string;
		}) => Promise<{
			readonly success: boolean;
			readonly cdrContent?: string;
			readonly cdrStatus?: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
			readonly cdrMessage?: string;
			readonly sunatCode?: string;
			readonly error?: string;
		}>;
	};
}

export type { AgentMetrics, OrchestratorConfig, ParallelExecutionResult };

/**
 * Options for skipping phases during session recovery.
 *
 * When a workflow is recovered from PARSING or later, some agent phases
 * can be skipped by providing their preconstructed output data from
 * the persisted context.
 */
export interface PhaseSkipOptions {
	/** Agent phases to skip. Prebuilt data MUST be provided for skipped phases. */
	readonly skipPhases: readonly ("reader" | "parser" | "validator")[];

	/** Preconstructed ExtractedData when skipping the reader phase. */
	readonly prebuiltExtractedData?: import("../../types").ExtractedData;

	/** Preconstructed ParsedData when skipping the parser phase. */
	readonly prebuiltParsedData?: import("../../types").ParsedInvoice;

	/** Preconstructed ValidationResult when skipping the validator phase. */
	readonly prebuiltValidationResult?: import("../../types").ValidationResult;
}
