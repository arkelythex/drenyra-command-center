import type { CalculateOutput, FiscalAgentStep, FiscalAgentStepContext, ProcessableTransaction, StepResult, TransactionCategorization } from "@drenyra/application/use-cases/fiscal-agent/types";
export declare class CalculatorStep implements FiscalAgentStep<{
    transactions: ProcessableTransaction[];
    categorizations: TransactionCategorization[];
}, CalculateOutput> {
    readonly name = "calculate";
    private regime;
    execute(input: {
        transactions: ProcessableTransaction[];
        categorizations: TransactionCategorization[];
    }, _context: FiscalAgentStepContext): Promise<StepResult<CalculateOutput>>;
    private calculateOne;
}
//# sourceMappingURL=calculator.step.d.ts.map