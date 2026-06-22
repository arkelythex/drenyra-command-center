export declare const modelFlash: import("@ai-sdk/provider").LanguageModelV3;
export declare const modelReasoning: import("@ai-sdk/provider").LanguageModelV3;
export declare const modelOpus: import("@ai-sdk/provider").LanguageModelV3;
export declare const MODEL_STRATEGY: {
    readonly OCR: "flash";
    readonly EXTRACTION: "flash";
    readonly VALIDATION: "reasoning";
    readonly CORRECTION: "reasoning";
    readonly ANALYSIS: "opus";
};
export type ModelTask = keyof typeof MODEL_STRATEGY;
export declare function getModelForTask(task: ModelTask): import("@ai-sdk/provider").LanguageModelV3;
//# sourceMappingURL=models.d.ts.map