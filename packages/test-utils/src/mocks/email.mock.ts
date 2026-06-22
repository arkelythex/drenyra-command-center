/**
 * Mock factory for email service.
 *
 * Provides mock implementations for transactional email sending
 * (invoice delivery, notifications, password resets).
 *
 * @example
 * ```ts
 * const mock = createEmailMock();
 * mock.send.mockResolvedValue(emailMocks.success());
 * ```
 */
import { vi } from "vitest";
import type { EmailResponse } from "./types";

export function createEmailMock() {
	return {
		send: vi.fn<() => Promise<EmailResponse>>(),
		sendTemplate: vi.fn<() => Promise<EmailResponse>>(),
		sendBulk: vi.fn<() => Promise<EmailResponse[]>>(),
		getStatus: vi.fn<() => Promise<EmailResponse>>(),
	};
}

/**
 * Pre-built email success response.
 */
export function emailSuccess(messageId = `msg-${Date.now()}`): EmailResponse {
	return {
		messageId,
		status: "sent",
	};
}

/**
 * Pre-built email failure response.
 */
export function emailFailure(
	error = "Invalid recipient address",
): EmailResponse {
	return {
		messageId: `msg-${Date.now()}`,
		status: "failed",
		error,
	};
}

/**
 * Pre-built email queued response.
 */
export function emailQueued(): EmailResponse {
	return {
		messageId: `msg-${Date.now()}`,
		status: "queued",
	};
}
