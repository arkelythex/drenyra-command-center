/**
 * AccountingException type — structured issues discovered during pipeline execution.
 *
 * PR1 — Type foundations for Real Monthly Close Execution.
 */

// ─── Severity ──────────────────────────────────────────────────────────────

export type ExceptionSeverity = "info" | "warning" | "blocking";

// ─── Resolution Status ─────────────────────────────────────────────────────

export type ResolutionStatus = "open" | "resolved" | "waived";

// ─── AccountingException ───────────────────────────────────────────────────

export interface AccountingException {
  /** Unique identifier for this exception */
  id: string;

  /** The mission this exception belongs to */
  missionId: string;

  /** Machine-readable exception code */
  code: string;

  /** Severity level: info, warning, or blocking */
  severity: ExceptionSeverity;

  /** Reference to the subject entity (e.g., "bankTx:uuid", "invoice:uuid") */
  subjectRef: string;

  /** Evidence item IDs supporting this exception */
  evidenceRefs: string[];

  /** Current resolution state */
  resolutionStatus: ResolutionStatus;
}

// ─── Exception Codes ───────────────────────────────────────────────────────

export const EXCEPTION_CODES = [
  "UNMATCHED_TRANSACTION",
  "LOW_CONFIDENCE_CATEGORIZATION",
  "SUNAT_DISCREPANCY",
  "MISSING_DOCUMENT",
  "INVALID_ACCOUNT_CODE",
  "UNBALANCED_PROPOSAL",
  "EXCHANGE_RATE_DEVIATION",
  "MISSING_EVIDENCE",
  "TAX_CALCULATION_ANOMALY",
] as const;

export type ExceptionCode = (typeof EXCEPTION_CODES)[number];

// ─── Factory ───────────────────────────────────────────────────────────────

export interface CreateExceptionParams {
  missionId: string;
  code: string;
  severity: ExceptionSeverity;
  subjectRef: string;
  evidenceRefs?: string[];
}

/**
 * Creates an AccountingException with a generated UUID.
 */
export function createAccountingException(
  params: CreateExceptionParams,
): AccountingException {
  return {
    id: crypto.randomUUID(),
    missionId: params.missionId,
    code: params.code,
    severity: params.severity,
    subjectRef: params.subjectRef,
    evidenceRefs: params.evidenceRefs ?? [],
    resolutionStatus: "open",
  };
}
