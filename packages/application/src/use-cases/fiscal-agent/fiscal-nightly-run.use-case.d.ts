import type { CorrectionInput, FiscalNightlyRunReport } from "./types";
export declare class FiscalNightlyRunUseCase {
    execute(params: {
        organizationId: number;
        companyId: string;
        period: string;
        countryCode: "PE" | "MX" | "CL" | "CO";
        userId?: string;
    }): Promise<FiscalNightlyRunReport>;
    private runStep;
}
export declare class CorrectionUseCase {
    execute(corrections: CorrectionInput[]): Promise<{
        applied: number;
        failed: number;
    }>;
}
//# sourceMappingURL=fiscal-nightly-run.use-case.d.ts.map