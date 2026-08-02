/**
 * @drenyra/mission-domain — mission-status ADAPTER SHIM.
 *
 * The canonical mission status logic now lives in `drenyra-ai` (released
 * v0.0.1-prealpha.1, consumed via the `mission-protocol` dependency).
 * This file re-exports the status vocabulary from the single authority.
 * Explicit names only — the divergent legacy types (mission-contracts,
 * mission-events, mission-errors) stay local until consumers are aligned.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; version/sequence numbers are JSON integers,
 * never floats.
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
