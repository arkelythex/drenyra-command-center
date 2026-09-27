import { vi } from "vitest";
export function createLLMProviderMock() {
    return {
        generateText: vi.fn(),
        streamText: vi.fn(),
        generateObject: vi.fn(),
        countTokens: vi.fn(),
    };
}
export function llmSuccess(text = "Generated response text", overrides) {
    return {
        text,
        usage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150,
        },
        finishReason: "stop",
        ...overrides,
    };
}
export function llmFailure(_error = "API error") {
    return {
        text: "",
        finishReason: "error",
    };
}
export function llmRateLimited(retryAfter = 30) {
    return {
        text: JSON.stringify({
            error: "rate_limit_exceeded",
            retryAfter,
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        }),
        usage: {
            promptTokens: 10,
            completionTokens: 0,
            totalTokens: 10,
        },
        finishReason: "rate_limited",
    };
}
export function llmDocumentExtraction() {
    return {
        text: JSON.stringify({
            providerRUC: "20601234567",
            providerName: "EMPRESA DEMO SAC",
            totalAmount: 1180,
            currency: "PEN",
            issueDate: "2026-01-15",
            documentNumber: "F001-00001234",
        }),
        usage: {
            promptTokens: 500,
            completionTokens: 100,
            totalTokens: 600,
        },
        finishReason: "stop",
    };
}
export function llmInvoiceClassification() {
    return {
        text: JSON.stringify({
            documentType: "factura",
            confidence: 0.95,
            category: "gastos_operativos",
        }),
        usage: {
            promptTokens: 300,
            completionTokens: 80,
            totalTokens: 380,
        },
        finishReason: "stop",
    };
}
export function llmStructuredOutput(data, overrides) {
    return {
        text: JSON.stringify(data),
        usage: {
            promptTokens: 200,
            completionTokens: 80,
            totalTokens: 280,
        },
        finishReason: "stop",
        ...overrides,
    };
}
export function llmExtractionResponse(overrides) {
    return {
        text: JSON.stringify({
            ruc: "20601234567",
            total: 1180,
            igv: 180,
            series: "F001",
            number: "00001234",
            currency: "PEN",
            issueDate: "2026-01-15",
            ...overrides,
        }),
        usage: {
            promptTokens: 500,
            completionTokens: 100,
            totalTokens: 600,
        },
        finishReason: "stop",
    };
}
export function llmClassificationResponse(overrides) {
    return {
        text: JSON.stringify({
            category: "gastos_operativos",
            confidence: 0.95,
            documentType: "factura",
            ...overrides,
        }),
        usage: {
            promptTokens: 300,
            completionTokens: 80,
            totalTokens: 380,
        },
        finishReason: "stop",
    };
}
//# sourceMappingURL=llm-provider.mock.js.map