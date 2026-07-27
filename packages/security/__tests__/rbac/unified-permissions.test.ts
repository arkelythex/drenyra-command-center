import { describe, expect, it } from "vitest";
import {
	BusinessPermission,
	PlatformPermission,
	ALL_BUSINESS_PERMISSIONS,
	ALL_PLATFORM_PERMISSIONS,
} from "../../src/rbac/unified-permissions";

describe("unified-permissions", () => {
	describe("BusinessPermission", () => {
		it("has exactly 22 business permissions", () => {
			expect(ALL_BUSINESS_PERMISSIONS).toHaveLength(22);
		});

		const expectedBusiness: BusinessPermission[] = [
			BusinessPermission.CompanyCreate,
			BusinessPermission.CompanyDelete,
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
			BusinessPermission.AccountingOpen,
			BusinessPermission.ReportsReadAll,
			BusinessPermission.ReportsReadOperational,
			BusinessPermission.ReportsReadBasic,
			BusinessPermission.PayrollRead,
			BusinessPermission.PayrollManage,
			BusinessPermission.UsersCreateStaff,
			BusinessPermission.UsersInviteTeam,
			BusinessPermission.UsersRead,
			BusinessPermission.AuditRead,
		];

		it("contains all expected business permissions", () => {
			for (const perm of expectedBusiness) {
				expect(ALL_BUSINESS_PERMISSIONS).toContain(perm);
			}
		});

		it("all business permission values start with 'business:'", () => {
			for (const perm of ALL_BUSINESS_PERMISSIONS) {
				expect(perm).toMatch(/^business:/);
			}
		});
	});

	describe("PlatformPermission", () => {
		it("has exactly 18 platform permissions", () => {
			expect(ALL_PLATFORM_PERMISSIONS).toHaveLength(18);
		});

		const expectedPlatform: PlatformPermission[] = [
			PlatformPermission.AiToolPermissionsManage,
			PlatformPermission.AiToolPermissionsRead,
			PlatformPermission.CognitiveStream,
			PlatformPermission.CognitiveStateRead,
			PlatformPermission.CognitiveApprovalResolve,
			PlatformPermission.CognitiveRecover,
			PlatformPermission.DocumentsQueryRead,
			PlatformPermission.DocumentsReviewUpdate,
			PlatformPermission.DocumentsUploadCreate,
			PlatformPermission.SireAuditStream,
			PlatformPermission.SireSubmit,
			PlatformPermission.AuditTrailRead,
			PlatformPermission.AuditTrailExport,
			PlatformPermission.ObservabilityRunsRead,
			PlatformPermission.ObservabilityRunsEventsRead,
			PlatformPermission.ObservabilityBatchesRead,
			PlatformPermission.ObservabilityBatchesWrite,
			PlatformPermission.ObservabilityMemoryRead,
		];

		it("contains all expected platform permissions", () => {
			for (const perm of expectedPlatform) {
				expect(ALL_PLATFORM_PERMISSIONS).toContain(perm);
			}
		});

		it("all platform permission values start with 'platform:'", () => {
			for (const perm of ALL_PLATFORM_PERMISSIONS) {
				expect(perm).toMatch(/^platform:/);
			}
		});
	});

	describe("namespace isolation", () => {
		it("no overlap between business and platform value sets", () => {
			const businessValues = new Set(ALL_BUSINESS_PERMISSIONS);
			for (const perm of ALL_PLATFORM_PERMISSIONS) {
				expect(businessValues.has(perm as unknown as BusinessPermission)).toBe(
					false,
				);
			}
		});

		it("business permissions do not start with 'platform:'", () => {
			for (const perm of ALL_BUSINESS_PERMISSIONS) {
				expect(perm).not.toMatch(/^platform:/);
			}
		});

		it("platform permissions do not start with 'business:'", () => {
			for (const perm of ALL_PLATFORM_PERMISSIONS) {
				expect(perm).not.toMatch(/^business:/);
			}
		});
	});
});
