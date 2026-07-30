/**
 * ReadinessGates — Automated evaluation of 7 close readiness conditions.
 *
 * PR1 — Type foundations for Real Monthly Close Execution.
 * Each gate evaluator is a pure function that takes pre-queried data
 * and returns a GateResult. In PR2, the orchestrator will query the DB
 * and pipe results through these evaluators.
 */

// ─── Gate Status ───────────────────────────────────────────────────────────

export type GateStatus = "PASS" | "FAIL" | "WARN" | "UNKNOWN" | "NOT_APPLICABLE";

// ─── Gate Types ────────────────────────────────────────────────────────────

export type GateType =
  | "period_open"
  | "entries_balanced"
  | "reconciliations_complete"
  | "documents_processed"
  | "min_evidence"
  | "no_incompatible_missions"
  | "prior_period_closed";

// ─── ReadinessGate ─────────────────────────────────────────────────────────

export interface ReadinessGate {
  name: string;
  type: GateType;
  status: GateStatus;
  details: string;
  evaluatedAt: string;
}

// ─── GateResult ────────────────────────────────────────────────────────────

export interface GateResult {
  gateName: string;
  status: GateStatus;
  details: string;
  evaluatedAt: string;
}

// ─── Gate Definition (for registry) ────────────────────────────────────────

export interface GateDefinition {
  type: GateType;
  name: string;
  isBlocker: boolean;
}

// ─── Evidence Counts (for min_evidence gate) ──────────────────────────────

export interface EvidenceCounts {
  bank: number;
  tax: number;
  invoices: number;
}

// ─── allGates — Registry of all 7 gates ────────────────────────────────────

export const allGates: GateDefinition[] = [
  { type: "period_open", name: "Periodo Abierto", isBlocker: true },
  { type: "entries_balanced", name: "Asientos Balanceados", isBlocker: false },
  {
    type: "reconciliations_complete",
    name: "Conciliaciones Completas",
    isBlocker: false,
  },
  {
    type: "documents_processed",
    name: "Documentos Procesados",
    isBlocker: false,
  },
  { type: "min_evidence", name: "Evidencia Mínima", isBlocker: false },
  {
    type: "no_incompatible_missions",
    name: "Sin Misiones Incompatibles",
    isBlocker: false,
  },
  {
    type: "prior_period_closed",
    name: "Período Anterior Cerrado",
    isBlocker: true,
  },
];

// ─── Helper ────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

// ─── Gate 1: period_open (BLOCKING) ───────────────────────────────────────

/**
 * Evaluates whether the accounting period is currently open.
 * BLOCKING: FAIL prevents the close from proceeding.
 *
 * @param periodStatus - The status from accounting_periods (e.g., "abierto", "cerrado_parcial")
 * @param fiscalPeriod - The period being evaluated (e.g., "2026-06")
 */
export function evaluatePeriodOpen(
  periodStatus: string | undefined,
  fiscalPeriod: string,
): GateResult {
  if (!periodStatus) {
    return {
      gateName: "period_open",
      status: "FAIL",
      details: `No accounting period found for ${fiscalPeriod}`,
      evaluatedAt: now(),
    };
  }

  const isOpen = periodStatus === "abierto";
  return {
    gateName: "period_open",
    status: isOpen ? "PASS" : "FAIL",
    details: isOpen
      ? `Period ${fiscalPeriod} is 'abierto' — ready to close`
      : `Period ${fiscalPeriod} is '${periodStatus}', expected 'abierto'`,
    evaluatedAt: now(),
  };
}

// ─── Gate 2: entries_balanced ─────────────────────────────────────────────

/**
 * Evaluates whether total debits equal total credits for the period.
 * Non-blocking: FAIL becomes an exception collected for Step 7.
 *
 * @param totalDebits - SUM of debitCents for the period
 * @param totalCredits - SUM of creditCents for the period
 */
export function evaluateEntriesBalanced(
  totalDebits: number,
  totalCredits: number,
): GateResult {
  const balanced = totalDebits === totalCredits;
  return {
    gateName: "entries_balanced",
    status: balanced ? "PASS" : "FAIL",
    details: balanced
      ? "All entries balance (total debits = total credits)"
      : `Unbalanced: total debits ${totalDebits}, total credits ${totalCredits}`,
    evaluatedAt: now(),
  };
}

// ─── Gate 3: reconciliations_complete ─────────────────────────────────────

/**
 * Evaluates whether all bank accounts have completed reconciliations.
 * Non-blocking.
 *
 * @param totalAccounts - Total number of bank accounts for the company
 * @param completedReconciliations - Number of accounts with COMPLETED reconciliation
 */
export function evaluateReconciliationsComplete(
  totalAccounts: number,
  completedReconciliations: number,
): GateResult {
  const allDone = totalAccounts === 0 || completedReconciliations >= totalAccounts;
  return {
    gateName: "reconciliations_complete",
    status: allDone ? "PASS" : "FAIL",
    details: allDone
      ? "All bank accounts have completed reconciliations"
      : `${completedReconciliations} of ${totalAccounts} bank accounts have completed reconciliations`,
    evaluatedAt: now(),
  };
}

// ─── Gate 4: documents_processed ──────────────────────────────────────────

/**
 * Evaluates whether all CPE documents have been processed.
 * Non-blocking.
 *
 * @param pendingCount - Number of documents in 'pendiente' status
 * @param rejectedCount - Number of documents in 'rechazado' status
 */
export function evaluateDocumentsProcessed(
  pendingCount: number,
  rejectedCount: number,
): GateResult {
  const hasIssues = pendingCount > 0 || rejectedCount > 0;
  const parts: string[] = [];
  if (pendingCount > 0) parts.push(`${pendingCount} pending`);
  if (rejectedCount > 0) parts.push(`${rejectedCount} rejected`);

  return {
    gateName: "documents_processed",
    status: hasIssues ? "FAIL" : "PASS",
    details: hasIssues
      ? `Documents with issues: ${parts.join(", ")}`
      : "All documents have been processed",
    evaluatedAt: now(),
  };
}

// ─── Gate 5: min_evidence ─────────────────────────────────────────────────

/**
 * Evaluates whether minimum evidence exists for each required category.
 * Non-blocking. Required categories: bank, tax, invoices.
 *
 * @param counts - Evidence counts per category
 */
export function evaluateMinEvidence(counts: EvidenceCounts): GateResult {
  const missing: string[] = [];
  if (counts.bank === 0) missing.push("bank");
  if (counts.tax === 0) missing.push("tax");
  if (counts.invoices === 0) missing.push("invoices");

  const hasAll = missing.length === 0;
  return {
    gateName: "min_evidence",
    status: hasAll ? "PASS" : "FAIL",
    details: hasAll
      ? "All evidence categories have at least one item"
      : `Missing evidence in categories: ${missing.join(", ")}`,
    evaluatedAt: now(),
  };
}

// ─── Gate 6: no_incompatible_missions ─────────────────────────────────────

/**
 * Evaluates whether there are other non-terminal monthly-close missions
 * for the same company and period.
 * Non-blocking.
 *
 * @param activeMissionCount - Number of other non-terminal monthly-close missions
 */
export function evaluateNoIncompatibleMissions(
  activeMissionCount: number,
): GateResult {
  const hasConflict = activeMissionCount > 0;
  return {
    gateName: "no_incompatible_missions",
    status: hasConflict ? "FAIL" : "PASS",
    details: hasConflict
      ? `${activeMissionCount} other non-terminal monthly-close mission(s) exist for this period`
      : "No incompatible missions found",
    evaluatedAt: now(),
  };
}

// ─── Gate 7: prior_period_closed (BLOCKING, NOT_APPLICABLE for first period)

/**
 * Evaluates whether the prior period is closed.
 * BLOCKING: FAIL prevents the close from proceeding.
 * NOT_APPLICABLE: first period for the company.
 *
 * @param isFirstPeriod - Whether this is the company's first accounting period
 * @param priorPeriodStatus - Status of the prior period (null if no prior period row)
 * @param fiscalPeriod - The period being evaluated
 */
export function evaluatePriorPeriodClosed(
  isFirstPeriod: boolean,
  priorPeriodStatus: string | null,
  fiscalPeriod: string,
): GateResult {
  if (isFirstPeriod) {
    return {
      gateName: "prior_period_closed",
      status: "NOT_APPLICABLE",
      details: `First accounting period for this company — no prior period check needed for ${fiscalPeriod}`,
      evaluatedAt: now(),
    };
  }

  if (priorPeriodStatus === null) {
    return {
      gateName: "prior_period_closed",
      status: "UNKNOWN",
      details: "No prior accounting period found — treating as unknown",
      evaluatedAt: now(),
    };
  }

  const closed =
    priorPeriodStatus === "cerrado_final" || priorPeriodStatus === "auditado";

  return {
    gateName: "prior_period_closed",
    status: closed ? "PASS" : "FAIL",
    details: closed
      ? `Prior period is '${priorPeriodStatus}' — ready to close ${fiscalPeriod}`
      : `Prior period is '${priorPeriodStatus}', must be 'cerrado_final' or 'auditado' before closing ${fiscalPeriod}`,
    evaluatedAt: now(),
  };
}
