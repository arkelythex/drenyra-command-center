import type { FiscalAgentStep, FiscalAgentStepContext, ProcessableTransaction, ReconcileOutput, StepResult } from "@drenyra/application/use-cases/fiscal-agent/types";
export declare class ReconcilerStep implements FiscalAgentStep<ProcessableTransaction[], ReconcileOutput> {
    readonly name = "reconcile";
    execute(transactions: ProcessableTransaction[], _context: FiscalAgentStepContext): Promise<StepResult<ReconcileOutput>>;
}
//# sourceMappingURL=reconciler.step.d.ts.map