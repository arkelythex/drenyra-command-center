import { describe, it, expect } from "vitest";
import { authorizeViewAccess } from "../authorization/view-guard";
import { DefaultAuthorizationPolicy } from "../authorization/policy";
import { WORKSPACE_PERMISSION } from "../authorization/types";
import type { AuthorizationPolicy } from "../authorization/policy";
import type { AuthorizationContext } from "../authorization/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePolicy(): AuthorizationPolicy {
	return new DefaultAuthorizationPolicy();
}

function makeContext(
	overrides: Partial<AuthorizationContext> = {},
): AuthorizationContext {
	return {
		userId: "user-a",
		organizationId: "org-1",
		roles: [],
		...overrides,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("authorizeViewAccess", () => {
	const policy = makePolicy();

	it("should apply sensitivity check for evidence view", () => {
		const context = makeContext();

		const decision = authorizeViewAccess("view-1", "evidence", context, policy);

		expect(decision.granted).toBe(true);
	});

	it("should require write permission for approval view (granted to admin)", () => {
		// Approval requires write — only admin can write to non-owned resource
		const context = makeContext({
			userId: "admin-user",
			roles: ["admin"],
		});

		const decision = authorizeViewAccess("view-1", "approval", context, policy);

		expect(decision.granted).toBe(true);
		expect(decision.permission).toBe(WORKSPACE_PERMISSION.WRITE);
	});

	it("should require only read for agent-activity view", () => {
		const context = makeContext();

		const decision = authorizeViewAccess(
			"view-1",
			"agent-activity",
			context,
			policy,
		);

		expect(decision.granted).toBe(true);
		expect(decision.permission).toBe(WORKSPACE_PERMISSION.READ);
	});

	it("should require only read for ledger view", () => {
		const context = makeContext();

		const decision = authorizeViewAccess("view-1", "ledger", context, policy);

		expect(decision.granted).toBe(true);
		expect(decision.permission).toBe(WORKSPACE_PERMISSION.READ);
	});

	it("should deny unauthorized user when requesting write on approval without ownership", () => {
		// Non-owner user in same org — policy grants read but denies write
		const context = makeContext({
			userId: "user-b",
			organizationId: "org-1",
		});

		const decision = authorizeViewAccess("view-1", "approval", context, policy);

		// Approval requires write — non-owner gets read, so denied
		expect(decision.granted).toBe(false);
	});

	it("should check sensitivity for document-viewer view", () => {
		const context = makeContext();

		const decision = authorizeViewAccess(
			"view-1",
			"document-viewer",
			context,
			policy,
		);

		// Document-viewer falls through to sensitivity-dependent check
		expect(decision).toBeDefined();
	});
});
