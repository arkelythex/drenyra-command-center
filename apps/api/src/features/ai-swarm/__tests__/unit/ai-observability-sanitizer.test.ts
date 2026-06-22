import { describe, expect, it } from "vitest";
import {
	hashAiObservationPayload,
	sanitizeAiObservationPayload,
	summarizeAiObservationPayload,
} from "../../api/ai-observability-sanitizer";

describe("aiObservabilitySanitizer", () => {
	it("redacts sensitive keys and truncates oversized payloads", () => {
		const payload = sanitizeAiObservationPayload({
			ruc: "20123456789",
			email: "demo@arkelythexfounders.com",
			prompt: "x".repeat(200),
			nested: {
				token: "secret-token",
				count: 3,
			},
		});

		expect(payload).toEqual({
			ruc: "[REDACTED]",
			email: "[REDACTED]",
			prompt: `${"x".repeat(160)} [TRUNCATED]`,
			nested: {
				token: "[REDACTED]",
				count: 3,
			},
		});
	});

	it("produces stable hashes for sanitized payloads", () => {
		const first = hashAiObservationPayload({ approved: true, total: 1 });
		const second = hashAiObservationPayload({ approved: true, total: 1 });

		expect(first).toBe(second);
	});

	it("returns preview and hash summary", () => {
		const summary = summarizeAiObservationPayload({
			accountNumber: "12345678901234567890",
			approved: true,
		});

		expect(summary.preview).toEqual({
			accountNumber: "[REDACTED]",
			approved: true,
		});
		expect(summary.hash).toHaveLength(64);
		expect(summary.redacted).toBe(true);
	});
});
