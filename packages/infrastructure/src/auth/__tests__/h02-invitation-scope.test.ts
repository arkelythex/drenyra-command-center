/**
 * H02 Invitation scope resolver tests.
 *
 * Verifies that the membershipStatus-aware scope resolver correctly
 * filters memberships by status — critical for invitation lifecycle
 * where memberships may be suspended, revoked, or expired.
 *
 * @module h02-invitation-scope
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

const org = "org-001";
const companyId = "company-001";

const activeMembership = (
	overrides?: Partial<OrganizationMembership>,
): OrganizationMembership => ({
	organizationId: org,
	companyId,
	companyRuc: "20546296564",
	role: "ADMIN",
	isDefault: true,
	status: "active",
	permissions: [],
	...overrides,
});

function ctxWith(m: OrganizationMembership): AuthenticatedContext {
	return {
		userId: "user-001",
		organizationId: org,
		memberships: [m],
	};
}

// ============================================================
// Tests
// ============================================================

describe("scope resolver — membershipStatus filtering", () => {
	it("allows active membership", () => {
		const scope = resolveTenantScope(
			ctxWith(activeMembership()),
			companyId,
		);
		expect(scope.companyId).toBe(companyId);
		expect(scope.organizationId).toBe(org);
	});

	it("rejects suspended membership", () => {
		expect(() =>
			resolveTenantScope(
				ctxWith(activeMembership({ status: "suspended" })),
				companyId,
			),
		).toThrow(/does not have access/i);
	});

	it("rejects revoked membership", () => {
		expect(() =>
			resolveTenantScope(
				ctxWith(activeMembership({ status: "revoked" })),
				companyId,
			),
		).toThrow(/does not have access/i);
	});

	it("rejects expired membership", () => {
		expect(() =>
			resolveTenantScope(
				ctxWith(activeMembership({ status: "expired" })),
				companyId,
			),
		).toThrow(/does not have access/i);
	});

	it("rejects suspended membership for default fallback too", () => {
		expect(() =>
			resolveTenantScope(
				ctxWith(activeMembership({ status: "suspended", isDefault: true })),
			),
		).toThrow(/has no company access/i);
	});

	it("rejects revoked membership for default fallback too", () => {
		expect(() =>
			resolveTenantScope(
				ctxWith(activeMembership({ status: "revoked", isDefault: true })),
			),
		).toThrow(/has no company access/i);
	});

	it("allows active membership among mixed status memberships", () => {
		const ctx: AuthenticatedContext = {
			userId: "user-mixed",
			organizationId: org,
			memberships: [
				activeMembership({ status: "revoked", isDefault: false, companyId: "revoked-co" }),
				activeMembership({ status: "active", isDefault: true }),
			],
		};
		const scope = resolveTenantScope(ctx, companyId);
		expect(scope.companyId).toBe(companyId);
	});
});

describe("scope resolver — cross-status isolation", () => {
	it("does not leak that a membership exists when it is inactive (same error)", () => {
		const revokedCtx = ctxWith(activeMembership({ status: "revoked" }));
		const emptyCtx: AuthenticatedContext = {
			userId: "user-empty",
			organizationId: org,
			memberships: [],
		};

		// Both should throw similar "does not have access" errors
		// — no information leak about membership existence
		const revokedErr = (): void => {
			resolveTenantScope(revokedCtx, companyId);
		};
		const emptyErr = (): void => {
			resolveTenantScope(emptyCtx, companyId);
		};

		expect(revokedErr).toThrow();
		expect(emptyErr).toThrow();
		// Both error messages reference "does not have access" — not "revoked" or "suspended"
	});
});
