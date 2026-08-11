/**
 * MonthlyCloseOrchestrator — Real Monthly Close Execution (M2)
 * Orchestrates the 10-step monthly close pipeline.
 */

import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
  CloseExecutionResult,
  ApplyResult,
  MissionEventEmitter,
} from "./types/pipeline-types";
import { createEmptyPipelineContext } from "./types/pipeline-types";

export class PipelineBlockedError extends Error {
  public readonly stepName: string;
  public readonly reason: string;

  constructor(stepName: string, reason: string) {
    super('Pipeline blocked at step "' + stepName + '": ' + reason);
    this.name = "PipelineBlockedError";
    this.stepName = stepName;
    this.reason = reason;
  }
}

export class MonthlyCloseOrchestrator {
  private currentStepNumber = 0;

  constructor(
    private readonly db: unknown,
    private readonly fiscalAgent: unknown,
    protected readonly journalEntryPosting: unknown,
    protected readonly periodClose: unknown,
    protected readonly transactionalApply: unknown,
    protected readonly compensatingGenerator: unknown,
    private readonly eventEmitter: MissionEventEmitter,
  ) {}

  async execute(missionId: string, companyId: string): Promise<CloseExecutionResult> {
    try {
      return await this.executeInternal(missionId, companyId);
    } catch (err) {
      if (err instanceof PipelineBlockedError) {
        return { status: "FAILED", missionId };
      }
      throw err;
    }
  }

  private async executeInternal(missionId: string, companyId: string): Promise<CloseExecutionResult> {
    const mission = await this.loadMission(missionId);
    const context = createEmptyPipelineContext(mission.id, mission.companyId, mission.fiscalPeriod);
    context.eventEmitter = this.eventEmitter;

    // Step 1: Freeze Input Snapshot
    const { FreezeSnapshotStep } = await import("./steps/freeze-snapshot.step");
    const snapshot = await this.runStep(
      new FreezeSnapshotStep(),
      { companyId, fiscalPeriod: mission.fiscalPeriod },
      context,
    );
    if (!snapshot.success) return { status: "FAILED", missionId };
    context.inputSnapshot = snapshot.data!;

    // Step 2: Validate Readiness Gates
    const { ValidateGatesStep } = await import("./steps/validate-gates.step");
    const gatesResult = await this.runStep(
      new ValidateGatesStep(),
      { companyId, fiscalPeriod: mission.fiscalPeriod, snapshot: context.inputSnapshot },
      context,
    );

    const blockingGates = (gatesResult.data?.gates ?? []).filter(
      (g: { status: string; type: string }) =>
        g.status === "FAIL" &&
        (g.type === "period_open" || g.type === "prior_period_closed"),
    );

    if (blockingGates.length > 0) {
      context.exceptions.push(...(gatesResult.exceptions ?? []));
      context.gates = gatesResult.data?.gates ?? [];
      await this.blockMission(context, blockingGates);
      return {
        status: "BLOCKED",
        missionId,
        blockers: blockingGates.map((g: { type: string; details: string }) => ({
          gateType: g.type,
          reason: g.details,
          blockedAt: new Date().toISOString(),
        })),
      };
    }

    context.gates = gatesResult.data?.gates ?? [];
    context.exceptions.push(...(gatesResult.exceptions ?? []));

    // Step 3: Analyze Ledger (FiscalAgent) — BLOCKER
    const { AnalyzeLedgerStep } = await import("./steps/analyze-ledger.step");
    const ledger = await this.runStep(
      new AnalyzeLedgerStep(this.fiscalAgent as any),
      { companyId, fiscalPeriod: mission.fiscalPeriod, ledgerVersion: context.inputSnapshot?.ledgerVersion },
      context,
    );
    if (!ledger.success) return { status: "FAILED", missionId };
    context.exceptions.push(...(ledger.exceptions ?? []));

    // Step 4: Analyze Invoices — non-blocker
    const { AnalyzeInvoicesStep } = await import("./steps/analyze-invoices.step");
    const invoices = await this.runStep(
      new AnalyzeInvoicesStep(this.fiscalAgent as any),
      { companyId, fiscalPeriod: mission.fiscalPeriod, invoiceVersion: context.inputSnapshot?.invoiceDatasetVersion },
      context,
    );
    context.exceptions.push(...(invoices.exceptions ?? []));

    // Step 5: Analyze Reconciliations
    const { AnalyzeReconciliationsStep } = await import("./steps/analyze-reconciliations.step");
    const recons = await this.runStep(
      new AnalyzeReconciliationsStep(),
      { companyId, fiscalPeriod: mission.fiscalPeriod },
      context,
    );
    context.exceptions.push(...(recons.exceptions ?? []));

    // Step 6: Analyze Compliance
    const { AnalyzeComplianceStep } = await import("./steps/analyze-compliance.step");
    const compliance = await this.runStep(
      new AnalyzeComplianceStep(),
      { companyId, fiscalPeriod: mission.fiscalPeriod },
      context,
    );
    context.exceptions.push(...(compliance.exceptions ?? []));

    // Step 7: Detect Blockers — BLOCKER
    const { DetectBlockersStep } = await import("./steps/detect-blockers.step");
    const blockerReport = await this.runStep(
      new DetectBlockersStep(),
      { exceptions: context.exceptions, gateResults: context.gates },
      context,
    );

    if (blockerReport.data?.hasBlockers) {
      await this.blockMission(context, blockerReport.data.blockers);
      return { status: "BLOCKED", missionId, blockers: blockerReport.data.blockers };
    }

    // Step 8: Produce Closing Proposal — BLOCKER
    const { ProduceProposalStep } = await import("./steps/produce-proposal.step");
    const proposal = await this.runStep(
      new ProduceProposalStep(),
      { context },
      context,
    );
    if (!proposal.success) return { status: "FAILED", missionId };
    context.proposal = proposal.data;

    // Step 9: Build Evidence
    const { BuildEvidenceStep } = await import("./steps/build-evidence.step");
    await this.runStep(new BuildEvidenceStep(), { context }, context);

    // Step 10: Request Approval — BLOCKER
    const { RequestApprovalStep } = await import("./steps/request-approval.step");
    await this.runStep(new RequestApprovalStep(), { context }, context);

    return { status: "AWAITING_APPROVAL", missionId, proposal: context.proposal };
  }

  async applyEntries(_missionId: string, _companyId: string): Promise<ApplyResult> {
    return { success: false, receiptHash: "", postedEntryIds: [] };
  }

  // ─── Private ──────────────────────────────────────────────────────────

  private async runStep<TInput, TOutput>(
    step: MonthlyCloseStep<TInput, TOutput>,
    input: TInput,
    context: PipelineContext,
  ): Promise<StepResult<TOutput>> {
    this.currentStepNumber++;
    context.currentStep = step.name;

    if (context.eventEmitter) {
      await context.eventEmitter.emitStepProgress(
        context.missionId, this.currentStepNumber, step.name, "STARTED",
      );
    }

    let lastError: Error | null = null;
    const maxAttempts = step.retryPolicy.type === "none" ? 1 : step.retryPolicy.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await step.execute(input, context);

        if (context.eventEmitter) {
          await context.eventEmitter.emitStepProgress(
            context.missionId, this.currentStepNumber, step.name,
            result.success ? "COMPLETED" : "FAILED", result.metrics,
          );
        }

        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (step.retryPolicy.type === "exponential" && attempt < maxAttempts) {
          const delay = step.retryPolicy.baseDelayMs * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    const failedMetrics = {
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      itemsProcessed: 0,
      itemsFailed: 1,
    };

    const failed: StepResult<TOutput> = {
      success: false,
      errors: [{ code: "STEP_FAILED", message: lastError?.message ?? "Unknown error", retryable: false }],
      warnings: [],
      exceptions: [],
      metrics: failedMetrics,
    };

    if (context.eventEmitter) {
      await context.eventEmitter.emitStepProgress(
        context.missionId, this.currentStepNumber, step.name, "FAILED", failedMetrics,
      );
    }

    if (step.isBlocker) {
      await this.transitionMission(context.missionId, "FAILED");
      throw new PipelineBlockedError(step.name, lastError?.message ?? "Unknown error");
    }

    return failed;
  }

  private async loadMission(missionId: string): Promise<{
    id: string; companyId: string; fiscalPeriod: string;
  }> {
    const rows = await (this.db as any)
      .select().from("accounting_missions").where("id", missionId).limit(1);

    if (!rows || rows.length === 0) {
      throw new Error("Mission " + missionId + " not found");
    }

    return rows[0];
  }

  private async blockMission(
    context: PipelineContext,
    blockers: Array<{ gateType?: string; type?: string; reason?: string; details?: string }>,
  ): Promise<void> {
    const mapped = blockers.map((b) => ({
      gateType: b.gateType ?? b.type ?? "unknown",
      reason: b.reason ?? b.details ?? "No reason provided",
      blockedAt: new Date().toISOString(),
    }));

    if (context.eventEmitter) {
      await context.eventEmitter.emitBlockers(context.missionId, mapped);
      await context.eventEmitter.emitStateTransition(context.missionId, "RUNNING", "BLOCKED");
    }

    await (this.db as any)
      .update("accounting_missions")
      .set({ status: "BLOCKED", blockers: mapped })
      .where("id", context.missionId);
  }

  private async transitionMission(missionId: string, toStatus: string): Promise<void> {
    if (this.eventEmitter) {
      await this.eventEmitter.emitStateTransition(missionId, "RUNNING", toStatus);
    }

    await (this.db as any)
      .update("accounting_missions")
      .set({ status: toStatus })
      .where("id", missionId);
  }
}
