import type { CollectOutput, FiscalAgentStep, FiscalAgentStepContext, StepResult } from "@drenyra/application/use-cases/fiscal-agent/types";
export declare class CollectorStep implements FiscalAgentStep<void, CollectOutput> {
    readonly name = "collect";
    execute(_input: undefined, context: FiscalAgentStepContext): Promise<StepResult<CollectOutput>>;
    private fetchLocalTransactions;
}
//# sourceMappingURL=collector.step.d.ts.map