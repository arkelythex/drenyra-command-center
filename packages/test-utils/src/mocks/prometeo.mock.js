import { vi } from "vitest";
export function createPrometeoMock() {
    return {
        getBalance: vi.fn(),
        getTransactions: vi.fn(),
        getAccountInfo: vi.fn(),
        initiateTransfer: vi.fn(),
        getTransferStatus: vi.fn(),
    };
}
export function prometeoSuccess(data) {
    return {
        success: true,
        data: data ?? { balance: 5000, currency: "PEN" },
        statusCode: 200,
    };
}
export function prometeoFailure(error = "Account not found") {
    return {
        success: false,
        error,
        statusCode: 404,
    };
}
export function prometeoError(error = "Internal server error") {
    return {
        success: false,
        error,
        statusCode: 500,
    };
}
export function prometeoUnauthorized() {
    return {
        success: false,
        error: "Invalid API credentials",
        statusCode: 401,
    };
}
export function prometeoRateLimited() {
    return {
        success: false,
        error: "Rate limit exceeded",
        statusCode: 429,
    };
}
//# sourceMappingURL=prometeo.mock.js.map