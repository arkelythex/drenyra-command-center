/**
 * FreezeSnapshotStep — Step 1 of the Monthly Close Pipeline.
 *
 * Captures a frozen snapshot of all input data at close execution start:
 * ledger version, invoice count, bank reconciliation state, exchange rates,
 * and jurisdiction package version.
 *
 * isBlocker: false — snapshot failure proceeds with degraded data.
 * retryPolicy: none — fail-fast on DB errors.
 */

import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
} from "../types/pipeline-types";
import type { InputSnapshot } from "../types/input-snapshot";
import { captureInputSnapshot } from "../types/input-snapshot";

export interface FreezeSnapshotInput {
  companyId: string;
  fiscalPeriod: string;
}

export class FreezeSnapshotStep
  implements MonthlyCloseStep<FreezeSnapshotInput, InputSnapshot>
{
  readonly name = "FreezeSnapshot";
  readonly retryPolicy = { type: "none" as const };
  readonly isBlocker = false;

  async execute(
    input: FreezeSnapshotInput,
    _context: PipelineContext,
  ): Promise<StepResult<InputSnapshot>> {
    const startedAt = new Date().toISOString();

    try {
      // In PR2, we use the factory which creates a snapshot with null versions.
      // Full DB queries (ledger, invoices, exchange rates) come in PR3.
      const snapshot = captureInputSnapshot(input.companyId, input.fiscalPeriod);

      return {
        success: true,
        data: snapshot,
        errors: [],
        warnings: [],
        exceptions: [],
        metrics: {
          startedAt,
          completedAt: new Date().toISOString(),
          itemsProcessed: 1,
          itemsFailed: 0,
        },
      };
    } catch (err) {
      return {
        success: false,
        errors: [
          {
            code: "SNAPSHOT_FAILED",
            message: err instanceof Error ? err.message : String(err),
            retryable: false,
          },
        ],
        warnings: [],
        exceptions: [],
        metrics: {
          startedAt,
          completedAt: new Date().toISOString(),
          itemsProcessed: 0,
          itemsFailed: 1,
        },
      };
    }
  }
}
