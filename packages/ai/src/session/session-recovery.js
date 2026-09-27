import { createHash } from "node:crypto";
export class SessionRecoveryError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "SessionRecoveryError";
    }
}
const RECOVERABLE_STATUSES = ["failed", "degraded"];
export class SessionRecovery {
    sessionStore;
    constructor(sessionStore) {
        this.sessionStore = sessionStore;
    }
    async checkRecoverable(runId) {
        const state = await this.sessionStore.getRunState(runId);
        if (!state) {
            return {
                recoverable: false,
                runId,
                status: "failed",
                reason: "not_found",
            };
        }
        if (state.status === "running") {
            return {
                recoverable: false,
                runId,
                status: state.status,
                workflowState: state.workflowState ?? undefined,
                reason: "still_running",
            };
        }
        if (state.status === "completed") {
            return {
                recoverable: false,
                runId,
                status: state.status,
                workflowState: state.workflowState ?? undefined,
                reason: "already_completed",
            };
        }
        if (RECOVERABLE_STATUSES.includes(state.status) && state.workflowState) {
            return {
                recoverable: true,
                runId,
                status: state.status,
                workflowState: state.workflowState,
            };
        }
        return {
            recoverable: false,
            runId,
            status: state.status,
            workflowState: state.workflowState ?? undefined,
            reason: `unrecoverable_status: ${state.status}`,
        };
    }
    async recover(runId, inputData, _inputType) {
        const check = await this.checkRecoverable(runId);
        if (!check.recoverable) {
            switch (check.reason) {
                case "not_found":
                    throw new SessionRecoveryError(`Run state not found: ${runId}`, "not_found");
                case "still_running":
                    throw new SessionRecoveryError(`Run is still running and cannot be recovered: ${runId}`, "still_running");
                case "already_completed":
                    throw new SessionRecoveryError(`Run already completed and cannot be recovered: ${runId}`, "already_completed");
                default:
                    throw new SessionRecoveryError(`Run is not recoverable: ${check.reason}`, "not_found");
            }
        }
        const storedInput = await this.sessionStore.getInput(runId);
        if (!storedInput) {
            throw new SessionRecoveryError(`No input data found for run: ${runId}`, "no_input_data");
        }
        const checksum = createHash("sha256").update(inputData).digest("hex");
        if (checksum !== storedInput.checksum) {
            throw new SessionRecoveryError(`Input checksum mismatch for run: ${runId}. The provided input differs from the original.`, "checksum_mismatch");
        }
        const workflowState = check.workflowState;
        const lastCompletedPhase = this.mapToCompletedPhase(workflowState);
        const state = await this.sessionStore.getRunState(runId);
        await this.sessionStore.appendEvent(runId, {
            runId,
            eventType: "RECOVERY_STARTED",
            payload: {
                lastCompletedPhase,
                previousWorkflowState: workflowState,
                recoveredAt: new Date().toISOString(),
            },
            companyId: state?.companyId ?? "unknown",
        });
        return {
            context: {
                runId,
                lastCompletedPhase,
                previousWorkflowState: workflowState,
                previousStatus: check.status,
                skippedPhases: this.getSkippedPhases(lastCompletedPhase),
            },
        };
    }
    mapToCompletedPhase(workflowState) {
        switch (workflowState) {
            case "EXTRACTING":
                return "reader";
            case "PARSING":
                return "parser";
            case "VALIDATING":
                return "validator";
            case "ARBITRATING":
                return "arbitration";
            default:
                return "none";
        }
    }
    getSkippedPhases(lastCompletedPhase) {
        switch (lastCompletedPhase) {
            case "reader":
                return ["reader"];
            case "parser":
                return ["reader", "parser"];
            case "validator":
                return ["reader", "parser", "validator"];
            case "arbitration":
                return ["reader", "parser", "validator", "arbitration"];
            default:
                return [];
        }
    }
}
//# sourceMappingURL=session-recovery.js.map