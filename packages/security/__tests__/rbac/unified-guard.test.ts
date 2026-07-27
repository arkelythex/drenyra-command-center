import { describe, expect, it } from "vitest";
import {
	ForbiddenError,
	hasBusinessPermission,
	hasPlatformPermission,
	requireBusinessPermission,
	requirePlatformPermission,
	requireRole,
	requireMfa,
	getPermissionsForRole,
	resolveActor,
} from "../../src/rbac/unified-guard";
import type { UnifiedActor } from "../../src/rbac/unified-guard";
import {
	BusinessPermission,
	PlatformPermission,
} from "../../src/rbac/unified-permissions";

function makeActor(role: string): UnifiedActor {
	return {
		userId: "user_1",
		authUserId: "auth_1",
		legacyUserId: null,
		role: role as UnifiedActor["role"],
		companyId: "company_1",
	};
}

describe("unified-guard", () => {
	describe("ForbiddenError", () => {
		it("extends Error", () => {
			const err = new ForbiddenError();
			expect(err).toBeInstanceOf(Error);
			expect(err.name).toBe("ForbiddenError");
		});

		it("has a default Spanish message", () => {
			const err = new ForbiddenError();
			expect(err.message).toBe("Prohibido — permisos insuficientes");
		});

		it("accepts a custom message", () => {
			const err = new ForbiddenError("custom");
			expect(err.message).toBe("custom");
		});
	});

	describe("hasBusinessPermission", () => {
		it("superadmin has all business permissions", () => {
			for (const perm of Object.values(BusinessPermission)) {
				expect(hasBusinessPermission("superadmin", perm)).toBe(true);
			}
		});

		it("viewer has only company:read", () => {
			expect(
				hasBusinessPermission("viewer", BusinessPermission.CompanyRead),
			).toBe(true);
			expect(
				hasBusinessPermission("viewer", BusinessPermission.JournalRead),
			).toBe(false);
			expect(
				hasBusinessPermission("viewer", BusinessPermission.SunatRead),
			).toBe(false);
		});

		it("returns false for unknown roles", () => {
			expect(
				hasBusinessPermission("unknown", BusinessPermission.CompanyRead),
			).toBe(false);
		});

		it("service and auditor have NO business permissions", () => {
			for (const perm of Object.values(BusinessPermission)) {
				expect(hasBusinessPermission("service", perm)).toBe(false);
				expect(hasBusinessPermission("auditor", perm)).toBe(false);
			}
		});

		it("accepts string permissions", () => {
			expect(hasBusinessPermission("owner", "business:company:read")).toBe(
				true,
			);
			expect(hasBusinessPermission("viewer", "business:journal:read")).toBe(
				false,
			);
		});
	});

	describe("hasPlatformPermission", () => {
		it("superadmin has all platform permissions", () => {
			for (const perm of Object.values(PlatformPermission)) {
				expect(hasPlatformPermission("superadmin", perm)).toBe(true);
			}
		});

		it("junior has only 3 platform permissions", () => {
			expect(
				hasPlatformPermission("junior", PlatformPermission.CognitiveStateRead),
			).toBe(true);
			expect(
				hasPlatformPermission("junior", PlatformPermission.DocumentsQueryRead),
			).toBe(true);
			expect(
				hasPlatformPermission("junior", PlatformPermission.AuditTrailRead),
			).toBe(true);
			expect(
				hasPlatformPermission("junior", PlatformPermission.CognitiveStream),
			).toBe(false);
			expect(
				hasPlatformPermission("junior", PlatformPermission.SireSubmit),
			).toBe(false);
		});

		it("service gets only its override set", () => {
			expect(
				hasPlatformPermission("service", PlatformPermission.CognitiveStream),
			).toBe(true);
			expect(
				hasPlatformPermission("service", PlatformPermission.CognitiveStateRead),
			).toBe(true);
			expect(
				hasPlatformPermission("service", PlatformPermission.CognitiveRecover),
			).toBe(true);
			expect(
				hasPlatformPermission("service", PlatformPermission.DocumentsQueryRead),
			).toBe(true);
			expect(
				hasPlatformPermission("service", PlatformPermission.AuditTrailRead),
			).toBe(false);
		});

		it("auditor gets only its override set", () => {
			expect(
				hasPlatformPermission("auditor", PlatformPermission.CognitiveStateRead),
			).toBe(true);
			expect(
				hasPlatformPermission("auditor", PlatformPermission.DocumentsQueryRead),
			).toBe(true);
			expect(
				hasPlatformPermission("auditor", PlatformPermission.AuditTrailRead),
			).toBe(true);
			expect(
				hasPlatformPermission("auditor", PlatformPermission.AuditTrailExport),
			).toBe(true);
			expect(
				hasPlatformPermission("auditor", PlatformPermission.CognitiveStream),
			).toBe(false);
		});

		it("returns false for unknown roles", () => {
			expect(
				hasPlatformPermission("unknown", PlatformPermission.CognitiveStateRead),
			).toBe(false);
		});

		it("accepts string permissions", () => {
			expect(hasPlatformPermission("admin", "platform:cognitive:stream")).toBe(
				true,
			);
			expect(hasPlatformPermission("client", "platform:sire:submit")).toBe(
				false,
			);
		});
	});

	describe("requireBusinessPermission", () => {
		it("does not throw when role has permission", () => {
			expect(() =>
				requireBusinessPermission(
					makeActor("owner"),
					BusinessPermission.CompanyCreate,
				),
			).not.toThrow();
		});

		it("throws ForbiddenError when role lacks permission", () => {
			expect(() =>
				requireBusinessPermission(
					makeActor("viewer"),
					BusinessPermission.CompanyCreate,
				),
			).toThrow(ForbiddenError);
		});

		it("includes permission and role in error message", () => {
			try {
				requireBusinessPermission(
					makeActor("viewer"),
					BusinessPermission.JournalRead,
				);
				expect.fail("should have thrown");
			} catch (e) {
				const err = e as ForbiddenError;
				expect(err.message).toContain("business:journal:read");
				expect(err.message).toContain("viewer");
			}
		});
	});

	describe("requirePlatformPermission", () => {
		it("does not throw when role has permission", () => {
			expect(() =>
				requirePlatformPermission(
					makeActor("admin"),
					PlatformPermission.SireSubmit,
				),
			).not.toThrow();
		});

		it("throws ForbiddenError when role lacks permission", () => {
			expect(() =>
				requirePlatformPermission(
					makeActor("junior"),
					PlatformPermission.SireSubmit,
				),
			).toThrow(ForbiddenError);
		});
	});

	describe("requireRole", () => {
		it("does not throw when actor role meets minimum", () => {
			expect(() => requireRole(makeActor("admin"), "senior")).not.toThrow();
		});

		it("throws ForbiddenError when actor role is too low", () => {
			expect(() => requireRole(makeActor("junior"), "owner")).toThrow(
				ForbiddenError,
			);
		});

		it("accepts equal roles", () => {
			expect(() => requireRole(makeActor("owner"), "owner")).not.toThrow();
		});
	});

	describe("requireMfa", () => {
		it("is a no-op in Phase 1", () => {
			expect(() => requireMfa(makeActor("admin"))).not.toThrow();
		});
	});

	describe("getPermissionsForRole", () => {
		it("returns correct counts for superadmin", () => {
			const result = getPermissionsForRole("superadmin");
			expect(result.business).toHaveLength(22);
			expect(result.platform).toHaveLength(18);
		});

		it("returns empty arrays for service (no business) but platform overrides are not in map", () => {
			const result = getPermissionsForRole("client");
			expect(result.business).toHaveLength(4);
			expect(result.platform).toHaveLength(1);
		});
	});

	describe("resolveActor", () => {
		it("returns null when required headers are missing", () => {
			expect(resolveActor({})).toBeNull();
			expect(resolveActor({ "x-user-id": "u1" })).toBeNull(); // missing role
		});

		it("resolves actor from headers", () => {
			const actor = resolveActor({
				"x-auth-user-id": "auth_1",
				"x-user-id": "legacy_1",
				"x-user-role": "admin",
				"x-company-id": "company_1",
			});
			expect(actor).not.toBeNull();
			expect(actor?.userId).toBe("auth_1");
			expect(actor?.authUserId).toBe("auth_1");
			expect(actor?.legacyUserId).toBe("legacy_1");
			expect(actor?.role).toBe("admin");
			expect(actor?.companyId).toBe("company_1");
		});

		it("falls back to legacy user id when auth user id is missing", () => {
			const actor = resolveActor({
				"x-user-id": "legacy_1",
				"x-user-role": "viewer",
			});
			expect(actor?.userId).toBe("legacy_1");
			expect(actor?.authUserId).toBe("legacy_1");
		});

		it("defaults companyId to 'global'", () => {
			const actor = resolveActor({
				"x-user-id": "u1",
				"x-user-role": "owner",
			});
			expect(actor?.companyId).toBe("global");
		});
	});
});
