import { vi } from "vitest";
export function createPaymentGatewayMock() {
    return {
        processPayment: vi.fn(),
        refundPayment: vi.fn(),
        getPaymentStatus: vi.fn(),
    };
}
export function paymentSuccess(overrides) {
    return {
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "completed",
        amount: 10000,
        currency: "PEN",
        timestamp: new Date(),
        ...overrides,
    };
}
export function paymentFailure(overrides) {
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
export function paymentPending(overrides) {
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
//# sourceMappingURL=payment-gateway.mock.js.map