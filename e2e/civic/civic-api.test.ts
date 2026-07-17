/**
 * Civic API — Integration Tests
 *
 * Tests the civic API endpoints directly via HTTP.
 * These tests verify the API contract without needing a browser.
 *
 * Usage:
 *   # Start the API server first:
 *   cd apps/api && bun run dev
 *
 *   # Run tests:
 *   bun x vitest run e2e/civic/civic-api.test.ts
 *   # Or with the full E2E suite:
 *   API_BASE_URL=http://localhost:3000 bun x vitest run e2e/civic/
 */
import { describe, expect, it } from "vitest";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";
const DISTRICT_ID = "test-district-001";

async function apiCall(
	path: string,
	options: {
		method?: string;
		body?: unknown;
	} = {},
) {
	const { method = "GET", body } = options;
	const headers: Record<string, string> = {
		"X-District-Id": DISTRICT_ID,
		"Content-Type": "application/json",
	};

	const response = await fetch(`${API_BASE_URL}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});

	const contentType = response.headers.get("content-type") ?? "";
	const isJson = contentType.includes("application/json");

	return {
		status: response.status,
		ok: response.ok,
		body: isJson ? ((await response.json()) as Record<string, unknown>) : null,
	};
}

describe("Civic API — Routes exist and respond", () => {
	it("GET /api/civic/v1/results/:id should accept the route structure", async () => {
		// This test validates the route accepts our request pattern
		// It may return 404 if the election doesn't exist, but should NOT
		// return 404 for the route itself (which would mean the route is missing)
		const result = await apiCall("/api/civic/v1/results/test-election-001");

		// The route exists if we get a proper JSON response (even if 404 for data)
		expect(result.body).not.toBeNull();
		// If status is 404, it should be a structured error, not a raw 404
		if (result.status === 404) {
			expect(result.body).toHaveProperty("error");
			expect(result.body).toHaveProperty("code");
		}
	});

	it("POST /api/civic/v1/acts/validate should accept validate requests", async () => {
		const result = await apiCall("/api/civic/v1/acts/validate", {
			method: "POST",
			body: {
				actId: "test-act-001",
				validatorId: "test-validator-001",
				evidence: [
					{
						hash: "abc123",
						type: "photograph",
						content: "base64-encoded-image",
					},
				],
			},
		});

		// The route should exist and return a structured response
		expect(result.body).not.toBeNull();

		// If validation logic isn't fully wired, we should still get
		// a structured error rather than a raw 5xx
		if (result.status >= 500) {
			expect(result.body).toHaveProperty("error");
		}
	});

	it("POST /api/civic/v1/fraud/detect should accept fraud detection requests", async () => {
		const result = await apiCall("/api/civic/v1/fraud/detect", {
			method: "POST",
			body: {
				electionId: "test-election-001",
				analysisType: "digit-fatigue",
			},
		});

		expect(result.body).not.toBeNull();

		if (result.status >= 500) {
			expect(result.body).toHaveProperty("error");
		}
	});

	it("GET /api/civic/v1/audit/:caseId should accept audit trail requests", async () => {
		const result = await apiCall("/api/civic/v1/audit/test-case-001");

		expect(result.body).not.toBeNull();

		if (result.status >= 500) {
			expect(result.body).toHaveProperty("error");
		}
	});

	it("should reject requests without X-District-Id header", async () => {
		const response = await fetch(
			`${API_BASE_URL}/api/civic/v1/results/test-election-001`,
		);

		expect(response.status).toBe(400);

		const body = (await response.json()) as Record<string, unknown>;
		expect(body).toHaveProperty("error");
		expect(body).toHaveProperty("code");
	});
});
