import { describe, expect, it } from "vitest";
import {
	buildSunatLiveRetryPolicyFromEnv,
	parseRetryAfterMs,
	resolveSunatRetryDelayMs,
} from "../../services/sire-live-retry-policy.service";

describe("sire-live-retry-policy.service", () => {
	it("builds bounded retry policy from environment values", () => {
		const policy = buildSunatLiveRetryPolicyFromEnv({
			SIRE_API_SUMMARY_MAX_ATTEMPTS: "99",
			SIRE_API_SUMMARY_BACKOFF_BASE_MS: "1",
			SIRE_API_SUMMARY_BACKOFF_MAX_MS: "500000",
		});

		expect(policy).toEqual({
			maxAttempts: 5,
			baseBackoffMs: 10,
			maxBackoffMs: 30000,
		});
	});

	it("parses Retry-After seconds and HTTP date values", () => {
		expect(parseRetryAfterMs("2")).toBe(2000);

		const now = Date.parse("2026-04-16T12:00:00.000Z");
		const futureDate = "Thu, 16 Apr 2026 12:00:02 GMT";
		expect(parseRetryAfterMs(futureDate, now)).toBe(2000);
	});

	it("returns null for invalid Retry-After values", () => {
		expect(parseRetryAfterMs(null)).toBeNull();
		expect(parseRetryAfterMs("")).toBeNull();
		expect(parseRetryAfterMs("invalid")).toBeNull();
	});

	it("uses deterministic jitter harness when no Retry-After is provided", () => {
		const delay = resolveSunatRetryDelayMs({
			retryPolicy: {
				maxAttempts: 3,
				baseBackoffMs: 200,
				maxBackoffMs: 1200,
			},
			attempt: 2,
			retryAfterMs: null,
			random: () => 0,
		});

		// attempt=2 => cap=400ms; random=0 => 50% of cap
		expect(delay).toBe(200);
	});

	it("prioritizes Retry-After when provided and bounded by maxBackoffMs", () => {
		const delay = resolveSunatRetryDelayMs({
			retryPolicy: {
				maxAttempts: 3,
				baseBackoffMs: 200,
				maxBackoffMs: 1200,
			},
			attempt: 1,
			retryAfterMs: 2500,
			random: () => 1,
		});

		expect(delay).toBe(1200);
	});
});
