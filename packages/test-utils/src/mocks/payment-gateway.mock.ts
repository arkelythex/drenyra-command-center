/**
 * Mock factory for payment gateway responses.
 *
 * Provides realistic mock responses for payment processing services,
 * including success, failure, pending, and timeout scenarios.
 *
 * @example
 * ```ts
 * const mock = createPaymentGatewayMock();
 * mock.processPayment.mockResolvedValue(paymentSuccess());
 * ```
 */
import { vi } from "vitest";

/**
 * Payment gateway response shape for mocking.
 */
export interface PaymentResponse {
	transactionId: string;
	status: "completed" | "failed" | "pending";
	amount: number;
	currency: string;
	error?: string;
	redirectUrl?: string;
	timestamp: Date;
}

/**
 * Create a full payment gateway mock with standard methods.
 *
 * Returns vi.fn() stubs for processPayment, refundPayment, and getPaymentStatus.
 *
 * @example
 * ```ts
 * const mock = createPaymentGatewayMock();
 * mock.processPayment.mockResolvedValue(paymentSuccess({ amount: 5000 }));
 * ```
 */
export function createPaymentGatewayMock() {
	return {
		processPayment: vi.fn<() => Promise<PaymentResponse>>(),
		refundPayment: vi.fn<() => Promise<PaymentResponse>>(),
		getPaymentStatus: vi.fn<() => Promise<PaymentResponse>>(),
	};
}

/**
 * Pre-built payment success response.
 */
export function paymentSuccess(
	overrides?: Partial<PaymentResponse>,
): PaymentResponse {
	return {
		transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		status: "completed",
		amount: 10000,
		currency: "PEN",
		timestamp: new Date(),
		...overrides,
	};
}

/**
 * Pre-built payment failure response.
 */
export function paymentFailure(
	overrides?: Partial<PaymentResponse>,
): PaymentResponse {
	return {
		transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		status: "failed",
		amount: 10000,
		currency: "PEN",
		error: "Fondos insuficientes",
		timestamp: new Date(),
		...overrides,
	};
}

/**
 * Pre-built payment pending response.
 * Includes a redirectUrl for 3DS or similar authentication flows.
 */
export function paymentPending(
	overrides?: Partial<PaymentResponse>,
): PaymentResponse {
	return {
		transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		status: "pending",
		amount: 10000,
		currency: "PEN",
		redirectUrl: "https://checkout.example.com/3ds/authenticate?txn=txn_test",
		timestamp: new Date(),
		...overrides,
	};
}
