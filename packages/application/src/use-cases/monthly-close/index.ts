/**
 * Monthly Close Orchestrator — Real Monthly Close Execution (M2)
 *
 * PR1: Type foundations — InputSnapshot, ReadinessGates, AccountingException, Pipeline types.
 */

export type {
	EvidenceCounts,
	GateDefinition,
	GateResult,
	GateStatus,
	GateType,
	ReadinessGate,
} from "./gates/readiness-gates";
export {
	allGates,
	evaluateDocumentsProcessed,
	evaluateEntriesBalanced,
	evaluateMinEvidence,
	evaluateNoIncompatibleMissions,
	evaluatePeriodOpen,
	evaluatePriorPeriodClosed,
	evaluateReconciliationsComplete,
} from "./gates/readiness-gates";
export type {
	AccountingException,
	CreateExceptionParams,
	ExceptionCode,
	ExceptionSeverity,
	ResolutionStatus,
} from "./types/accounting-exception";
export {
	createAccountingException,
	EXCEPTION_CODES,
} from "./types/accounting-exception";
export type { InputSnapshot } from "./types/input-snapshot";
export { captureInputSnapshot } from "./types/input-snapshot";

export type {
	BlockerReport,
	CloseExecutionResult,
	ClosingProposal,
	EvidenceRef,
	FinancialImpact,
	GateResults,
	MissionBlocker,
	MissionEventEmitter,
	MonthlyCloseStep,
	PipelineContext,
	PipelineStepResult,
	ProposalLine,
	ProposedEntryType,
	ProposedJournalEntry,
	RetryPolicy,
	StepError,
	StepMetrics,
	StepResult,
	StepStatus,
	TaxImpact,
} from "./types/pipeline-types";
export {
	computeOverallGateStatus,
	createEmptyPipelineContext,
} from "./types/pipeline-types";

// ─── PR2: Orchestrator + Steps ───────────────────────────────────────────

export {
	MonthlyCloseOrchestrator,
	PipelineBlockedError,
} from "./monthly-close-orchestrator";
export type {
	MonthlyCloseMissionRecord,
	MonthlyCloseMissionStore,
} from "./ports/monthly-close-mission-store";
export type {
	AnalyzeComplianceInput,
	ComplianceAnalysis,
} from "./steps/analyze-compliance.step";
export { AnalyzeComplianceStep } from "./steps/analyze-compliance.step";
export type {
	AnalyzeInvoicesInput,
	InvoiceAnalysis,
} from "./steps/analyze-invoices.step";
export { AnalyzeInvoicesStep } from "./steps/analyze-invoices.step";
export type {
	AnalyzeLedgerInput,
	LedgerAnalysis,
} from "./steps/analyze-ledger.step";

export { AnalyzeLedgerStep } from "./steps/analyze-ledger.step";
export type {
	AnalyzeReconciliationsInput,
	ReconciliationAnalysis,
} from "./steps/analyze-reconciliations.step";
export { AnalyzeReconciliationsStep } from "./steps/analyze-reconciliations.step";
export type {
	BuildEvidenceInput,
	EvidenceBundle,
} from "./steps/build-evidence.step";
export { BuildEvidenceStep } from "./steps/build-evidence.step";
export type { DetectBlockersInput } from "./steps/detect-blockers.step";
export { DetectBlockersStep } from "./steps/detect-blockers.step";
export type { FreezeSnapshotInput } from "./steps/freeze-snapshot.step";
export { FreezeSnapshotStep } from "./steps/freeze-snapshot.step";
export type { ProduceProposalInput } from "./steps/produce-proposal.step";

export { ProduceProposalStep } from "./steps/produce-proposal.step";
export type {
	ApprovalRequestResult,
	RequestApprovalInput,
} from "./steps/request-approval.step";
export { RequestApprovalStep } from "./steps/request-approval.step";
export type { ValidateGatesInput } from "./steps/validate-gates.step";
export { ValidateGatesStep } from "./steps/validate-gates.step";
export type { ApplyResult } from "./types/pipeline-types";

// ─── PR3: Posting & Correction ───────────────────────────────────────────

export { CompensatingEntryGenerator } from "./correction/compensating-entry-generator";
export type {
	JournalEntryLineInput,
	PostedJournalEntry,
	PostJournalEntryParams,
} from "./posting/journal-entry-posting.service";
export { JournalEntryPostingService } from "./posting/journal-entry-posting.service";
export type { ClosePeriodParams } from "./posting/period-close.service";
export { PeriodCloseService } from "./posting/period-close.service";
export {
	ApplyError,
	TransactionalApplyUseCase,
} from "./posting/transactional-apply.use-case";
export type {
	CompensatingEntry,
	CompensatingLine,
	CorrectionMissionIntent,
} from "./types/correction-mission";
