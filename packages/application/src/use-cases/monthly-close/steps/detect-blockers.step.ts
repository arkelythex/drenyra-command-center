/**
 * DetectBlockersStep — Step 7 of the Monthly Close Pipeline.
 *
 * Consolidates all exceptions from Steps 2-6.
 * Categorizes by severity. Blocking exceptions → mission BLOCKED.
 * No blockers → passes all non-blocking exceptions forward.
 *
 * isBlocker: true
 * retryPolicy: none — pure logic.
 */

import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
  BlockerReport,
  MissionBlocker,
} from "../types/pipeline-types";
import type { AccountingException } from "../types/accounting-exception";
import type { ReadinessGate } from "../gates/readiness-gates";

export interface DetectBlockersInput {
  exceptions: AccountingException[];
  gateResults: ReadinessGate[];
}

export class DetectBlockersStep
  implements MonthlyCloseStep<DetectBlockersInput, BlockerReport>
{
  readonly name = "DetectBlockers";
  readonly retryPolicy = { type: "none" as const };
  readonly isBlocker = true;

  async execute(
    input: DetectBlockersInput,
    _context: PipelineContext,
  ): Promise<StepResult<BlockerReport>> {
    const startedAt = new Date().toISOString();

    const blockers: MissionBlocker[] = [];

    // Check for blocking exceptions
    const blockingExceptions = input.exceptions.filter(
      (e) => e.severity === "blocking",
    );

    for (const ex of blockingExceptions) {
      blockers.push({
        gateType: ex.code,
        reason: `Blocking exception: ${ex.code} on ${ex.subjectRef}`,
        blockedAt: new Date().toISOString(),
      });
    }

    // Check for failed blocking gates from Step 2
    const blockingGates = input.gateResults.filter(
      (g) => g.status === "FAIL" && (g.type === "period_open" || g.type === "prior_period_closed"),
    );

    for (const gate of blockingGates) {
      blockers.push({
        gateType: gate.type,
        reason: gate.details,
        blockedAt: new Date().toISOString(),
      });
    }

    const hasBlockers = blockers.length > 0;

    return {
      success: !hasBlockers,
      data: { hasBlockers, blockers },
      errors: [],
      warnings: blockers.length > 0 ? [`${blockers.length} blocker(s) detected`] : [],
      exceptions: [],
      metrics: {
        startedAt,
        completedAt: new Date().toISOString(),
        itemsProcessed: input.exceptions.length + input.gateResults.length,
        itemsFailed: blockers.length,
      },
    };
  }
}
