import type { ExtractedData, ParsedInvoice, StageLog, ValidationResult } from "../../types";
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
    readonly errors: readonly {
        readonly agent: string;
        readonly error: Error;
    }[];
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
export interface PhaseSkipOptions {
    readonly skipPhases: readonly ("reader" | "parser" | "validator")[];
    readonly prebuiltExtractedData?: import("../../types").ExtractedData;
    readonly prebuiltParsedData?: import("../../types").ParsedInvoice;
    readonly prebuiltValidationResult?: import("../../types").ValidationResult;
}
//# sourceMappingURL=types.d.ts.map