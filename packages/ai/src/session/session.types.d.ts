export type AgentRunStatus = "running" | "completed" | "failed" | "manual_review" | "degraded" | "ose_submitting";
export type AgentWorkflowState = "IDLE" | "EXTRACTING" | "PARSING" | "VALIDATING" | "ARBITRATING" | "OSE_SUBMITTING" | "COMPLETED" | "FAILED" | "MANUAL_REVIEW";
export interface AgentRunState {
    id: string;
    runId: string;
    sessionId: string | null;
    workflowState: AgentWorkflowState | null;
    agentMetrics: Record<string, unknown> | null;
    context: Record<string, unknown> | null;
    status: AgentRunStatus;
    error: string | null;
    companyId: string;
    startedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface AgentRunEvent {
    id?: number;
    runId: string;
    eventType: string;
    payload: Record<string, unknown> | null;
    companyId: string;
    createdAt?: Date;
}
export interface RunStateFilter {
    companyId: string;
    status?: AgentRunStatus;
    sessionId?: string;
    limit?: number;
    offset?: number;
}
export interface StateSnapshot {
    state: AgentRunState;
    events: AgentRunEvent[];
}
export type BatchStatus = "pending" | "running" | "completed" | "failed" | "partial";
export type BatchItemStatus = "pending" | "running" | "completed" | "failed";
export interface BatchRunData {
    id: string;
    companyId: string;
    status: BatchStatus;
    total: number;
    completed: number;
    failed: number;
    createdAt: Date;
    completedAt: Date | null;
    sessionId: string | null;
}
export interface BatchItemData {
    id: string;
    batchId: string;
    runId: string;
    status: BatchItemStatus;
    error: string | null;
    createdAt: Date;
}
export declare class SessionStoreError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
export interface RunInput {
    runId: string;
    inputType: string;
    inputData: string;
    checksum: string;
    createdAt: Date;
}
export declare class SessionNotFoundError extends SessionStoreError {
    constructor(runId: string);
}
//# sourceMappingURL=session.types.d.ts.map