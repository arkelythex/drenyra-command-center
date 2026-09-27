declare const complianceCheckWorkflow: import("@mastra/core/workflows").Workflow<import("@mastra/core/workflows").DefaultEngineType, import("@mastra/core/workflows").Step<string, unknown, unknown, unknown, unknown, unknown, any, unknown>[], "compliance-check", unknown, {
    task: {
        id: string;
        type: string;
        payload?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    };
}, {
    result: unknown;
}, {
    task: {
        id: string;
        type: string;
        payload?: Record<string, unknown> | undefined;
        metadata?: Record<string, unknown> | undefined;
    };
}, unknown>;
export { complianceCheckWorkflow };
//# sourceMappingURL=compliance-check.d.ts.map