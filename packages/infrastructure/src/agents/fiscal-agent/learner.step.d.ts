import type { CorrectionInput, CorrectionRecord, FiscalAgentStep, FiscalAgentStepContext, StepResult } from "@drenyra/application/use-cases/fiscal-agent/types";
export declare class LearnerStep implements FiscalAgentStep<CorrectionInput[], CorrectionRecord[]> {
    readonly name = "learn";
    execute(corrections: CorrectionInput[], _context: FiscalAgentStepContext): Promise<StepResult<CorrectionRecord[]>>;
    private saveCorrection;
}
//# sourceMappingURL=learner.step.d.ts.map