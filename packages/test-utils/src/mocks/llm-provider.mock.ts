/**
 * Mock factory for LLM/AI provider responses.
 *
 * Provides mock implementations for OpenAI, Anthropic, and Google
 * AI providers used in the ARKELYTHEX AI features.
 *
 * @example
 * ```ts
 * const mock = createLLMProviderMock();
 * mock.generateText.mockResolvedValue(llmMocks.success('Extracted data'));
 * ```
 */
import { vi } from "vitest";
import type { LLMResponse } from "./types";

export function createLLMProviderMock() {
	return {
		generateText: vi.fn<() => Promise<LLMResponse>>(),
		streamText: vi.fn<() => AsyncIterable<{ text: string }>>(),
		generateObject: vi.fn<() => Promise<{ object: Record<string, unknown> }>>(),
		countTokens: vi.fn<() => Promise<number>>(),
	};
}

/**
 * Pre-built LLM success response.
 */
export function llmSuccess(
	text = "Generated response text",
	overrides?: Partial<LLMResponse>,
): LLMResponse {
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

/**
 * Pre-built LLM failure response.
 */
export function llmFailure(_error = "API error"): LLMResponse {
	return {
		text: "",
		finishReason: "error",
	};
}

/**
 * Pre-built LLM rate limited response.
 * Includes retryAfter field indicating seconds to wait before retrying.
 */
export function llmRateLimited(
	retryAfter = 30,
): LLMResponse {
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

/**
 * Pre-built LLM response for document extraction.
 */
export function llmDocumentExtraction(): LLMResponse {
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

/**
 * Pre-built LLM response for invoice classification.
 */
export function llmInvoiceClassification(): LLMResponse {
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

// ============================================================
// STRUCTURED OUTPUT HELPERS
// ============================================================

/**
 * Pre-built LLM response with structured JSON output.
 *
 * Returns a response with JSON.stringify(data) as text and
 * finishReason "stop". Useful for testing structured output
 * parsing in AI extraction and classification features.
 *
 * @typeParam T - The type of structured data
 * @param data - The structured data to serialize
 * @param overrides - Optional overrides for the response
 *
 * @example
 * ```ts
 * const response = llmStructuredOutput({ ruc: "20601234567", total: 1180 });
 * // { text: '{"ruc":"20601234567","total":1180}', finishReason: "stop" }
 * ```
 */
export function llmStructuredOutput<T = Record<string, unknown>>(
	data: T,
	overrides?: Partial<LLMResponse>,
): LLMResponse {
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

/**
 * Pre-built LLM response for document/invoice extraction.
 *
 * Returns structured extraction data including RUC, total, IGV,
 * series, and document number fields from an invoice or document image.
 *
 * @param overrides - Optional overrides for the extracted data
 *
 * @example
 * ```ts
 * const response = llmExtractionResponse();
 * const data = JSON.parse(response.text);
 * // { ruc: "20601234567", total: 1180, igv: 180, series: "F001", number: "00001234" }
 * ```
 */
export function llmExtractionResponse(
	overrides?: Partial<{
		ruc: string;
		total: number;
		igv: number;
		series: string;
		number: string;
		currency: string;
		issueDate: string;
	}>,
): LLMResponse {
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

/**
 * Pre-built LLM response for document classification.
 *
 * Returns structured classification data with category and confidence score.
 *
 * @param overrides - Optional overrides for the classification data
 *
 * @example
 * ```ts
 * const response = llmClassificationResponse();
 * const data = JSON.parse(response.text);
 * // { category: "gastos_operativos", confidence: 0.95 }
 * ```
 */
export function llmClassificationResponse(
	overrides?: Partial<{
		category: string;
		confidence: number;
		documentType: string;
	}>,
): LLMResponse {
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
