import { describe, expect, it } from "vitest";
import {
	BUSINESS_ROLE_PERMISSION_MAP,
	PLATFORM_ROLE_PERMISSION_MAP,
	SERVICE_ROLE_OVERRIDE,
	AUDITOR_ROLE_OVERRIDE,
} from "../../src/rbac/role-permission-map";
import {
	BusinessPermission,
	PlatformPermission,
	ALL_BUSINESS_PERMISSIONS,
	ALL_PLATFORM_PERMISSIONS,
} from "../../src/rbac/unified-permissions";
import { UNIFIED_ROLES } from "../../src/rbac/unified-roles";
import type { UnifiedRole } from "../../src/rbac/unified-roles";

const ALL_ROLES = Object.values(UNIFIED_ROLES) as UnifiedRole[];

describe("role-permission-map", () => {
	describe("BUSINESS_ROLE_PERMISSION_MAP", () => {
		it("has an entry for every unified role", () => {
			for (const role of ALL_ROLES) {
				expect(BUSINESS_ROLE_PERMISSION_MAP[role]).toBeDefined();
			}
		});

		it("superadmin, admin, and owner have all 22 business permissions", () => {
			for (const role of ["superadmin", "admin", "owner"] as const) {
				const perms = BUSINESS_ROLE_PERMISSION_MAP[role];
				expect(perms.size).toBe(22);
				for (const perm of ALL_BUSINESS_PERMISSIONS) {
					expect(perms.has(perm), `${role} should have ${perm}`).toBe(true);
				}
			}
		});

		it("senior has correct business permissions", () => {
			const perms = BUSINESS_ROLE_PERMISSION_MAP.senior;
			// senior has 18 business permissions based on design matrix
			expect(perms.has(BusinessPermission.CompanyUpdate)).toBe(true);
			expect(perms.has(BusinessPermission.CompanyRead)).toBe(true);
			expect(perms.has(BusinessPermission.JournalRead)).toBe(true);
			expect(perms.has(BusinessPermission.JournalCreate)).toBe(true);
			expect(perms.has(BusinessPermission.JournalUpdate)).toBe(true);
			expect(perms.has(BusinessPermission.JournalUpdateDraft)).toBe(true);
			expect(perms.has(BusinessPermission.JournalDelete)).toBe(true);
			expect(perms.has(BusinessPermission.SunatDeclare)).toBe(true);
			expect(perms.has(BusinessPermission.SunatRead)).toBe(true);
			expect(perms.has(BusinessPermission.AccountingClose)).toBe(true);
			expect(perms.has(BusinessPermission.ReportsReadAll)).toBe(true);
			expect(perms.has(BusinessPermission.ReportsReadOperational)).toBe(true);
			expect(perms.has(BusinessPermission.ReportsReadBasic)).toBe(true);
			expect(perms.has(BusinessPermission.PayrollRead)).toBe(true);
			expect(perms.has(BusinessPermission.PayrollManage)).toBe(true);
			expect(perms.has(BusinessPermission.UsersInviteTeam)).toBe(true);
			expect(perms.has(BusinessPermission.UsersRead)).toBe(true);
			expect(perms.has(BusinessPermission.AuditRead)).toBe(true);

			// senior does NOT have: company:create, company:delete, accounting:open, users:create_staff
			expect(perms.has(BusinessPermission.CompanyCreate)).toBe(false);
			expect(perms.has(BusinessPermission.CompanyDelete)).toBe(false);
			expect(perms.has(BusinessPermission.AccountingOpen)).toBe(false);
			expect(perms.has(BusinessPermission.UsersCreateStaff)).toBe(false);
		});

		it("analyst has correct business permissions", () => {
			const perms = BUSINESS_ROLE_PERMISSION_MAP.analyst;
			expect(perms.has(BusinessPermission.CompanyRead)).toBe(true);
			expect(perms.has(BusinessPermission.JournalRead)).toBe(true);
			expect(perms.has(BusinessPermission.JournalCreate)).toBe(true);
			expect(perms.has(BusinessPermission.JournalUpdateDraft)).toBe(true);
			expect(perms.has(BusinessPermission.SunatRead)).toBe(true);
			expect(perms.has(BusinessPermission.ReportsReadOperational)).toBe(true);
			expect(perms.has(BusinessPermission.ReportsReadBasic)).toBe(true);
			expect(perms.has(BusinessPermission.UsersRead)).toBe(true);

			// analyst should NOT have journal:update, journal:delete, sunat:declare, etc.
			expect(perms.has(BusinessPermission.JournalUpdate)).toBe(false);
			expect(perms.has(BusinessPermission.JournalDelete)).toBe(false);
			expect(perms.has(BusinessPermission.SunatDeclare)).toBe(false);
			expect(perms.has(BusinessPermission.AccountingClose)).toBe(false);
		});

		it("junior matches analyst business permissions", () => {
			const juniorPerms = BUSINESS_ROLE_PERMISSION_MAP.junior;
			const analystPerms = BUSINESS_ROLE_PERMISSION_MAP.analyst;
			expect(juniorPerms.size).toBe(analystPerms.size);
			for (const perm of analystPerms) {
				expect(juniorPerms.has(perm)).toBe(true);
			}
		});

		it("client has correct business permissions", () => {
			const perms = BUSINESS_ROLE_PERMISSION_MAP.client;
			expect(perms.has(BusinessPermission.CompanyRead)).toBe(true);
			expect(perms.has(BusinessPermission.ReportsReadBasic)).toBe(true);
			expect(perms.has(BusinessPermission.PayrollRead)).toBe(true);
			expect(perms.has(BusinessPermission.UsersInviteTeam)).toBe(true);

			expect(perms.has(BusinessPermission.JournalRead)).toBe(false);
			expect(perms.has(BusinessPermission.SunatRead)).toBe(false);
		});

		it("viewer has only company:read", () => {
			const perms = BUSINESS_ROLE_PERMISSION_MAP.viewer;
			expect(perms.size).toBe(1);
			expect(perms.has(BusinessPermission.CompanyRead)).toBe(true);
		});

		it("every role × every business permission is tested (176 assertions)", () => {
			// This verifies the full matrix as specified in the design.
			// Expected matrix per design §1.1:
			const expected: Record<UnifiedRole, BusinessPermission[]> = {
				superadmin: [...ALL_BUSINESS_PERMISSIONS],
				admin: [...ALL_BUSINESS_PERMISSIONS],
				owner: [...ALL_BUSINESS_PERMISSIONS],
				senior: [
					BusinessPermission.CompanyUpdate,
					BusinessPermission.CompanyRead,
					BusinessPermission.JournalRead,
					BusinessPermission.JournalCreate,
					BusinessPermission.JournalUpdate,
					BusinessPermission.JournalUpdateDraft,
					BusinessPermission.JournalDelete,
					BusinessPermission.SunatDeclare,
					BusinessPermission.SunatRead,
					BusinessPermission.AccountingClose,
					BusinessPermission.ReportsReadAll,
					BusinessPermission.ReportsReadOperational,
					BusinessPermission.ReportsReadBasic,
					BusinessPermission.PayrollRead,
					BusinessPermission.PayrollManage,
					BusinessPermission.UsersInviteTeam,
					BusinessPermission.UsersRead,
					BusinessPermission.AuditRead,
				],
				analyst: [
					BusinessPermission.CompanyRead,
					BusinessPermission.JournalRead,
					BusinessPermission.JournalCreate,
					BusinessPermission.JournalUpdateDraft,
					BusinessPermission.SunatRead,
					BusinessPermission.ReportsReadOperational,
					BusinessPermission.ReportsReadBasic,
					BusinessPermission.UsersRead,
				],
				junior: [
					BusinessPermission.CompanyRead,
					BusinessPermission.JournalRead,
					BusinessPermission.JournalCreate,
					BusinessPermission.JournalUpdateDraft,
					BusinessPermission.SunatRead,
					BusinessPermission.ReportsReadOperational,
					BusinessPermission.ReportsReadBasic,
					BusinessPermission.UsersRead,
				],
				client: [
					BusinessPermission.CompanyRead,
					BusinessPermission.ReportsReadBasic,
					BusinessPermission.PayrollRead,
					BusinessPermission.UsersInviteTeam,
				],
				viewer: [BusinessPermission.CompanyRead],
			};

			for (const role of ALL_ROLES) {
				const granted = expected[role] ?? [];
				const denied = ALL_BUSINESS_PERMISSIONS.filter(
					(p) => !granted.includes(p),
				);

				for (const perm of granted) {
					expect(
						BUSINESS_ROLE_PERMISSION_MAP[role].has(perm),
						`${role} should have ${perm}`,
					).toBe(true);
				}

				for (const perm of denied) {
					expect(
						BUSINESS_ROLE_PERMISSION_MAP[role].has(perm),
						`${role} should NOT have ${perm}`,
					).toBe(false);
				}
			}
		});
	});

	describe("PLATFORM_ROLE_PERMISSION_MAP", () => {
		it("has an entry for every unified role", () => {
			for (const role of ALL_ROLES) {
				expect(PLATFORM_ROLE_PERMISSION_MAP[role]).toBeDefined();
			}
		});

		it("superadmin, admin, owner, and senior have all 18 platform permissions", () => {
			for (const role of ["superadmin", "admin", "owner", "senior"] as const) {
				const perms = PLATFORM_ROLE_PERMISSION_MAP[role];
				expect(perms.size).toBe(18);
				for (const perm of ALL_PLATFORM_PERMISSIONS) {
					expect(perms.has(perm), `${role} should have ${perm}`).toBe(true);
				}
			}
		});

		it("analyst has correct platform permissions", () => {
			const perms = PLATFORM_ROLE_PERMISSION_MAP.analyst;
			expect(perms.has(PlatformPermission.AiToolPermissionsRead)).toBe(true);
			expect(perms.has(PlatformPermission.CognitiveStream)).toBe(true);
			expect(perms.has(PlatformPermission.CognitiveStateRead)).toBe(true);
			expect(perms.has(PlatformPermission.CognitiveRecover)).toBe(true);
			expect(perms.has(PlatformPermission.DocumentsQueryRead)).toBe(true);
			expect(perms.has(PlatformPermission.DocumentsReviewUpdate)).toBe(true);
			expect(perms.has(PlatformPermission.DocumentsUploadCreate)).toBe(true);
			expect(perms.has(PlatformPermission.SireAuditStream)).toBe(true);
			expect(perms.has(PlatformPermission.AuditTrailRead)).toBe(true);
			expect(perms.has(PlatformPermission.ObservabilityRunsRead)).toBe(true);
			expect(perms.has(PlatformPermission.ObservabilityRunsEventsRead)).toBe(
				true,
			);
			expect(perms.has(PlatformPermission.ObservabilityBatchesRead)).toBe(true);
			expect(perms.has(PlatformPermission.ObservabilityMemoryRead)).toBe(true);

			// analyst should NOT have these
			expect(perms.has(PlatformPermission.AiToolPermissionsManage)).toBe(false);
			expect(perms.has(PlatformPermission.CognitiveApprovalResolve)).toBe(
				false,
			);
			expect(perms.has(PlatformPermission.SireSubmit)).toBe(false);
			expect(perms.has(PlatformPermission.ObservabilityBatchesWrite)).toBe(
				false,
			);
		});

		it("junior has exactly 3 platform permissions", () => {
			const perms = PLATFORM_ROLE_PERMISSION_MAP.junior;
			expect(perms.size).toBe(3);
			expect(perms.has(PlatformPermission.CognitiveStateRead)).toBe(true);
			expect(perms.has(PlatformPermission.DocumentsQueryRead)).toBe(true);
			expect(perms.has(PlatformPermission.AuditTrailRead)).toBe(true);
		});

		it("client has exactly 1 platform permission", () => {
			const perms = PLATFORM_ROLE_PERMISSION_MAP.client;
			expect(perms.size).toBe(1);
			expect(perms.has(PlatformPermission.DocumentsQueryRead)).toBe(true);
		});

		it("viewer has correct platform permissions", () => {
			const perms = PLATFORM_ROLE_PERMISSION_MAP.viewer;
			expect(perms.has(PlatformPermission.CognitiveStateRead)).toBe(true);
			expect(perms.has(PlatformPermission.DocumentsQueryRead)).toBe(true);
			expect(perms.has(PlatformPermission.AuditTrailRead)).toBe(true);
			expect(perms.has(PlatformPermission.AuditTrailExport)).toBe(true);
			expect(perms.size).toBe(4);
		});
	});

	describe("SERVICE_ROLE_OVERRIDE", () => {
		it("has exactly 4 permissions", () => {
			expect(SERVICE_ROLE_OVERRIDE.size).toBe(4);
		});

		it("includes only the documented 4 platform permissions", () => {
			expect(
				SERVICE_ROLE_OVERRIDE.has(PlatformPermission.CognitiveStream),
			).toBe(true);
			expect(
				SERVICE_ROLE_OVERRIDE.has(PlatformPermission.CognitiveStateRead),
			).toBe(true);
			expect(
				SERVICE_ROLE_OVERRIDE.has(PlatformPermission.CognitiveRecover),
			).toBe(true);
			expect(
				SERVICE_ROLE_OVERRIDE.has(PlatformPermission.DocumentsQueryRead),
			).toBe(true);
		});
	});

	describe("AUDITOR_ROLE_OVERRIDE", () => {
		it("has exactly 4 permissions", () => {
			expect(AUDITOR_ROLE_OVERRIDE.size).toBe(4);
		});

		it("includes only the documented 4 platform permissions", () => {
			expect(
				AUDITOR_ROLE_OVERRIDE.has(PlatformPermission.CognitiveStateRead),
			).toBe(true);
			expect(
				AUDITOR_ROLE_OVERRIDE.has(PlatformPermission.DocumentsQueryRead),
			).toBe(true);
			expect(AUDITOR_ROLE_OVERRIDE.has(PlatformPermission.AuditTrailRead)).toBe(
				true,
			);
			expect(
				AUDITOR_ROLE_OVERRIDE.has(PlatformPermission.AuditTrailExport),
			).toBe(true);
		});
	});
});
