/**
 * Canonical Mission State Machine — 14 states with validated transitions.
 *
 * Re-exports the canonical 14-state enum from @drenyra/mission-protocol
 * with the runtime state machine logic (transitions, guards).
 * States added in M4: WAITING_FOR_EVIDENCE, BLOCKED_BY_GATE, RETRYING
 */

import { MissionError, MissionErrorCode } from "./mission-errors.js";
import {
	AccountingMissionStatus,
	VALID_TRANSITIONS,
	TERMINAL_STATES,
} from "@drenyra/mission-protocol";

export { AccountingMissionStatus, VALID_TRANSITIONS, TERMINAL_STATES };

const S = AccountingMissionStatus;

/**
 * Transition from one state to another.
 *
 * @returns The new state if the transition is valid.
 * @throws MissionError(INVALID_TRANSITION) if the transition is not allowed.
 */
export function transition(
	from: AccountingMissionStatus,
	to: AccountingMissionStatus,
): AccountingMissionStatus {
	const targets = VALID_TRANSITIONS.get(from);
	if (!targets || !targets.has(to)) {
		throw new MissionError(
			MissionErrorCode.INVALID_TRANSITION,
			undefined,
			`INVALID_TRANSITION: ${from} -> ${to}`,
			{ from, to },
		);
	}
	return to;
}

/**
 * States from which execution can be initiated.
 */
const RUNNABLE_STATES: Set<AccountingMissionStatus> = new Set([
	S.DRAFT,
	S.QUEUED,
	S.REVISION_REQUESTED,
]);

/**
 * Returns true if the mission can be executed from this state.
 */
export function isRunnable(status: AccountingMissionStatus): boolean {
	return RUNNABLE_STATES.has(status);
}

/**
 * Returns true if the mission is waiting for human approval.
 */
export function isAwaitingApproval(status: AccountingMissionStatus): boolean {
	return status === AccountingMissionStatus.AWAITING_APPROVAL;
}

/**
 * Returns true if the state is terminal (no further transitions allowed).
 */
export function isTerminal(status: AccountingMissionStatus): boolean {
	return TERMINAL_STATES.has(status);
}
