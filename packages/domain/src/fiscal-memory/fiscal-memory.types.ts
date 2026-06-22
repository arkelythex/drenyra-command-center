/**
 * Fiscal memory categories supported by the verified fiscal-memory layer.
 *
 * @remarks Categories intentionally describe audit/decision context, not fiscal truth.
 * @example
 * const category: FiscalMemoryCategory = "tax_decision";
 */
export type FiscalMemoryCategory =
	| "accounting_criterion"
	| "tax_decision"
	| "audit_finding"
	| "monthly_closing"
	| "evidence_note"
	| "risk_exception"
	| "client_explanation"
	| "recurring_error";

/**
 * Risk level used to prioritize future closing, compliance, and audit reviews.
 *
 * @remarks Severity is deterministic metadata and must not be inferred from chat text alone.
 * @example
 * const severity: FiscalMemorySeverity = "critical";
 */
export type FiscalMemorySeverity =
	| "info"
	| "low"
	| "medium"
	| "high"
	| "critical";

/**
 * Lifecycle status for immutable fiscal-memory records.
 *
 * @remarks Status changes are represented by revisions instead of destructive updates.
 * @example
 * const status: FiscalMemoryStatus = "resolved";
 */
export type FiscalMemoryStatus =
	| "active"
	| "resolved"
	| "superseded"
	| "archived";

/**
 * Canonical ordered list of valid fiscal-memory categories.
 *
 * @returns The category values accepted by fiscal-memory validation.
 * @example
 * FISCAL_MEMORY_CATEGORIES.includes("audit_finding");
 */
export const FISCAL_MEMORY_CATEGORIES: readonly FiscalMemoryCategory[] = [
	"accounting_criterion",
	"tax_decision",
	"audit_finding",
	"monthly_closing",
	"evidence_note",
	"risk_exception",
	"client_explanation",
	"recurring_error",
] as const;

/**
 * Canonical ordered list of valid fiscal-memory severities.
 *
 * @returns The severity values accepted by fiscal-memory validation.
 * @example
 * FISCAL_MEMORY_SEVERITIES.includes("high");
 */
export const FISCAL_MEMORY_SEVERITIES: readonly FiscalMemorySeverity[] = [
	"info",
	"low",
	"medium",
	"high",
	"critical",
] as const;

/**
 * Canonical ordered list of valid fiscal-memory statuses.
 *
 * @returns The lifecycle values accepted by fiscal-memory validation.
 * @example
 * FISCAL_MEMORY_STATUSES.includes("archived");
 */
export const FISCAL_MEMORY_STATUSES: readonly FiscalMemoryStatus[] = [
	"active",
	"resolved",
	"superseded",
	"archived",
] as const;

/**
 * Categories that cannot be persisted without evidence references.
 *
 * @remarks This protects Arkelythex from storing unsupported fiscal assertions.
 * @example
 * FISCAL_MEMORY_EVIDENCE_REQUIRED_CATEGORIES.has("tax_decision");
 */
export const FISCAL_MEMORY_EVIDENCE_REQUIRED_CATEGORIES = new Set<FiscalMemoryCategory>([
	"tax_decision",
	"audit_finding",
	"risk_exception",
	"monthly_closing",
]);

/**
 * Stable fiscal-memory validation error codes.
 *
 * @returns Deterministic codes used by services, repositories, and tests.
 * @example
 * throw new Error(FISCAL_MEMORY_ERROR_CODES.EVIDENCE_REQUIRED);
 */
export const FISCAL_MEMORY_ERROR_CODES = {
	INVALID_SCOPE: "FISCAL_MEMORY_INVALID_SCOPE",
	INVALID_RUC: "FISCAL_MEMORY_INVALID_RUC",
	INVALID_PERIOD: "FISCAL_MEMORY_INVALID_PERIOD",
	INVALID_CATEGORY: "FISCAL_MEMORY_INVALID_CATEGORY",
	INVALID_SEVERITY: "FISCAL_MEMORY_INVALID_SEVERITY",
	INVALID_STATUS: "FISCAL_MEMORY_INVALID_STATUS",
	EMPTY_TITLE: "FISCAL_MEMORY_EMPTY_TITLE",
	EMPTY_SUMMARY: "FISCAL_MEMORY_EMPTY_SUMMARY",
	EVIDENCE_REQUIRED: "FISCAL_MEMORY_EVIDENCE_REQUIRED",
} as const;

/**
 * Union of deterministic fiscal-memory validation codes.
 *
 * @remarks Keep this derived from FISCAL_MEMORY_ERROR_CODES so callers cannot drift.
 * @example
 * const code: FiscalMemoryErrorCode = FISCAL_MEMORY_ERROR_CODES.INVALID_SCOPE;
 */
export type FiscalMemoryErrorCode =
	(typeof FISCAL_MEMORY_ERROR_CODES)[keyof typeof FISCAL_MEMORY_ERROR_CODES];

/**
 * Tenant/company/RUC scope required by every fiscal-memory operation.
 *
 * @remarks Repositories must use all scope fields to prevent cross-company reads.
 * @example
 * const scope: FiscalMemoryScope = { tenantId: "tenant-1", companyId: "company-1", ruc: "20123456789" };
 */
export interface FiscalMemoryScope {
	readonly tenantId: string;
	readonly companyId: string;
	readonly ruc: string;
}

/**
 * Serializable fiscal-memory state persisted by repositories.
 *
 * @remarks Evidence references point to external evidence; memory does not replace evidence.
 * @example
 * const evidenceRefs = memory.evidenceRefs;
 */
export interface FiscalMemoryProps extends FiscalMemoryScope {
	readonly id: string;
	readonly period: string;
	readonly category: FiscalMemoryCategory;
	readonly severity: FiscalMemorySeverity;
	readonly status: FiscalMemoryStatus;
	readonly title: string;
	readonly summary: string;
	readonly evidenceRefs: readonly string[];
	readonly tags: readonly string[];
	readonly createdBy: string;
	readonly approvedBy?: string;
	readonly sourceAgentId?: string;
	readonly relatedMemoryIds?: readonly string[];
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

/**
 * Serializable immutable revision state for a fiscal-memory change.
 *
 * @remarks Each status or note change stores previous and next values for audit replay.
 * @example
 * const revisionNumber = revision.revisionNumber;
 */
export interface FiscalMemoryRevisionProps {
	readonly id: string;
	readonly memoryId: string;
	readonly revisionNumber: number;
	readonly changedBy: string;
	readonly changeReason: string;
	readonly previousValue: FiscalMemoryProps;
	readonly nextValue: FiscalMemoryProps;
	readonly createdAt: Date;
}
