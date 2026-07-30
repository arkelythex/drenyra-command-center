/**
 * Monthly Close Orchestrator — Real Monthly Close Execution (M2)
 *
 * PR1: Type foundations — InputSnapshot, ReadinessGates, AccountingException, Pipeline types.
 */

export type { InputSnapshot } from "./types/input-snapshot";
export { captureInputSnapshot } from "./types/input-snapshot";

export type {
  GateStatus,
  GateType,
  ReadinessGate,
  GateResult,
  GateDefinition,
  EvidenceCounts,
} from "./gates/readiness-gates";
export {
  allGates,
  evaluatePeriodOpen,
  evaluateEntriesBalanced,
  evaluateReconciliationsComplete,
  evaluateDocumentsProcessed,
  evaluateMinEvidence,
  evaluateNoIncompatibleMissions,
  evaluatePriorPeriodClosed,
} from "./gates/readiness-gates";

export type {
  AccountingException,
  ExceptionSeverity,
  ResolutionStatus,
  ExceptionCode,
  CreateExceptionParams,
} from "./types/accounting-exception";
export {
  EXCEPTION_CODES,
  createAccountingException,
} from "./types/accounting-exception";

export type {
  StepStatus,
  PipelineStepResult,
  PipelineContext,
  GateResults,
  MissionBlocker,
  BlockerReport,
} from "./types/pipeline-types";
export {
  createEmptyPipelineContext,
  computeOverallGateStatus,
} from "./types/pipeline-types";
