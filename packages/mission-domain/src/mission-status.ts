/**
 * Compatibility surface for the canonical drenyra-ai mission state machine.
 *
 * The authoritative status values, transition guards, and state helpers live in
 * `drenyra-ai/missions`. This file preserves the historical module path without
 * maintaining a second implementation.
 */

export {
	AccountingMissionStatus,
	isAwaitingApproval,
	isRunnable,
	isTerminal,
	TERMINAL_STATES,
	transition,
	VALID_TRANSITIONS,
} from "drenyra-ai/missions";
