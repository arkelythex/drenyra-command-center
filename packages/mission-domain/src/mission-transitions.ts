/**
 * Mission transition guards and recovery helpers.
 *
 * Provides validated transition functions that throw MissionError
 * on invalid operations, plus UNKNOWN state reconciliation.
 */

import {
  AccountingMissionStatus,
  TERMINAL_STATES,
  transition,
} from "./mission-status.js";
import { MissionError, MissionErrorCode } from "./mission-errors.js";

const S = AccountingMissionStatus;

/**
 * Validates a transition and throws MissionError(INVALID_TRANSITION) if invalid.
 *
 * Thin wrapper around transition() from mission-status. Exists as a
 * separate function because the caller may want to differentiate between
 * "just check" (validateTransition) and "transition AND get new state" (transition).
 */
export function validateTransition(
  from: AccountingMissionStatus,
  to: AccountingMissionStatus,
): void {
  transition(from, to);
}

/**
 * Guards against mutation of terminal states.
 *
 * Throws MissionError(TERMINAL_STATE_GUARD, 409) if the status
 * is COMPLETED or FAILED — no further transitions are allowed.
 */
export function guardTerminal(status: AccountingMissionStatus): void {
  if (TERMINAL_STATES.has(status)) {
    throw new MissionError(
      MissionErrorCode.TERMINAL_STATE_GUARD,
      409,
      `TERMINAL_STATE_GUARD: Cannot mutate terminal state ${status}`,
      { status },
    );
  }
}

/**
 * Valid recovery targets for UNKNOWN state reconciliation.
 */
const RECOVERY_TARGETS: Set<AccountingMissionStatus> = new Set([
  S.RUNNING,
  S.FAILED,
  S.COMPLETED,
]);

/**
 * Reconcilable transitions for UNKNOWN state.
 *
 * UNKNOWN is a special state: it does NOT participate in the standard
 * VALID_TRANSITIONS map. Instead, it has its own recovery mechanism
 * via the reconcile endpoint.
 */
const UNKNOWN_RECOVERY_TRANSITIONS: Map<
  AccountingMissionStatus,
  Set<AccountingMissionStatus>
> = new Map([[S.UNKNOWN, RECOVERY_TARGETS]]);

/**
 * Resolves a mission from UNKNOWN to a known recovery state.
 *
 * @throws MissionError(INVALID_TRANSITION) if:
 *   - The mission is not UNKNOWN
 *   - The resolution target is not a valid recovery path
 */
export function reconcileTransition(
  from: AccountingMissionStatus,
  resolution: AccountingMissionStatus,
): AccountingMissionStatus {
  if (from !== S.UNKNOWN) {
    throw new MissionError(
      MissionErrorCode.INVALID_TRANSITION,
      undefined,
      `INVALID_TRANSITION: reconcile only allowed from UNKNOWN, got ${from}`,
      { from, resolution },
    );
  }

  const targets = UNKNOWN_RECOVERY_TRANSITIONS.get(from);
  if (!targets || !targets.has(resolution)) {
    throw new MissionError(
      MissionErrorCode.INVALID_TRANSITION,
      undefined,
      `INVALID_TRANSITION: Invalid recovery resolution UNKNOWN -> ${resolution}`,
      { from, resolution },
    );
  }

  return resolution;
}

/**
 * Returns true if the transition is a valid recovery path.
 *
 * Recovery is only valid from UNKNOWN to RUNNING, FAILED, or COMPLETED.
 */
export function isValidRecoveryPath(
  from: AccountingMissionStatus,
  to: AccountingMissionStatus,
): boolean {
  return from === S.UNKNOWN && RECOVERY_TARGETS.has(to);
}
