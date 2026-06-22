/**
 * Shared mock type definitions for all mock factories.
 */

/**
 * Generic mock factory interface for external services.
 *
 * Provides standardized methods for creating success, failure,
 * and timeout mock responses.
 */
export interface MockFactory<T> {
	/** Create a successful response with optional data overrides */
	success(data?: Partial<T>): T;
	/** Create a failure response with the given error */
	failure(error: Error): T;
	/** Create a timeout response (promise that never resolves) */
	timeout(ms?: number): Promise<T>;
}

/**
 * SUNAT API response shape for mocking.
 */
export interface SunatResponse {
	ticket?: string;
	status: "accepted" | "rejected" | "pending" | "error";
	cdrCode?: string;
	cdrDescription?: string;
	errorMessage?: string;
	responseDate?: Date;
}

/**
 * Prometeo API response shape for mocking.
 */
export interface PrometeoResponse {
	success: boolean;
	data?: Record<string, unknown>;
	error?: string;
	statusCode: number;
}

/**
 * LLM Provider response shape for mocking.
 */
export interface LLMResponse {
	text: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	finishReason?: string;
}

/**
 * Email service response shape for mocking.
 */
export interface EmailResponse {
	messageId: string;
	status: "sent" | "failed" | "queued";
	error?: string;
}
