/**
 * Session Recovery Module
 * Provides session recovery capabilities for failed or degraded agent runs.
 *
 * @module ai/session/recovery
 */

import { createHash } from "crypto";
import type { SessionStore } from "./session-store";
import type { AgentRunStatus, AgentWorkflowState } from "./session.types";

// ============================================================================
// Types
// ============================================================================

export interface RecoveryResult {
	recoverable: boolean;
	runId: string;
	status: AgentRunStatus;
	workflowState?: string;
	reason?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class SessionRecoveryError extends Error {
	constructor(
		message: string,
		public readonly code:
			| "not_found"
			| "still_running"
			| "already_completed"
			| "checksum_mismatch"
			| "no_input_data",
	) {
		super(message);
		this.name = "SessionRecoveryError";
	}
}

// ============================================================================
// Recovery Status Constants
// ============================================================================

const RECOVERABLE_STATUSES: AgentRunStatus[] = ["failed", "degraded"];

// ============================================================================
// SessionRecovery
// ============================================================================

/**
 * SessionRecovery class.
 * Handles recovery of failed or degraded agent runs by verifying integrity
 * and determining the last completed phase for resumption.
 */
export class SessionRecovery {
	constructor(private readonly sessionStore: SessionStore) {}

	/**
	 * Check whether a run is recoverable.
	 * Returns a RecoveryResult with the status and workflow state.
	 *
	 * @param runId - The run ID to check
	 * @returns A RecoveryResult indicating recoverability
	 */
	async checkRecoverable(runId: string): Promise<RecoveryResult> {
		const state = await this.sessionStore.getRunState(runId);

		if (!state) {
			return {
				recoverable: false,
				runId,
				status: "failed" as AgentRunStatus,
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

	/**
	 * Attempt to recover a failed or degraded run.
	 *
	 * Steps:
	 * 1. Checks if the run is recoverable via checkRecoverable()
	 * 2. Retrieves stored input and verifies checksum against the provided inputData
	 * 3. Determines the last completed phase from the workflowState
	 * 4. Appends a RECOVERY_STARTED event to the run's event log
	 * 5. Returns context for the orchestrator to resume execution
	 *
	 * @param runId - The run ID to recover
	 * @param inputData - The raw input data (base64 encoded) to verify against the stored checksum
	 * @param inputType - The type of input data (e.g., "image", "pdf", "xml")
	 * @returns A context object for the orchestrator to resume from
	 * @throws SessionRecoveryError if the run cannot be recovered or checksum doesn't match
	 */
	async recover(
		runId: string,
		inputData: string,
		inputType: string,
	): Promise<{ context: Record<string, unknown> }> {
		// Step 1: Check if the run is recoverable
		const check = await this.checkRecoverable(runId);

		if (!check.recoverable) {
			switch (check.reason) {
				case "not_found":
					throw new SessionRecoveryError(
						`Run state not found: ${runId}`,
						"not_found",
					);
				case "still_running":
					throw new SessionRecoveryError(
						`Run is still running and cannot be recovered: ${runId}`,
						"still_running",
					);
				case "already_completed":
					throw new SessionRecoveryError(
						`Run already completed and cannot be recovered: ${runId}`,
						"already_completed",
					);
				default:
					throw new SessionRecoveryError(
						`Run is not recoverable: ${check.reason}`,
						"not_found",
					);
			}
		}

		// Step 2: Retrieve stored input and verify checksum
		const storedInput = await this.sessionStore.getInput(runId);

		if (!storedInput) {
			throw new SessionRecoveryError(
				`No input data found for run: ${runId}`,
				"no_input_data",
			);
		}

		const checksum = createHash("sha256").update(inputData).digest("hex");
		if (checksum !== storedInput.checksum) {
			throw new SessionRecoveryError(
				`Input checksum mismatch for run: ${runId}. The provided input differs from the original.`,
				"checksum_mismatch",
			);
		}

		// Step 3: Determine the last completed phase
		const workflowState = check.workflowState;
		const lastCompletedPhase = this.mapToCompletedPhase(workflowState);

		// Step 4: Append RECOVERY_STARTED event
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

		// Step 5: Return context for the orchestrator to resume
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

	/**
	 * Map a workflow state to the last completed phase name.
	 */
	private mapToCompletedPhase(
		workflowState: string | undefined,
	): string {
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

	/**
	 * Determine which phases can be skipped based on the last completed phase.
	 */
	private getSkippedPhases(
		lastCompletedPhase: string,
	): string[] {
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
