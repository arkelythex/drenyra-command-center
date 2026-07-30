/**
 * Pipeline types — Step results, PipelineContext, GateResults, and blockers.
 *
 * PR1 — Type foundations for Real Monthly Close Execution.
 */

import type { InputSnapshot } from "./input-snapshot";
import type { AccountingException } from "./accounting-exception";
import type { ReadinessGate, GateStatus, GateType } from "../gates/readiness-gates";

// ─── Step Status ───────────────────────────────────────────────────────────

export type StepStatus = "PENDING" | "STARTED" | "COMPLETED" | "FAILED" | "SKIPPED";

// ─── Retry Policy ──────────────────────────────────────────────────────────

export type RetryPolicy =
  | { type: "none" }
  | { type: "fixed"; maxRetries: number; delayMs: number }
  | { type: "exponential"; maxRetries: number; baseDelayMs: number };

// ─── Step Metrics ──────────────────────────────────────────────────────────

export interface StepMetrics {
  startedAt: string;
  completedAt: string;
  itemsProcessed: number;
  itemsFailed: number;
}

// ─── Step Error ────────────────────────────────────────────────────────────

export interface StepError {
  code: string;
  message: string;
  itemId?: string;
  retryable: boolean;
}

// ─── StepResult ────────────────────────────────────────────────────────────

export interface StepResult<TOutput = unknown> {
  success: boolean;
  data?: TOutput;
  errors: StepError[];
  warnings: string[];
  exceptions: AccountingException[];
  metrics: StepMetrics;
}

// ─── MonthlyCloseStep interface ────────────────────────────────────────────

export interface MonthlyCloseStep<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly retryPolicy: RetryPolicy;
  readonly isBlocker: boolean;
  execute(input: TInput, context: PipelineContext): Promise<StepResult<TOutput>>;
}

// ─── PipelineStepResult ────────────────────────────────────────────────────

export interface PipelineStepResult {
  /** Name of the step (e.g., "freeze-snapshot", "validate-gates") */
  stepName: string;

  /** Execution status */
  status: StepStatus;

  /** Optional output data from the step */
  data?: unknown;

  /** Exceptions collected during this step */
  exceptions: AccountingException[];

  /** Gate results (only populated by validate-gates step) */
  gates: ReadinessGate[];

  /** ISO 8601 timestamp */
  timestamp: string;
}

// ─── PipelineContext ───────────────────────────────────────────────────────

export interface PipelineContext {
  /** Mission identifier */
  missionId: string;

  /** Company identifier */
  companyId: string;

  /** Fiscal period in YYYY-MM format */
  fiscalPeriod: string;

  /** Frozen input snapshot (populated by Step 1, null before that) */
  inputSnapshot: InputSnapshot | null;

  /** Accumulated gate results from Step 2 */
  gates: ReadinessGate[];

  /** Accumulated exceptions from all steps */
  exceptions: AccountingException[];

  /** Closing proposal (populated by Step 8, null before that) */
  proposal: unknown;

  /** Current step identifier */
  currentStep: string;

  /** Errors encountered during pipeline execution */
  errors: string[];

  /** Event emitter for SSE progress events */
  eventEmitter: MissionEventEmitter | null;
}

// ─── GateResults ───────────────────────────────────────────────────────────

export interface GateResults {
  /** All individual gate results */
  gates: ReadinessGate[];

  /** Overall status computed from all gates (most severe) */
  overallStatus: GateStatus;
}

// ─── MissionBlocker ────────────────────────────────────────────────────────

export interface MissionBlocker {
  /** The gate type that caused the block */
  gateType: string;

  /** Human-readable reason for the block */
  reason: string;

  /** ISO 8601 timestamp when the block was detected */
  blockedAt: string;
}

// ─── BlockerReport ─────────────────────────────────────────────────────────

export interface BlockerReport {
  /** Whether any blockers exist */
  hasBlockers: boolean;

  /** The list of blockers */
  blockers: MissionBlocker[];
}

// ─── CloseExecutionResult ──────────────────────────────────────────────────

export interface CloseExecutionResult {
  status: "COMPLETED" | "BLOCKED" | "FAILED" | "AWAITING_APPROVAL";
  missionId: string;
  blockers?: MissionBlocker[];
  proposal?: unknown;
}

// ─── ApplyResult ───────────────────────────────────────────────────────────

export interface ApplyResult {
  success: boolean;
  receiptHash: string;
  postedEntryIds: string[];
}

// ─── ClosingProposal types ─────────────────────────────────────────────────

export type ProposedEntryType = "DEPRECIATION" | "ACCRUAL" | "TAX_PROVISION" | "PL_CLOSE" | "CORRECTION";

export interface ProposalLine {
  accountCode: string;
  accountName: string;
  description: string;
  debitCents: number;
  creditCents: number;
}

export interface ProposedJournalEntry {
  id: string;
  entryType: ProposedEntryType;
  description: string;
  date: string;
  lines: ProposalLine[];
  totalDebits: number;
  totalCredits: number;
  sourceEvidence: string[];
}

export interface TaxImpact {
  igvPayableCents: number;
  rentaPayableCents: number;
  totalTaxLiabilityCents: number;
}

export interface FinancialImpact {
  totalRevenueCents: number;
  totalExpenseCents: number;
  netIncomeCents: number;
}

export interface ClosingProposal {
  id: string;
  missionId: string;
  version: number;
  fiscalPeriod: string;
  generatedAt: string;
  proposedEntries: ProposedJournalEntry[];
  entryCount: number;
  totalDebitCents: number;
  totalCreditCents: number;
  taxImpact: TaxImpact;
  financialImpact: FinancialImpact;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  unresolvedExceptions: AccountingException[];
  requiredApprovals: string[];
  sourceEvidence: EvidenceRef[];
  evidenceHash: string;
}

export interface EvidenceRef {
  id: string;
  type: string;
  hash: string;
  uri: string;
}

// ─── MissionEventEmitter ───────────────────────────────────────────────────

export interface MissionEventEmitter {
  emitStepProgress(
    missionId: string,
    stepNumber: number,
    stepName: string,
    status: "STARTED" | "COMPLETED" | "FAILED",
    metrics?: StepMetrics,
  ): Promise<void>;

  emitBlockers(missionId: string, blockers: MissionBlocker[]): Promise<void>;

  emitProposalCreated(missionId: string, proposal: ClosingProposal): Promise<void>;

  emitStateTransition(
    missionId: string,
    fromStatus: string,
    toStatus: string,
  ): Promise<void>;
}

// ─── Factory ───────────────────────────────────────────────────────────────

/**
 * Creates an empty PipelineContext with the given identity fields.
 */
export function createEmptyPipelineContext(
  missionId: string,
  companyId: string,
  fiscalPeriod: string,
): PipelineContext {
  return {
    missionId,
    companyId,
    fiscalPeriod,
    inputSnapshot: null,
    gates: [],
    exceptions: [],
    proposal: null,
    currentStep: "",
    errors: [],
    eventEmitter: null,
  };
}

// ─── Gate Status Computation ───────────────────────────────────────────────

const STATUS_SEVERITY: Record<GateStatus, number> = {
  FAIL: 4,
  UNKNOWN: 3,
  WARN: 2,
  PASS: 1,
  NOT_APPLICABLE: 0,
};

/**
 * Computes the overall gate status from a list of individual gate results.
 * Returns the most severe status among all gates.
 * NOT_APPLICABLE is treated as PASS (severity 0).
 */
export function computeOverallGateStatus(gates: ReadinessGate[]): GateStatus {
  if (gates.length === 0) return "PASS";

  let worstSeverity = 0;
  let worstStatus: GateStatus = "PASS";

  for (const gate of gates) {
    const severity = STATUS_SEVERITY[gate.status] ?? 0;
    if (severity > worstSeverity) {
      worstSeverity = severity;
      worstStatus = gate.status;
    }
  }

  return worstStatus;
}
