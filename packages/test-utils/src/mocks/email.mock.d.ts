import type { EmailResponse } from "./types";
export declare function createEmailMock(): {
    send: import("vitest").Mock<() => Promise<EmailResponse>>;
    sendTemplate: import("vitest").Mock<() => Promise<EmailResponse>>;
    sendBulk: import("vitest").Mock<() => Promise<EmailResponse[]>>;
    getStatus: import("vitest").Mock<() => Promise<EmailResponse>>;
};
export declare function emailSuccess(messageId?: string): EmailResponse;
export declare function emailFailure(error?: string): EmailResponse;
export declare function emailQueued(): EmailResponse;
//# sourceMappingURL=email.mock.d.ts.map