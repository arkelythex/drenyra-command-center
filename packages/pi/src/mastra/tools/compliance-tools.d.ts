export declare const createFindingTool: import("@mastra/core/tools").Tool<{
    severity: "info" | "low" | "medium" | "high" | "critical";
    category: string;
    message: string;
    recommendedAction: string;
    evidenceRefs?: string[] | undefined;
    requiresApproval?: boolean | undefined;
}, {
    id: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
    category: string;
    message: string;
    evidenceRefs: string[];
    recommendedAction: string;
    requiresApproval: boolean;
}, unknown, unknown, import("@mastra/core/tools").ToolExecutionContext<unknown, unknown, unknown>, "compliance-create-finding", unknown>;
export declare const riskScoreTool: import("@mastra/core/tools").Tool<{
    findings: {
        id: string;
        severity: "info" | "low" | "medium" | "high" | "critical";
        category: string;
        message: string;
        evidenceRefs: string[];
        recommendedAction: string;
        requiresApproval: boolean;
    }[];
}, {
    riskScore: number;
}, unknown, unknown, import("@mastra/core/tools").ToolExecutionContext<unknown, unknown, unknown>, "compliance-risk-score", unknown>;
export declare const redactTool: import("@mastra/core/tools").Tool<{
    value: unknown;
}, {
    redacted: unknown;
}, unknown, unknown, import("@mastra/core/tools").ToolExecutionContext<unknown, unknown, unknown>, "compliance-redact", unknown>;
//# sourceMappingURL=compliance-tools.d.ts.map