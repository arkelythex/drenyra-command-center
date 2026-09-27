import type { PrometeoResponse } from "./types";
export declare function createPrometeoMock(): {
    getBalance: import("vitest").Mock<() => Promise<PrometeoResponse>>;
    getTransactions: import("vitest").Mock<() => Promise<PrometeoResponse>>;
    getAccountInfo: import("vitest").Mock<() => Promise<PrometeoResponse>>;
    initiateTransfer: import("vitest").Mock<() => Promise<PrometeoResponse>>;
    getTransferStatus: import("vitest").Mock<() => Promise<PrometeoResponse>>;
};
export declare function prometeoSuccess(data?: Record<string, unknown>): PrometeoResponse;
export declare function prometeoFailure(error?: string): PrometeoResponse;
export declare function prometeoError(error?: string): PrometeoResponse;
export declare function prometeoUnauthorized(): PrometeoResponse;
export declare function prometeoRateLimited(): PrometeoResponse;
//# sourceMappingURL=prometeo.mock.d.ts.map