import { describe, it, expect } from "vitest";
import { DefaultAuthorizationPolicy } from "../authorization/policy";
import {
	WORKSPACE_PERMISSION,
	SENSITIVITY_LEVEL,
} from "../authorization/types";
import type { AuthorizationPolicy } from "../authorization/policy";
import type {
	AuthorizedResource,
	AuthorizationContext,
} from "../authorization/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePolicy(): AuthorizationPolicy {
	return new DefaultAuthorizationPolicy();
}

function makeResource(
	overrides: Partial<AuthorizedResource> = {},
): AuthorizedResource {
	return {
		resourceId: "res-1",
		resourceType: "workspace",
		ownerId: "user-a",
		organizationId: "org-1",
		sensitivity: SENSITIVITY_LEVEL.INTERNAL,
		...overrides,
	};
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

describe("DefaultAuthorizationPolicy", () => {
	const policy = makePolicy();

	describe("same organization", () => {
		it("should grant write permission to resource owner in same org", () => {
			const resource = makeResource({ ownerId: "user-a" });
			const context = makeContext({ userId: "user-a" });

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.WRITE,
			);

			expect(decision.granted).toBe(true);
			expect(decision.permission).toBe(WORKSPACE_PERMISSION.WRITE);
		});

		it("should grant read-only to different user in same org (non-admin)", () => {
			const resource = makeResource({ ownerId: "user-a" });
			const context = makeContext({ userId: "user-b" });

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.WRITE,
			);

			expect(decision.granted).toBe(false);
			expect(decision.permission).toBe(WORKSPACE_PERMISSION.READ);
		});

		it("should grant read permission when requesting read in same org", () => {
			const resource = makeResource({ ownerId: "user-a" });
			const context = makeContext({ userId: "user-b" });

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.READ,
			);

			expect(decision.granted).toBe(true);
			expect(decision.permission).toBe(WORKSPACE_PERMISSION.READ);
		});
	});

	describe("different organization", () => {
		it("should deny all access when user is in different org", () => {
			const resource = makeResource({ organizationId: "org-1" });
			const context = makeContext({ organizationId: "org-2" });

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.READ,
			);

			expect(decision.granted).toBe(false);
			expect(decision.permission).toBe(WORKSPACE_PERMISSION.NONE);
		});
	});

	describe("admin role", () => {
		it("should grant write regardless of sensitivity when admin", () => {
			const resource = makeResource({
				ownerId: "user-b",
				sensitivity: SENSITIVITY_LEVEL.RESTRICTED,
			});
			const context = makeContext({
				userId: "admin-user",
				roles: ["admin"],
			});

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.WRITE,
			);

			expect(decision.granted).toBe(true);
			expect(decision.permission).toBe(WORKSPACE_PERMISSION.WRITE);
		});

		it("should grant admin permission when admin requests admin", () => {
			const resource = makeResource();
			const context = makeContext({
				userId: "admin-user",
				roles: ["admin"],
			});

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.ADMIN,
			);

			expect(decision.granted).toBe(true);
			expect(decision.permission).toBe(WORKSPACE_PERMISSION.ADMIN);
		});
	});

	describe("restricted sensitivity", () => {
		it("should require admin role for write on restricted resource", () => {
			const resource = makeResource({
				sensitivity: SENSITIVITY_LEVEL.RESTRICTED,
				ownerId: "user-a",
			});
			const context = makeContext({ userId: "user-a" });

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.WRITE,
			);

			expect(decision.granted).toBe(false);
		});

		it("should allow read on restricted resource without admin", () => {
			const resource = makeResource({
				sensitivity: SENSITIVITY_LEVEL.RESTRICTED,
			});
			const context = makeContext();

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.READ,
			);

			expect(decision.granted).toBe(true);
			expect(decision.permission).toBe(WORKSPACE_PERMISSION.READ);
		});
	});

	describe("reason", () => {
		it("should include reason in AuthorizationDecision", () => {
			const resource = makeResource({ organizationId: "org-1" });
			const context = makeContext({ organizationId: "org-2" });

			const decision = policy.checkAccess(
				resource,
				context,
				WORKSPACE_PERMISSION.READ,
			);

			expect(decision.reason).toBeDefined();
			expect(typeof decision.reason).toBe("string");
		});
	});
});
