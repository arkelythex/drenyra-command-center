import { describe, expect, it } from "vitest";
import {
	UNIFIED_ROLES,
	ROLE_HIERARCHY,
	SPECIAL_ROLE_MAPPINGS,
	isRoleHigher,
	getRoleLevel,
	resolveUnifiedRole,
} from "../../src/rbac/unified-roles";
import type { UnifiedRole } from "../../src/rbac/unified-roles";

describe("unified-roles", () => {
	describe("UNIFIED_ROLES", () => {
		it("has exactly 8 roles", () => {
			const roles = Object.values(UNIFIED_ROLES);
			expect(roles).toHaveLength(8);
		});

		it("includes all expected role identifiers", () => {
			expect(UNIFIED_ROLES.SUPERADMIN).toBe("superadmin");
			expect(UNIFIED_ROLES.ADMIN).toBe("admin");
			expect(UNIFIED_ROLES.OWNER).toBe("owner");
			expect(UNIFIED_ROLES.SENIOR).toBe("senior");
			expect(UNIFIED_ROLES.ANALYST).toBe("analyst");
			expect(UNIFIED_ROLES.JUNIOR).toBe("junior");
			expect(UNIFIED_ROLES.CLIENT).toBe("client");
			expect(UNIFIED_ROLES.VIEWER).toBe("viewer");
		});
	});

	describe("ROLE_HIERARCHY", () => {
		it("assigns correct numeric levels", () => {
			expect(ROLE_HIERARCHY.superadmin).toBe(8);
			expect(ROLE_HIERARCHY.admin).toBe(7);
			expect(ROLE_HIERARCHY.owner).toBe(6);
			expect(ROLE_HIERARCHY.senior).toBe(5);
			expect(ROLE_HIERARCHY.analyst).toBe(4);
			expect(ROLE_HIERARCHY.junior).toBe(3);
			expect(ROLE_HIERARCHY.client).toBe(2);
			expect(ROLE_HIERARCHY.viewer).toBe(1);
		});

		it("is strictly descending from superadmin to viewer", () => {
			const levels = Object.values(ROLE_HIERARCHY);
			for (let i = 1; i < levels.length; i++) {
				expect(levels[i - 1]).toBeGreaterThan(levels[i]!);
			}
		});
	});

	describe("isRoleHigher", () => {
		const allRoles = Object.values(UNIFIED_ROLES) as UnifiedRole[];

		it("returns true when roleA outranks roleB", () => {
			expect(isRoleHigher("superadmin", "admin")).toBe(true);
			expect(isRoleHigher("admin", "owner")).toBe(true);
			expect(isRoleHigher("owner", "senior")).toBe(true);
			expect(isRoleHigher("senior", "analyst")).toBe(true);
			expect(isRoleHigher("analyst", "junior")).toBe(true);
			expect(isRoleHigher("junior", "client")).toBe(true);
			expect(isRoleHigher("client", "viewer")).toBe(true);
		});

		it("returns false when roleA is equal to roleB", () => {
			for (const role of allRoles) {
				expect(isRoleHigher(role, role)).toBe(false);
			}
		});

		it("returns false when roleA is lower than roleB", () => {
			expect(isRoleHigher("viewer", "client")).toBe(false);
			expect(isRoleHigher("client", "junior")).toBe(false);
			expect(isRoleHigher("junior", "analyst")).toBe(false);
			expect(isRoleHigher("analyst", "senior")).toBe(false);
			expect(isRoleHigher("senior", "owner")).toBe(false);
			expect(isRoleHigher("owner", "admin")).toBe(false);
			expect(isRoleHigher("admin", "superadmin")).toBe(false);
		});

		it("covers all 28 unique role pairs correctly", () => {
			for (const roleA of allRoles) {
				for (const roleB of allRoles) {
					const levelA = ROLE_HIERARCHY[roleA];
					const levelB = ROLE_HIERARCHY[roleB];
					expect(isRoleHigher(roleA, roleB)).toBe(levelA > levelB);
				}
			}
		});
	});

	describe("getRoleLevel", () => {
		it("returns correct level for canonical roles", () => {
			expect(getRoleLevel("superadmin")).toBe(8);
			expect(getRoleLevel("admin")).toBe(7);
			expect(getRoleLevel("owner")).toBe(6);
			expect(getRoleLevel("senior")).toBe(5);
			expect(getRoleLevel("analyst")).toBe(4);
			expect(getRoleLevel("junior")).toBe(3);
			expect(getRoleLevel("client")).toBe(2);
			expect(getRoleLevel("viewer")).toBe(1);
		});

		it("returns correct level for special roles", () => {
			expect(getRoleLevel("service")).toBe(4);
			expect(getRoleLevel("auditor")).toBe(1);
		});

		it("returns -1 for unknown roles", () => {
			expect(getRoleLevel("unknown")).toBe(-1);
			expect(getRoleLevel("")).toBe(-1);
		});
	});

	describe("resolveUnifiedRole", () => {
		it("returns canonical role for standard role strings", () => {
			expect(resolveUnifiedRole("owner")).toBe("owner");
			expect(resolveUnifiedRole("analyst")).toBe("analyst");
			expect(resolveUnifiedRole("VIEWER")).toBe("viewer");
		});

		it("maps special roles to their canonical equivalents", () => {
			expect(resolveUnifiedRole("service")).toBe("analyst");
			expect(resolveUnifiedRole("auditor")).toBe("viewer");
		});

		it("returns null for unknown roles", () => {
			expect(resolveUnifiedRole("hacker")).toBeNull();
			expect(resolveUnifiedRole("")).toBeNull();
		});
	});

	describe("SPECIAL_ROLE_MAPPINGS", () => {
		it("maps service to analyst level 4", () => {
			const mapping = SPECIAL_ROLE_MAPPINGS["service"];
			expect(mapping).toBeDefined();
			expect(mapping?.mapsTo).toBe("analyst");
			expect(mapping?.level).toBe(4);
		});

		it("maps auditor to viewer level 1", () => {
			const mapping = SPECIAL_ROLE_MAPPINGS["auditor"];
			expect(mapping).toBeDefined();
			expect(mapping?.mapsTo).toBe("viewer");
			expect(mapping?.level).toBe(1);
		});
	});
});
