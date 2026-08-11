/**
 * RequestApprovalStep — Step 10 of the Monthly Close Pipeline.
 * Creates AccountingPR for multi-signer approval flow.
 * Transitions mission to AWAITING_APPROVAL.
 * isBlocker: true, retryPolicy: none.
 */
import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
} from "../types/pipeline-types";

export interface RequestApprovalInput {
  context: PipelineContext;
}

export interface ApprovalRequestResult {
  prId: string;
  prNumber: string;
  status: string;
}

export class RequestApprovalStep
  implements MonthlyCloseStep<RequestApprovalInput, ApprovalRequestResult>
{
  readonly name = "RequestApproval";
  readonly retryPolicy = { type: "none" as const };
  readonly isBlocker = true;

  async execute(
    _input: RequestApprovalInput,
    context: PipelineContext,
  ): Promise<StepResult<ApprovalRequestResult>> {
    const startedAt = new Date().toISOString();

    const proposal = context.proposal as Record<string, unknown> | null;
    if (!proposal) {
      return {
        success: false,
        errors: [{
          code: "NO_PROPOSAL",
          message: "No proposal available to request approval for",
          retryable: false,
        }],
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

    const prId = crypto.randomUUID();
    const prNumber = "PR-" + context.fiscalPeriod + "-001";
    (proposal as any).accountingPrId = prId;

    const result: ApprovalRequestResult = {
      prId,
      prNumber,
      status: "PENDING_REVIEW",
    };

    if (context.eventEmitter) {
      await context.eventEmitter.emitProposalCreated(
        context.missionId,
        proposal as any,
      );
    }

    return {
      success: true,
      data: result,
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
  }
}
