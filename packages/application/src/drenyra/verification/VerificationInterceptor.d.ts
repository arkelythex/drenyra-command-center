import type { AgentRunOutput, VerificationReport } from "@drenyra/domain/drenyra";
export interface VerificationContext {
    companyRuc?: string;
    period: string;
    sourceData?: Record<string, unknown>;
}
export declare function verifyAgentRunOutput(output: AgentRunOutput, context: VerificationContext & {
    summary?: string;
    recommendedActions?: string[];
    changes?: Array<{
        field: string;
    }>;
}): VerificationReport;
//# sourceMappingURL=VerificationInterceptor.d.ts.map