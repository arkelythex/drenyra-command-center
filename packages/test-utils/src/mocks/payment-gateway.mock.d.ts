export interface PaymentResponse {
    transactionId: string;
    status: "completed" | "failed" | "pending";
    amount: number;
    currency: string;
    error?: string;
    redirectUrl?: string;
    timestamp: Date;
}
export declare function createPaymentGatewayMock(): {
    processPayment: import("vitest").Mock<() => Promise<PaymentResponse>>;
    refundPayment: import("vitest").Mock<() => Promise<PaymentResponse>>;
    getPaymentStatus: import("vitest").Mock<() => Promise<PaymentResponse>>;
};
export declare function paymentSuccess(overrides?: Partial<PaymentResponse>): PaymentResponse;
export declare function paymentFailure(overrides?: Partial<PaymentResponse>): PaymentResponse;
export declare function paymentPending(overrides?: Partial<PaymentResponse>): PaymentResponse;
//# sourceMappingURL=payment-gateway.mock.d.ts.map