/**
 * Unified Permission Namespaces for Drenyra RBAC.
 *
 * Two namespaces: business:* (company-level permissions) and
 * platform:* (Drenyra platform-level permissions).
 */

// ── Business Permissions ──

export enum BusinessPermission {
	CompanyCreate = "business:company:create",
	CompanyDelete = "business:company:delete",
	CompanyUpdate = "business:company:update",
	CompanyRead = "business:company:read",
	JournalRead = "business:journal:read",
	JournalCreate = "business:journal:create",
	JournalUpdate = "business:journal:update",
	JournalUpdateDraft = "business:journal:update_draft",
	JournalDelete = "business:journal:delete",
	SunatDeclare = "business:sunat:declare",
	SunatRead = "business:sunat:read",
	AccountingClose = "business:accounting:close",
	AccountingOpen = "business:accounting:open",
	ReportsReadAll = "business:reports:read_all",
	ReportsReadOperational = "business:reports:read_operational",
	ReportsReadBasic = "business:reports:read_basic",
	PayrollRead = "business:payroll:read",
	PayrollManage = "business:payroll:manage",
	UsersCreateStaff = "business:users:create_staff",
	UsersInviteTeam = "business:users:invite_team",
	UsersRead = "business:users:read",
	AuditRead = "business:audit:read",
}

export const ALL_BUSINESS_PERMISSIONS: readonly BusinessPermission[] =
	Object.values(BusinessPermission);

// ── Platform Permissions ──

export enum PlatformPermission {
	AiToolPermissionsManage = "platform:ai:tool-permissions:manage",
	AiToolPermissionsRead = "platform:ai:tool-permissions:read",
	CognitiveStream = "platform:cognitive:stream",
	CognitiveStateRead = "platform:cognitive:state:read",
	CognitiveApprovalResolve = "platform:cognitive:approval:resolve",
	CognitiveRecover = "platform:cognitive:recover",
	DocumentsQueryRead = "platform:documents:query:read",
	DocumentsReviewUpdate = "platform:documents:review:update",
	DocumentsUploadCreate = "platform:documents:upload:create",
	SireAuditStream = "platform:sire:audit:stream",
	SireSubmit = "platform:sire:submit",
	AuditTrailRead = "platform:audit:trail:read",
	AuditTrailExport = "platform:audit:trail:export",
	ObservabilityRunsRead = "platform:observability:runs:read",
	ObservabilityRunsEventsRead = "platform:observability:runs:events:read",
	ObservabilityBatchesRead = "platform:observability:batches:read",
	ObservabilityBatchesWrite = "platform:observability:batches:write",
	ObservabilityMemoryRead = "platform:observability:memory:read",
}

export const ALL_PLATFORM_PERMISSIONS: readonly PlatformPermission[] =
	Object.values(PlatformPermission);

// ── Union ──

export type Permission = BusinessPermission | PlatformPermission;
