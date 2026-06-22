/**
 * Mock factory for Prometeo banking API responses.
 *
 * Provides realistic mock responses for the Prometeo banking integration,
 * including account queries, transaction history, and balance checks.
 *
 * @example
 * ```ts
 * const mock = createPrometeoMock();
 * mock.getBalance.mockResolvedValue(prometeoMocks.success({ balance: 5000 }));
 * ```
 */
import { vi } from "vitest";
import type { PrometeoResponse } from "./types";

export function createPrometeoMock() {
	return {
		getBalance: vi.fn<() => Promise<PrometeoResponse>>(),
		getTransactions: vi.fn<() => Promise<PrometeoResponse>>(),
		getAccountInfo: vi.fn<() => Promise<PrometeoResponse>>(),
		initiateTransfer: vi.fn<() => Promise<PrometeoResponse>>(),
		getTransferStatus: vi.fn<() => Promise<PrometeoResponse>>(),
	};
}

/**
 * Pre-built Prometeo success response.
 */
export function prometeoSuccess(
	data?: Record<string, unknown>,
): PrometeoResponse {
	return {
		success: true,
		data: data ?? { balance: 5000, currency: "PEN" },
		statusCode: 200,
	};
}

/**
 * Pre-built Prometeo failure response.
 */
export function prometeoFailure(error = "Account not found"): PrometeoResponse {
	return {
		success: false,
		error,
		statusCode: 404,
	};
}

/**
 * Pre-built Prometeo error response (server error).
 */
export function prometeoError(
	error = "Internal server error",
): PrometeoResponse {
	return {
		success: false,
		error,
		statusCode: 500,
	};
}

/**
 * Pre-built Prometeo unauthorized response.
 */
export function prometeoUnauthorized(): PrometeoResponse {
	return {
		success: false,
		error: "Invalid API credentials",
		statusCode: 401,
	};
}

/**
 * Pre-built Prometeo rate limited response.
 */
export function prometeoRateLimited(): PrometeoResponse {
	return {
		success: false,
		error: "Rate limit exceeded",
		statusCode: 429,
	};
}
