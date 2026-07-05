/**
 * LLM Gateway helper functions.
 */
import { LLMGatewayError } from "@drenyra/ai/gateway";

export function toHeaderRecord(headers: Headers): Record<string, string> {
	const normalized: Record<string, string> = {};
	headers.forEach((value, key) => {
		normalized[key] = value;
	});
	return normalized;
}

export function handleLLMError(error: unknown): {
	success: false;
	error: {
		code: string;
		message: string;
		provider?: string;
		details?: Record<string, unknown>;
	};
	status: number;
} {
	if (error instanceof LLMGatewayError) {
		return {
			success: false,
			error: {
				code: error.code,
				message: error.message,
				provider: error.provider,
				details: error.details,
			},
			status: error.statusCode,
		};
	}

	const message = error instanceof Error ? error.message : "Unknown error";
	return {
		success: false,
		error: {
			code: "GATEWAY_ERROR",
			message,
		},
		status: 500,
	};
}
