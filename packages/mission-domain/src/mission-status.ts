/**
 * Canonical Mission State Machine — 11 states with validated transitions.
 *
 * Single source of truth for mission status and transition rules.
 * Consumed by apps/api (enforcement) and apps/web (UI predicates).
 */

import { MissionError, MissionErrorCode } from "./mission-errors.js";

/**
 * The 11 canonical accounting mission states.
 */
export enum AccountingMissionStatus {
  DRAFT = "DRAFT",
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  BLOCKED = "BLOCKED",
  AWAITING_APPROVAL = "AWAITING_APPROVAL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REVISION_REQUESTED = "REVISION_REQUESTED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  UNKNOWN = "UNKNOWN",
}

const S = AccountingMissionStatus;

/**
 * Valid transitions matrix (spec §1.1).
 *
 * COMPLETED and FAILED are excluded because they are terminal.
 */
export const VALID_TRANSITIONS: Map<AccountingMissionStatus, Set<AccountingMissionStatus>> = new Map([
  [S.DRAFT, new Set([S.QUEUED])],
  [S.QUEUED, new Set([S.RUNNING, S.FAILED])],
  [
    S.RUNNING,
    new Set([
      S.BLOCKED,
      S.AWAITING_APPROVAL,
      S.COMPLETED,
      S.FAILED,
      S.UNKNOWN,
    ]),
  ],
  [S.BLOCKED, new Set([S.RUNNING, S.FAILED])],
  [
    S.AWAITING_APPROVAL,
    new Set([S.APPROVED, S.REJECTED, S.RUNNING]),
  ],
  [S.APPROVED, new Set([S.COMPLETED, S.FAILED])],
  [S.REJECTED, new Set([S.REVISION_REQUESTED])],
  [S.REVISION_REQUESTED, new Set([S.QUEUED])],
  [S.COMPLETED, new Set()],
  [S.FAILED, new Set()],
  [
    S.UNKNOWN,
    new Set([S.RUNNING, S.FAILED, S.COMPLETED]),
  ],
]);

/**
 * Terminal states: no transitions out.
 */
export const TERMINAL_STATES: Set<AccountingMissionStatus> = new Set([
  S.COMPLETED,
  S.FAILED,
]);

/**
 * Transition from one state to another.
 *
 * @returns The new state if the transition is valid.
 * @throws MissionError(INVALID_TRANSITION) if the transition is not allowed.
 */
export function transition(from: AccountingMissionStatus, to: AccountingMissionStatus): AccountingMissionStatus {
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
 *
 * NOTE: REJECTED is NOT terminal — it can transition to REVISION_REQUESTED.
 */
export function isTerminal(status: AccountingMissionStatus): boolean {
  return TERMINAL_STATES.has(status);
}
