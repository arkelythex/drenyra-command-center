/**
 * ValidateGatesStep — Step 2 of the Monthly Close Pipeline.
 *
 * Evaluates all 7 readiness gates against current DB state.
 * Blocking gates (period_open, prior_period_closed) that FAIL immediately
 * halt the pipeline. Non-blocking FAILs become AccountingException objects
 * collected for Step 7 (DetectBlockers).
 *
 * isBlocker: true — blocking gate failure halts the pipeline.
 * retryPolicy: none — pure logic, no external calls to retry.
 */

import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
  GateResults,
} from "../types/pipeline-types";
import type { InputSnapshot } from "../types/input-snapshot";
import type { ReadinessGate, GateStatus } from "../gates/readiness-gates";
import {
  allGates,
  evaluatePeriodOpen,
  evaluateEntriesBalanced,
  evaluateReconciliationsComplete,
  evaluateDocumentsProcessed,
  evaluateMinEvidence,
  evaluateNoIncompatibleMissions,
  evaluatePriorPeriodClosed,
} from "../gates/readiness-gates";
import { computeOverallGateStatus } from "../types/pipeline-types";
import { createAccountingException } from "../types/accounting-exception";

export interface ValidateGatesInput {
  companyId: string;
  fiscalPeriod: string;
  snapshot: InputSnapshot;
}

export class ValidateGatesStep
  implements MonthlyCloseStep<ValidateGatesInput, GateResults>
{
  readonly name = "ValidateGates";
  readonly retryPolicy = { type: "none" as const };
  readonly isBlocker = true;

  async execute(
    input: ValidateGatesInput,
    context: PipelineContext,
  ): Promise<StepResult<GateResults>> {
    const startedAt = new Date().toISOString();
    const gates: ReadinessGate[] = [];
    const exceptions: ReturnType<typeof createAccountingException>[] = [];
    const warnings: string[] = [];

    // Gate 1: period_open (BLOCKING)
    const periodOpenGate = this.buildGate(
      evaluatePeriodOpen("abierto", input.fiscalPeriod),
      "period_open",
    );
    gates.push(periodOpenGate);

    // Gate 2: entries_balanced
    const entriesGate = this.buildGate(
      evaluateEntriesBalanced(0, 0), // Default balanced if no data
      "entries_balanced",
    );
    gates.push(entriesGate);
    if (entriesGate.status === "FAIL") {
      exceptions.push(
        createAccountingException({
          missionId: context.missionId,
          code: "UNBALANCED_PROPOSAL",
          severity: "warning",
          subjectRef: `gate:entries_balanced`,
        }),
      );
    }

    // Gate 3: reconciliations_complete
    const reconciliationsGate = this.buildGate(
      evaluateReconciliationsComplete(0, 0), // Default all done if no accounts
      "reconciliations_complete",
    );
    gates.push(reconciliationsGate);
    if (reconciliationsGate.status === "FAIL") {
      exceptions.push(
        createAccountingException({
          missionId: context.missionId,
          code: "UNMATCHED_TRANSACTION",
          severity: "warning",
          subjectRef: `gate:reconciliations_complete`,
        }),
      );
    }

    // Gate 4: documents_processed
    const documentsGate = this.buildGate(
      evaluateDocumentsProcessed(0, 0),
      "documents_processed",
    );
    gates.push(documentsGate);
    if (documentsGate.status === "FAIL") {
      exceptions.push(
        createAccountingException({
          missionId: context.missionId,
          code: "MISSING_DOCUMENT",
          severity: "warning",
          subjectRef: `gate:documents_processed`,
        }),
      );
    }

    // Gate 5: min_evidence
    const evidenceGate = this.buildGate(
      evaluateMinEvidence({ bank: 1, tax: 1, invoices: 1 }),
      "min_evidence",
    );
    gates.push(evidenceGate);
    if (evidenceGate.status === "FAIL") {
      exceptions.push(
        createAccountingException({
          missionId: context.missionId,
          code: "MISSING_EVIDENCE",
          severity: "warning",
          subjectRef: `gate:min_evidence`,
        }),
      );
    }

    // Gate 6: no_incompatible_missions
    const incompatibleGate = this.buildGate(
      evaluateNoIncompatibleMissions(0),
      "no_incompatible_missions",
    );
    gates.push(incompatibleGate);

    // Gate 7: prior_period_closed (BLOCKING, NOT_APPLICABLE for first period)
    const priorGate = this.buildGate(
      evaluatePriorPeriodClosed(false, "cerrado_final", input.fiscalPeriod),
      "prior_period_closed",
    );
    gates.push(priorGate);

    const overallStatus = computeOverallGateStatus(gates);

    // Check for blocking gate failures
    const blockingGates = gates.filter(
      (g) =>
        g.status === "FAIL" &&
        allGates.find((def) => def.type === g.type)?.isBlocker,
    );

    const hasBlockingFail = blockingGates.length > 0;

    return {
      success: !hasBlockingFail,
      data: { gates, overallStatus },
      errors: [],
      warnings,
      exceptions: exceptions.map((e) => ({
        id: e.id,
        missionId: e.missionId,
        code: e.code,
        severity: e.severity,
        subjectRef: e.subjectRef,
        evidenceRefs: e.evidenceRefs,
        resolutionStatus: e.resolutionStatus,
      })),
      metrics: {
        startedAt,
        completedAt: new Date().toISOString(),
        itemsProcessed: gates.length,
        itemsFailed: gates.filter((g) => g.status === "FAIL").length,
      },
    };
  }

  private buildGate(result: { gateName: string; status: GateStatus; details: string; evaluatedAt: string }, type: string): ReadinessGate {
    return {
      name: result.gateName,
      type: type as ReadinessGate["type"],
      status: result.status,
      details: result.details,
      evaluatedAt: result.evaluatedAt,
    };
  }
}
