/**
 * Canonical Role-Permission Mapping Matrix.
 *
 * Every cell in the design matrix (§1.1) is encoded as a `ReadonlySet` for
 * O(1) lookups. This is the single source of truth for all role-permission
 * relationships.
 *
 * Special roles (`service`, `auditor`) receive overridden permission sets
 * that differ from their mapped hierarchy levels.
 *
 * @module role-permission-map
 */

import type { UnifiedRole } from "./unified-roles";
import { BusinessPermission, PlatformPermission } from "./unified-permissions";

// ── Helper ──

function bs(...perms: BusinessPermission[]): ReadonlySet<BusinessPermission> {
	return new Set(perms);
}

function ps(...perms: PlatformPermission[]): ReadonlySet<PlatformPermission> {
	return new Set(perms);
}

// ── Business namespace mapping ──

export const BUSINESS_ROLE_PERMISSION_MAP: Record<
	UnifiedRole,
	ReadonlySet<BusinessPermission>
> = {
	superadmin: bs(
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
	),

	admin: bs(
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
	),

	owner: bs(
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
	),

	senior: bs(
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
	),

	analyst: bs(
		BusinessPermission.CompanyRead,
		BusinessPermission.JournalRead,
		BusinessPermission.JournalCreate,
		BusinessPermission.JournalUpdateDraft,
		BusinessPermission.SunatRead,
		BusinessPermission.ReportsReadOperational,
		BusinessPermission.ReportsReadBasic,
		BusinessPermission.UsersRead,
	),

	junior: bs(
		BusinessPermission.CompanyRead,
		BusinessPermission.JournalRead,
		BusinessPermission.JournalCreate,
		BusinessPermission.JournalUpdateDraft,
		BusinessPermission.SunatRead,
		BusinessPermission.ReportsReadOperational,
		BusinessPermission.ReportsReadBasic,
		BusinessPermission.UsersRead,
	),

	client: bs(
		BusinessPermission.CompanyRead,
		BusinessPermission.ReportsReadBasic,
		BusinessPermission.PayrollRead,
		BusinessPermission.UsersInviteTeam,
	),

	viewer: bs(BusinessPermission.CompanyRead),
};

// ── Platform namespace mapping ──

export const PLATFORM_ROLE_PERMISSION_MAP: Record<
	UnifiedRole,
	ReadonlySet<PlatformPermission>
> = {
	superadmin: ps(
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
	),

	admin: ps(
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
	),

	owner: ps(
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
	),

	senior: ps(
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
	),

	analyst: ps(
		PlatformPermission.AiToolPermissionsRead,
		PlatformPermission.CognitiveStream,
		PlatformPermission.CognitiveStateRead,
		PlatformPermission.CognitiveRecover,
		PlatformPermission.DocumentsQueryRead,
		PlatformPermission.DocumentsReviewUpdate,
		PlatformPermission.DocumentsUploadCreate,
		PlatformPermission.SireAuditStream,
		PlatformPermission.AuditTrailRead,
		PlatformPermission.ObservabilityRunsRead,
		PlatformPermission.ObservabilityRunsEventsRead,
		PlatformPermission.ObservabilityBatchesRead,
		PlatformPermission.ObservabilityMemoryRead,
	),

	junior: ps(
		PlatformPermission.CognitiveStateRead,
		PlatformPermission.DocumentsQueryRead,
		PlatformPermission.AuditTrailRead,
	),

	client: ps(PlatformPermission.DocumentsQueryRead),

	viewer: ps(
		PlatformPermission.CognitiveStateRead,
		PlatformPermission.DocumentsQueryRead,
		PlatformPermission.AuditTrailRead,
		PlatformPermission.AuditTrailExport,
	),
};

// ── Special role override sets ──

/**
 * `service` role gets ONLY these 4 platform permissions regardless of its
 * mapped hierarchy level (analyst = 4).
 */
export const SERVICE_ROLE_OVERRIDE: ReadonlySet<PlatformPermission> = ps(
	PlatformPermission.CognitiveStream,
	PlatformPermission.CognitiveStateRead,
	PlatformPermission.CognitiveRecover,
	PlatformPermission.DocumentsQueryRead,
);

/**
 * `auditor` role gets ONLY these 4 platform permissions regardless of its
 * mapped hierarchy level (viewer = 1).
 */
export const AUDITOR_ROLE_OVERRIDE: ReadonlySet<PlatformPermission> = ps(
	PlatformPermission.CognitiveStateRead,
	PlatformPermission.DocumentsQueryRead,
	PlatformPermission.AuditTrailRead,
	PlatformPermission.AuditTrailExport,
);
