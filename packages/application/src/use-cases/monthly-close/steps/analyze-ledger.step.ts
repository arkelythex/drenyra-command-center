/**
 * AnalyzeLedgerStep — Step 3 of the Monthly Close Pipeline.
 * Wraps FiscalNightlyRunUseCase for ledger analysis.
 * isBlocker: true, retryPolicy: exponential (maxRetries=3, baseDelayMs=2000).
 */
import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
} from "../types/pipeline-types";
import type { FiscalNightlyRunUseCase } from "../../fiscal-agent/fiscal-nightly-run.use-case";
import { createAccountingException } from "../types/accounting-exception";

export interface AnalyzeLedgerInput {
  companyId: string;
  fiscalPeriod: string;
  ledgerVersion: number | null;
}

export interface LedgerAnalysis {
  transactionCount: number;
  categorizedCount: number;
  exceptionCount: number;
  lowConfidenceCount: number;
}

export class AnalyzeLedgerStep
  implements MonthlyCloseStep<AnalyzeLedgerInput, LedgerAnalysis>
{
  readonly name = "AnalyzeLedger";
  readonly retryPolicy = {
    type: "exponential" as const,
    maxRetries: 3,
    baseDelayMs: 2000,
  };
  readonly isBlocker = true;

  constructor(private readonly fiscalAgent: FiscalNightlyRunUseCase) {}

  async execute(
    input: AnalyzeLedgerInput,
    context: PipelineContext,
  ): Promise<StepResult<LedgerAnalysis>> {
    const startedAt = new Date().toISOString();

    try {
      const report = await this.fiscalAgent.execute({
        organizationId: 1,
        companyId: input.companyId,
        period: input.fiscalPeriod.replace("-", ""),
        countryCode: "PE",
      });

      const analysis: LedgerAnalysis = {
        transactionCount: report.summary.totalTransactions,
        categorizedCount: report.summary.categorized,
        exceptionCount: report.summary.exceptions,
        lowConfidenceCount: report.steps.filter((s) => !s.success).length,
      };

      const ex = createAccountingException({
        missionId: context.missionId,
        code: "LOW_CONFIDENCE_CATEGORIZATION",
        severity: "warning",
        subjectRef: "fiscal-agent:ledger",
      });

      return {
        success: report.status !== "FAILED",
        data: analysis,
        errors: [],
        warnings: [],
        exceptions: [{
          id: ex.id, missionId: ex.missionId, code: ex.code,
          severity: ex.severity, subjectRef: ex.subjectRef,
          evidenceRefs: ex.evidenceRefs, resolutionStatus: ex.resolutionStatus,
        }],
        metrics: {
          startedAt,
          completedAt: new Date().toISOString(),
          itemsProcessed: analysis.transactionCount,
          itemsFailed: analysis.lowConfidenceCount,
        },
      };
    } catch (err) {
      throw err;
    }
  }
}
