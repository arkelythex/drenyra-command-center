import type { CalculateOutput, CategorizeOutput, CollectOutput, FiscalAgentStep, FiscalAgentStepContext, ReconcileOutput, ReportOutput, StepResult } from "@drenyra/application/use-cases/fiscal-agent/types";
export declare class ReporterStep implements FiscalAgentStep<{
    collect: CollectOutput;
    categorize: CategorizeOutput;
    calculate: CalculateOutput;
    reconcile: ReconcileOutput;
}, ReportOutput> {
    readonly name = "report";
    execute(input: {
        collect: CollectOutput;
        categorize: CategorizeOutput;
        calculate: CalculateOutput;
        reconcile: ReconcileOutput;
    }, _context: FiscalAgentStepContext): Promise<StepResult<ReportOutput>>;
}
//# sourceMappingURL=reporter.step.d.ts.map