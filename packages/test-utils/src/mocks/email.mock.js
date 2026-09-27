import { vi } from "vitest";
export function createEmailMock() {
    return {
        send: vi.fn(),
        sendTemplate: vi.fn(),
        sendBulk: vi.fn(),
        getStatus: vi.fn(),
    };
}
export function emailSuccess(messageId = `msg-${Date.now()}`) {
    return {
        messageId,
        status: "sent",
    };
}
export function emailFailure(error = "Invalid recipient address") {
    return {
        messageId: `msg-${Date.now()}`,
        status: "failed",
        error,
    };
}
export function emailQueued() {
    return {
        messageId: `msg-${Date.now()}`,
        status: "queued",
    };
}
//# sourceMappingURL=email.mock.js.map