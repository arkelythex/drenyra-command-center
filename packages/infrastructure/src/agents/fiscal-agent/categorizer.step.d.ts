import type { CategorizeOutput, FiscalAgentStep, FiscalAgentStepContext, ProcessableTransaction, StepResult } from "@drenyra/application/use-cases/fiscal-agent/types";
export declare class CategorizerStep implements FiscalAgentStep<ProcessableTransaction[], CategorizeOutput> {
    readonly name = "categorize";
    execute(transactions: ProcessableTransaction[], _context: FiscalAgentStepContext): Promise<StepResult<CategorizeOutput>>;
}
//# sourceMappingURL=categorizer.step.d.ts.map