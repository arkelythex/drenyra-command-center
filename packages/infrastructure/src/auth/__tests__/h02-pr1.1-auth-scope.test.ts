/**
 * PR 1.1 — Auth context + scopes canónicos
 *
 * Tests for:
 * - resolveTenantScope validates requested company against memberships
 * - Cross-organization and cross-company isolation
 * - Default company fallback
 * - Company selection error cases
 * - TenantScope construction
 *
 * @module h02-pr1.1-auth-scope
 */

import { describe, expect, it } from "vitest";
import type {
	AuthenticatedContext,
	OrganizationMembership,
} from "@drenyra/domain/scope";
import { resolveTenantScope } from "../scope-resolver";

// ============================================================
// Fixtures
// ============================================================

const orgA = "org-a";
const orgB = "org-b";
const companyA1 = "company-a1";
const companyA2 = "company-a2";
const companyB1 = "company-b1";

const membership = (
	fields: Partial<OrganizationMembership> & {
		companyId: string;
		organizationId: string;
	},
): OrganizationMembership => ({
	companyRuc: "20546296564",
	role: "OWNER",
	isDefault: false,
	status: "active",
	permissions: [],
	...fields,
});

const adminOrgA: OrganizationMembership = membership({
	organizationId: orgA,
	companyId: companyA1,
	isDefault: true,
});

const accountantOrgA: OrganizationMembership = membership({
	organizationId: orgA,
	companyId: companyA2,
	role: "ACCOUNTANT",
});

const adminOrgB: OrganizationMembership = membership({
	organizationId: orgB,
	companyId: companyB1,
	isDefault: true,
});

const ctxA: AuthenticatedContext = {
	userId: "user-a",
	organizationId: orgA,
	memberships: [adminOrgA, accountantOrgA],
};

const ctxB: AuthenticatedContext = {
	userId: "user-b",
	organizationId: orgB,
	memberships: [adminOrgB],
};

const ctxSingleMembership: AuthenticatedContext = {
	userId: "user-c",
	organizationId: orgA,
	memberships: [adminOrgA],
};

// ============================================================
// Tests
// ============================================================

describe("resolveTenantScope", () => {
	// ── Happy paths ──

	it("returns TenantScope for a valid requested company", () => {
		const scope = resolveTenantScope(ctxA, companyA1);

		expect(scope).toEqual({
			organizationId: orgA,
			companyId: companyA1,
		});
	});

	it("returns TenantScope for a different valid company in same org", () => {
		const scope = resolveTenantScope(ctxA, companyA2);

		expect(scope).toEqual({
			organizationId: orgA,
			companyId: companyA2,
		});
	});

	it("falls back to default company when no company is requested", () => {
		const scope = resolveTenantScope(ctxSingleMembership);

		expect(scope).toEqual({
			organizationId: orgA,
			companyId: companyA1,
		});
	});

	it("uses default membership when multiple exist and none requested", () => {
		const scope = resolveTenantScope(ctxA);

		expect(scope.companyId).toBe(companyA1); // isDefault: true
	});

	// ── Cross-tenant rejection ──

	it("rejects a company that belongs to another organization", () => {
		// User from Org A cannot access Company B1 (Org B)
		expect(() => resolveTenantScope(ctxA, companyB1)).toThrow(
			/does not have access/i,
		);
	});

	it("rejects a company that the user has no membership for", () => {
		// User B only has access to companyB1
		expect(() => resolveTenantScope(ctxB, companyA1)).toThrow(
			/does not have access/i,
		);
	});

	// ── Cross-company within same org ──

	it("rejects a company within same org when user lacks membership", () => {
		// Create a user in Org A who only has access to companyA1, not companyA2
		const ctxLimited: AuthenticatedContext = {
			userId: "user-limited",
			organizationId: orgA,
			memberships: [adminOrgA], // only companyA1
		};

		expect(() => resolveTenantScope(ctxLimited, companyA2)).toThrow(
			/does not have access/i,
		);
	});

	// ── Inactive membership rejection ──

	it("rejects a revoked membership even with valid company ID", () => {
		const ctxRevoked: AuthenticatedContext = {
			userId: "user-revoked",
			organizationId: orgA,
			memberships: [{ ...adminOrgA, status: "revoked" }],
		};

		expect(() => resolveTenantScope(ctxRevoked, companyA1)).toThrow(
			/does not have access/i,
		);
	});

	it("rejects a suspended membership", () => {
		const ctxSuspended: AuthenticatedContext = {
			userId: "user-suspended",
			organizationId: orgA,
			memberships: [{ ...adminOrgA, status: "suspended" }],
		};

		expect(() => resolveTenantScope(ctxSuspended, companyA1)).toThrow(
			/does not have access/i,
		);
	});

	it("ignores inactive memberships when finding default", () => {
		// Only default membership exists but is revoked
		const ctxRevokedDefault: AuthenticatedContext = {
			userId: "user-revoked-default",
			organizationId: orgA,
			memberships: [{ ...adminOrgA, isDefault: true, status: "expired" }],
		};

		expect(() => resolveTenantScope(ctxRevokedDefault)).toThrow(
			/has no company access/i,
		);
	});

	// ── Error cases ──

	it("throws when user has multiple companies but no default and no selection", () => {
		// Both memberships have isDefault: false
		const ctxMultiNoDefault: AuthenticatedContext = {
			userId: "user-multi",
			organizationId: orgA,
			memberships: [
				{ ...adminOrgA, isDefault: false },
				{ ...accountantOrgA, isDefault: false },
			],
		};

		expect(() => resolveTenantScope(ctxMultiNoDefault)).toThrow(
			/Multiple companies/i,
		);
	});

	it("throws when user has no memberships", () => {
		const ctxNoMemberships: AuthenticatedContext = {
			userId: "user-no-memberships",
			organizationId: orgA,
			memberships: [],
		};

		expect(() => resolveTenantScope(ctxNoMemberships)).toThrow(
			/has no company access/i,
		);
	});

	// ── Structure invariants ──

	it("never returns organizationId from client input", () => {
		// The function only takes authContext + requestedCompanyId.
		// organizationId is ALWAYS derived from authContext, never from caller.
		const scope = resolveTenantScope(ctxA, companyA1);

		expect(scope.organizationId).toBe(ctxA.organizationId);
		expect(scope.organizationId).not.toBe(undefined);
	});

	it("always returns both organizationId and companyId", () => {
		const scope = resolveTenantScope(ctxA, companyA1);

		expect(scope).toHaveProperty("organizationId");
		expect(scope).toHaveProperty("companyId");
	});

	it("does not have optional organizationId", () => {
		// TypeScript compile-time check: organizationId must not be optional
		const scope: { organizationId: string; companyId: string } =
			resolveTenantScope(ctxA, companyA1);

		expect(typeof scope.organizationId).toBe("string");
		expect(typeof scope.companyId).toBe("string");
	});
});
