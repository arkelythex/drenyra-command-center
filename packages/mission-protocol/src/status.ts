/**
 * Compatibility surface for the canonical drenyra-ai mission status contract.
 * Transport-agnostic: the single source of truth for mission lifecycle states.
 */
export {
	/** The 14 canonical accounting mission states (11 original + 3 M4). */
	AccountingMissionStatus,
	/** Extended states that require human intervention to resolve. */
	EXTENDED_STATES,
	/** Returns true if the mission is waiting for human approval. */
	isAwaitingApproval,
	/** Returns true if the mission is in a recoverable state (can return to `RUNNING`). */
	isRecoverable,
	/** Returns true if the mission can be resumed (not just started fresh). */
	isResumable,
	/** Returns true if the mission can be executed from this state. */
	isRunnable,
	/** Returns true if the state is terminal. */
	isTerminal,
	/** Returns true if the mission is paused waiting for human intervention. */
	isWaitingForHuman,
	/** Human-readable label for each status. */
	STATUS_LABELS,
	/** Terminal states: no transitions out. */
	TERMINAL_STATES,
	/**
	 * Valid transitions matrix. `COMPLETED`/`FAILED` are terminal, `UNKNOWN`
	 * only allows recovery transitions, extended states can only return to
	 * `RUNNING` or go terminal.
	 */
	VALID_TRANSITIONS,
} from "drenyra-ai/missions";
