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
  RetryPolicy,
  StepMetrics,
  StepError,
  StepResult,
  MonthlyCloseStep,
  CloseExecutionResult,
  ProposedEntryType,
  ProposalLine,
  ProposedJournalEntry,
  TaxImpact,
  FinancialImpact,
  ClosingProposal,
  EvidenceRef,
  MissionEventEmitter,
} from "./types/pipeline-types";
export {
  createEmptyPipelineContext,
  computeOverallGateStatus,
} from "./types/pipeline-types";

// ─── PR2: Orchestrator + Steps ───────────────────────────────────────────

export { MonthlyCloseOrchestrator, PipelineBlockedError } from "./monthly-close-orchestrator";
export type { ApplyResult } from "./types/pipeline-types";

export { FreezeSnapshotStep } from "./steps/freeze-snapshot.step";
export type { FreezeSnapshotInput } from "./steps/freeze-snapshot.step";

export { ValidateGatesStep } from "./steps/validate-gates.step";
export type { ValidateGatesInput } from "./steps/validate-gates.step";

export { AnalyzeLedgerStep } from "./steps/analyze-ledger.step";
export type { AnalyzeLedgerInput, LedgerAnalysis } from "./steps/analyze-ledger.step";

export { AnalyzeInvoicesStep } from "./steps/analyze-invoices.step";
export type { AnalyzeInvoicesInput, InvoiceAnalysis } from "./steps/analyze-invoices.step";

export { AnalyzeReconciliationsStep } from "./steps/analyze-reconciliations.step";
export type { AnalyzeReconciliationsInput, ReconciliationAnalysis } from "./steps/analyze-reconciliations.step";

export { AnalyzeComplianceStep } from "./steps/analyze-compliance.step";
export type { AnalyzeComplianceInput, ComplianceAnalysis } from "./steps/analyze-compliance.step";

export { DetectBlockersStep } from "./steps/detect-blockers.step";
export type { DetectBlockersInput } from "./steps/detect-blockers.step";

export { ProduceProposalStep } from "./steps/produce-proposal.step";
export type { ProduceProposalInput } from "./steps/produce-proposal.step";

export { BuildEvidenceStep } from "./steps/build-evidence.step";
export type { BuildEvidenceInput, EvidenceBundle } from "./steps/build-evidence.step";

export { RequestApprovalStep } from "./steps/request-approval.step";
export type { RequestApprovalInput, ApprovalRequestResult } from "./steps/request-approval.step";

// ─── PR3: Posting & Correction ───────────────────────────────────────────

export { JournalEntryPostingService } from "./posting/journal-entry-posting.service";
export type { PostJournalEntryParams, JournalEntryLineInput, PostedJournalEntry } from "./posting/journal-entry-posting.service";

export { PeriodCloseService } from "./posting/period-close.service";
export type { ClosePeriodParams } from "./posting/period-close.service";

export { TransactionalApplyUseCase, ApplyError } from "./posting/transactional-apply.use-case";

export { CompensatingEntryGenerator } from "./correction/compensating-entry-generator";
export type { CompensatingEntry, CompensatingLine, CorrectionMissionIntent } from "./types/correction-mission";
