import type { AgentRunStatus } from "./session.types";
import type { SessionStore } from "./session-store";
export interface RecoveryResult {
    recoverable: boolean;
    runId: string;
    status: AgentRunStatus;
    workflowState?: string;
    reason?: string;
}
export declare class SessionRecoveryError extends Error {
    readonly code: "not_found" | "still_running" | "already_completed" | "checksum_mismatch" | "no_input_data";
    constructor(message: string, code: "not_found" | "still_running" | "already_completed" | "checksum_mismatch" | "no_input_data");
}
export declare class SessionRecovery {
    private readonly sessionStore;
    constructor(sessionStore: SessionStore);
    checkRecoverable(runId: string): Promise<RecoveryResult>;
    recover(runId: string, inputData: string, _inputType: string): Promise<{
        context: Record<string, unknown>;
    }>;
    private mapToCompletedPhase;
    private getSkippedPhases;
}
//# sourceMappingURL=session-recovery.d.ts.map