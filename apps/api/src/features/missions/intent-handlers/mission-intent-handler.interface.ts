/**
 * MissionIntentHandler — Interface for intent-specific mission execution.
 *
 * Each intent (monthly-close, correction, reconciliation, etc.) can register
 * a handler that controls what happens when the mission transitions to RUNNING
 * and when the AccountingPR is fully approved.
 */
export interface MissionIntentHandler {
  /** Called when mission transitions QUEUED → RUNNING. */
  onRunning(missionId: string, companyId: string): Promise<void>;

  /** Called when AccountingPR reaches POSTED (all signers approved). */
  onApproved(missionId: string, companyId: string): Promise<void>;
}
