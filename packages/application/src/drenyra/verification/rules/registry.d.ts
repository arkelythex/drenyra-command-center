import { type FiscalRiskLevel, type VerifiedFinding } from "@drenyra/domain/drenyra";
import type { VerificationContext } from "../VerificationInterceptor";
export declare function runVerificationRules(findings: string[], riskLevel: FiscalRiskLevel, context: VerificationContext & {
    summary?: string;
    recommendedActions?: string[];
    changes?: Array<{
        field: string;
    }>;
}): VerifiedFinding[];
//# sourceMappingURL=registry.d.ts.map