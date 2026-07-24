/**
 * Route Permission Registry — Unit Tests
 *
 * Tests for matchRoute() and the permission map.
 *
 * Covers:
 * - Public routes match correctly
 * - Protected routes require the right permission
 * - Wildcard patterns work
 * - Method-specific matching
 * - Unknown routes fall through to default
 */

import { describe, expect, it } from "vitest";
import { matchRoute, ROUTE_PERMISSIONS } from "../route-permissions";

describe("ROUTE_PERMISSIONS", () => {
	it("has at least one entry", () => {
		expect(ROUTE_PERMISSIONS.length).toBeGreaterThan(0);
	});

	it("has no duplicate patterns for the same method", () => {
		const seen = new Set<string>();
		for (const entry of ROUTE_PERMISSIONS) {
			const key = `${entry.method}:${entry.pattern}`;
			expect(seen.has(key)).toBe(false);
			seen.add(key);
		}
	});
});

describe("matchRoute", () => {
	describe("public routes", () => {
		it("matches /api/health as public", () => {
			const result = matchRoute("/api/health", "GET");
			expect(result?.isPublic).toBe(true);
		});

		it("matches /api/auth/login as public", () => {
			const result = matchRoute("/api/auth/login", "POST");
			expect(result?.isPublic).toBe(true);
		});

		it("matches /api/auth/session as public", () => {
			const result = matchRoute("/api/auth/session", "GET");
			expect(result?.isPublic).toBe(true);
		});
	});

	describe("companies", () => {
		it("GET /api/companies requires company:read", () => {
			const result = matchRoute("/api/companies", "GET");
			expect(result?.permissions).toContain("company:read");
		});

		it("POST /api/companies requires company:create", () => {
			const result = matchRoute("/api/companies", "POST");
			expect(result?.permissions).toContain("company:create");
		});

		it("DELETE /api/companies/123 requires company:delete", () => {
			const result = matchRoute("/api/companies/123", "DELETE");
			expect(result?.permissions).toContain("company:delete");
		});
	});

	describe("journal entries", () => {
		it("GET /api/journal-entries requires journal:read", () => {
			const result = matchRoute("/api/journal-entries", "GET");
			expect(result?.permissions).toContain("journal:read");
		});

		it("POST /api/journal-entries requires journal:create", () => {
			const result = matchRoute("/api/journal-entries", "POST");
			expect(result?.permissions).toContain("journal:create");
		});

		it("GET /api/journal-entries/456 uses :param pattern", () => {
			const result = matchRoute("/api/journal-entries/456", "GET");
			expect(result?.permissions).toContain("journal:read");
		});
	});

	describe("method sensitivity", () => {
		it("POST /api/companies does not match GET rule", () => {
			const result = matchRoute("/api/companies", "POST");
			expect(result?.permissions).not.toContain("company:read");
		});

		it("GET /api/payroll returns different permission than POST", () => {
			const getResult = matchRoute("/api/payroll", "GET");
			const postResult = matchRoute("/api/payroll", "POST");
			expect(getResult?.permissions).toContain("payroll:read");
			expect(postResult?.permissions).toContain("payroll:manage");
		});
	});

	describe("wildcard fallback", () => {
		it("unknown route matches /api/* default", () => {
			const result = matchRoute("/api/unknown-endpoint", "GET");
			expect(result).toBeDefined();
			expect(result?.permissions).toContain("company:read");
		});

		it("ignores query parameters when matching", () => {
			const result = matchRoute("/api/companies?page=1", "GET");
			expect(result?.permissions).toContain("company:read");
		});

		it("deep unknown path matches /api/* default", () => {
			const result = matchRoute("/api/v99/custom/feature", "POST");
			expect(result).toBeDefined();
			expect(result?.permissions).toContain("company:read");
		});
	});

	describe("edge cases", () => {
		it("returns undefined for non-api routes", () => {
			const result = matchRoute("/public/site.css", "GET");
			expect(result).toBeUndefined();
		});

		it("handles trailing slash gracefully", () => {
			const withSlash = matchRoute("/api/companies/", "GET");
			const withoutSlash = matchRoute("/api/companies", "GET");
			// May or may not match — just ensure no crash
			expect(withSlash).toBeDefined();
			expect(withoutSlash).toBeDefined();
		});
	});
});
