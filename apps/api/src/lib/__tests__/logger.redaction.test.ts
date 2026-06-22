import { describe, expect, it } from "vitest";
import { REDACTION_PLACEHOLDER, redactLogPayload } from "../logger";

describe("logger redaction policy", () => {
	it("redacts recursive sensitive keys and variants", () => {
		const rawPayload = {
			email: "user@example.com",
			ipAddress: "203.0.113.10",
			headers: {
				"x-forwarded-for": "198.51.100.4",
				"x-real-ip": "198.51.100.5",
			},
			profile: {
				ruc: "20123456789",
				accountNumber: "00112233445566",
				nestedToken: "tok_live_123",
				password: "SuperSecret123",
			},
		};

		const redacted = redactLogPayload(rawPayload) as Record<string, unknown>;
		const serialized = JSON.stringify(redacted);

		expect(redacted.email).toBe(REDACTION_PLACEHOLDER);
		expect(redacted.ipAddress).toBe(REDACTION_PLACEHOLDER);
		expect(serialized).not.toContain("user@example.com");
		expect(serialized).not.toContain("203.0.113.10");
		expect(serialized).not.toContain("198.51.100.4");
		expect(serialized).not.toContain("198.51.100.5");
		expect(serialized).not.toContain("20123456789");
		expect(serialized).not.toContain("00112233445566");
		expect(serialized).not.toContain("tok_live_123");
		expect(serialized).not.toContain("SuperSecret123");
	});

	it("keeps non-sensitive telemetry fields unchanged", () => {
		const payload = {
			feature: "auth",
			handler: "login",
			traceId: "trace_123",
			durationMs: 23,
			outcome: "denied",
		};

		const redacted = redactLogPayload(payload) as Record<string, unknown>;

		expect(redacted.feature).toBe("auth");
		expect(redacted.handler).toBe("login");
		expect(redacted.traceId).toBe("trace_123");
		expect(redacted.durationMs).toBe(23);
		expect(redacted.outcome).toBe("denied");
	});
});
