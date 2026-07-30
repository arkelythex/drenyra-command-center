/**
 * AnalyzeInvoicesStep — Step 4 of the Monthly Close Pipeline.
 * Wraps FiscalNightlyRunUseCase for invoice analysis.
 * isBlocker: false, retryPolicy: exponential (maxRetries=3, baseDelayMs=2000).
 */
import type {
  MonthlyCloseStep,
  StepResult,
  PipelineContext,
} from "../types/pipeline-types";
import type { FiscalNightlyRunUseCase } from "../../fiscal-agent/fiscal-nightly-run.use-case";
import { createAccountingException } from "../types/accounting-exception";

export interface AnalyzeInvoicesInput {
  companyId: string;
  fiscalPeriod: string;
  invoiceVersion: number | null;
}

export interface InvoiceAnalysis {
  totalInvoices: number;
  matchedCount: number;
  unmatchedCount: number;
  sunatDiscrepancies: number;
}

export class AnalyzeInvoicesStep
  implements MonthlyCloseStep<AnalyzeInvoicesInput, InvoiceAnalysis>
{
  readonly name = "AnalyzeInvoices";
  readonly retryPolicy = {
    type: "exponential" as const,
    maxRetries: 3,
    baseDelayMs: 2000,
  };
  readonly isBlocker = false;

  constructor(private readonly fiscalAgent: FiscalNightlyRunUseCase) {}

  async execute(
    input: AnalyzeInvoicesInput,
    context: PipelineContext,
  ): Promise<StepResult<InvoiceAnalysis>> {
    const startedAt = new Date().toISOString();

    try {
      const report = await this.fiscalAgent.execute({
        organizationId: 1,
        companyId: input.companyId,
        period: input.fiscalPeriod.replace("-", ""),
        countryCode: "PE",
      });

      const sunatDiscrepancies = report.steps.filter(
        (s) => s.name === "Reconcile" && !s.success,
      ).length;

      const analysis: InvoiceAnalysis = {
        totalInvoices: report.summary.totalTransactions,
        matchedCount: report.summary.categorized,
        unmatchedCount: report.summary.totalTransactions - report.summary.categorized,
        sunatDiscrepancies,
      };

      const ex = createAccountingException({
        missionId: context.missionId,
        code: "SUNAT_DISCREPANCY",
        severity: "warning",
        subjectRef: "fiscal-agent:invoices",
      });

      return {
        success: true,
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
          itemsProcessed: analysis.totalInvoices,
          itemsFailed: analysis.unmatchedCount,
        },
      };
    } catch (err) {
      throw err;
    }
  }
}
