import type { LLMResponse } from "./types";
export declare function createLLMProviderMock(): {
    generateText: import("vitest").Mock<() => Promise<LLMResponse>>;
    streamText: import("vitest").Mock<() => AsyncIterable<{
        text: string;
    }>>;
    generateObject: import("vitest").Mock<() => Promise<{
        object: Record<string, unknown>;
    }>>;
    countTokens: import("vitest").Mock<() => Promise<number>>;
};
export declare function llmSuccess(text?: string, overrides?: Partial<LLMResponse>): LLMResponse;
export declare function llmFailure(_error?: string): LLMResponse;
export declare function llmRateLimited(retryAfter?: number): LLMResponse;
export declare function llmDocumentExtraction(): LLMResponse;
export declare function llmInvoiceClassification(): LLMResponse;
export declare function llmStructuredOutput<T = Record<string, unknown>>(data: T, overrides?: Partial<LLMResponse>): LLMResponse;
export declare function llmExtractionResponse(overrides?: Partial<{
    ruc: string;
    total: number;
    igv: number;
    series: string;
    number: string;
    currency: string;
    issueDate: string;
}>): LLMResponse;
export declare function llmClassificationResponse(overrides?: Partial<{
    category: string;
    confidence: number;
    documentType: string;
}>): LLMResponse;
//# sourceMappingURL=llm-provider.mock.d.ts.map