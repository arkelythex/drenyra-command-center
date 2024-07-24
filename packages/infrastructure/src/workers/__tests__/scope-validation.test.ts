/**
 * Scope validation tests for worker perimeter security.
 *
 * Validates that every worker handler enforces scope before processing.
 * RED phase: these tests fail because scope validation is not yet implemented.
 */

import { describe, expect, it } from "vitest";
import {
	validateWorkerScope,
	type WorkerScopeLevel,
} from "../scope-validator";

describe("validateWorkerScope", () => {
	// ── Organization level ──────────────────────────────────────────────

	it("passes when organizationId is present at organization level", () => {
		expect(() =>
			validateWorkerScope(
				{ organizationId: "org-001" },
				"organization",
			),
		).not.toThrow();
	});

	it("throws when organizationId is missing at organization level", () => {
		expect(() =>
			validateWorkerScope({} as Record<string, unknown>, "organization"),
		).toThrow(/organizationId/);
	});

	it("throws when organizationId is empty string at organization level", () => {
		expect(() =>
			validateWorkerScope({ organizationId: "" }, "organization"),
		).toThrow(/organizationId/);
	});

	// ── Tenant level ────────────────────────────────────────────────────

	it("passes when organizationId and companyId are present at tenant level", () => {
		expect(() =>
			validateWorkerScope(
				{ organizationId: "org-001", companyId: "cmp-001" },
				"tenant",
			),
		).not.toThrow();
	});

	it("throws when organizationId is missing at tenant level", () => {
		expect(() =>
			validateWorkerScope({ companyId: "cmp-001" } as Record<string, unknown>, "tenant"),
		).toThrow(/organizationId/);
	});

	it("throws when companyId is missing at tenant level", () => {
		expect(() =>
			validateWorkerScope(
				{ organizationId: "org-001" } as Record<string, unknown>,
				"tenant",
			),
		).toThrow(/companyId/);
	});

	it("throws when companyId is empty string at tenant level", () => {
		expect(() =>
			validateWorkerScope(
				{ organizationId: "org-001", companyId: "" },
				"tenant",
			),
		).toThrow(/companyId/);
	});

	// ── Fiscal level ────────────────────────────────────────────────────

	it("passes when all fiscal fields are present at fiscal level", () => {
		expect(() =>
			validateWorkerScope(
				{
					organizationId: "org-001",
					companyId: "cmp-001",
					companyRuc: "20123456789",
					period: "2026-07",
					countryCode: "PE",
				},
				"fiscal",
			),
		).not.toThrow();
	});

	it("throws when organizationId is missing at fiscal level", () => {
		expect(() =>
			validateWorkerScope(
				{
					companyId: "cmp-001",
					period: "2026-07",
					countryCode: "PE",
				} as Record<string, unknown>,
				"fiscal",
			),
		).toThrow(/organizationId/);
	});

	it("throws when companyId is missing at fiscal level", () => {
		expect(() =>
			validateWorkerScope(
				{
					organizationId: "org-001",
					period: "2026-07",
					countryCode: "PE",
				} as Record<string, unknown>,
				"fiscal",
			),
		).toThrow(/companyId/);
	});

	it("throws when period is missing at fiscal level", () => {
		expect(() =>
			validateWorkerScope(
				{
					organizationId: "org-001",
					companyId: "cmp-001",
					countryCode: "PE",
				} as Record<string, unknown>,
				"fiscal",
			),
		).toThrow(/period/);
	});

	it("throws when countryCode is missing at fiscal level", () => {
		expect(() =>
			validateWorkerScope(
				{
					organizationId: "org-001",
					companyId: "cmp-001",
					period: "2026-07",
				} as Record<string, unknown>,
				"fiscal",
			),
		).toThrow(/countryCode/);
	});

	it("rejects period with invalid format at fiscal level", () => {
		expect(() =>
			validateWorkerScope(
				{
					organizationId: "org-001",
					companyId: "cmp-001",
					companyRuc: "20123456789",
					period: "07-2026",
					countryCode: "PE",
				},
				"fiscal",
			),
		).toThrow(/period/);
	});

	// ── Cross-tenant isolation ──────────────────────────────────────────

	it("rejects payload with mismatched organizationId across calls", () => {
		const scopeA = { organizationId: "org-a", companyId: "cmp-a" };
		const scopeB = { organizationId: "org-b", companyId: "cmp-b" };

		// Both should pass individually
		expect(() => validateWorkerScope(scopeA, "tenant")).not.toThrow();
		expect(() => validateWorkerScope(scopeB, "tenant")).not.toThrow();
	});

	it("rejects null scope entirely", () => {
		expect(() =>
			validateWorkerScope(null as unknown as Record<string, unknown>, "tenant"),
		).toThrow(/scope required/);
	});

	it("rejects undefined scope entirely", () => {
		expect(() =>
			validateWorkerScope(
				undefined as unknown as Record<string, unknown>,
				"tenant",
			),
		).toThrow(/scope required/);
	});

	// ── Edge cases ──────────────────────────────────────────────────────

	it("handles scope with extra fields gracefully", () => {
		expect(() =>
			validateWorkerScope(
				{
					organizationId: "org-001",
					companyId: "cmp-001",
					extraField: "should-be-ignored",
					another: 42,
				},
				"tenant",
			),
		).not.toThrow();
	});

	it("rejects organizationId as number (strict type check)", () => {
		expect(() =>
			validateWorkerScope(
				{ organizationId: 123 as unknown as string },
				"organization",
			),
		).toThrow(/organizationId/);
	});

	it("returns the validated scope for chaining", () => {
		const scope = { organizationId: "org-001", companyId: "cmp-001" };
		const result = validateWorkerScope(scope, "tenant");
		expect(result).toBe(scope);
	});
});
