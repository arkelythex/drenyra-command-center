/**
 * Compatibility surface for the canonical drenyra-ai mission state machine.
 *
 * The authoritative status values, transition guards, and state helpers live in
 * `drenyra-ai/missions`. This file preserves the historical module path without
 * maintaining a second implementation.
 */

export {
	/** The 14 canonical accounting mission states (11 original + 3 M4: `WAITING_FOR_EVIDENCE`, `BLOCKED_BY_GATE`, `RETRYING`). */
	AccountingMissionStatus,
	/** Returns true if the mission is waiting for human approval. */
	isAwaitingApproval,
	/** Returns true if the mission can be executed from this state. */
	isRunnable,
	/** Returns true if the state is terminal (`COMPLETED` or `FAILED` — no transitions out). */
	isTerminal,
	/** Terminal states: no transitions out. */
	TERMINAL_STATES,
	/**
	 * Transitions from one state to another.
	 * @returns The new state if the transition is valid.
	 * @throws MissionError(INVALID_TRANSITION) if the transition is not allowed.
	 */
	transition,
	/**
	 * Valid transitions matrix. `COMPLETED`/`FAILED` are terminal, `UNKNOWN`
	 * only allows recovery transitions, and extended states can only return
	 * to `RUNNING` or go terminal.
	 */
	VALID_TRANSITIONS,
} from "drenyra-ai/missions";
