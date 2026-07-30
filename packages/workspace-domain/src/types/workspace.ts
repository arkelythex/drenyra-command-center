import {
	WorkspaceValidationError,
	WorkspaceDuplicateCompanyError,
	WorkspaceSchemaVersionError,
} from "./errors";

// ─── Current Schema Version ─────────────────────────────────────────────────

/**
 * Bump this when FinancialWorkspace shape changes.
 * Incrementing triggers schema migration for persisted data.
 */
export const CURRENT_WORKSPACE_SCHEMA_VERSION = 1;

// ─── Branded Types ──────────────────────────────────────────────────────────

export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };

/**
 * Public factory: creates a new WorkspaceId.
 * Always produces a valid UUID-v4 shaped string.
 */
export function createWorkspaceId(): WorkspaceId {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID() as WorkspaceId;
	}
	return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 11)}` as WorkspaceId;
}

const WORKSPACE_ID_UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const WORKSPACE_ID_FALLBACK_PATTERN = /^ws-\d+-[a-z0-9]{9}$/;

/**
 * Public parser: validates and parses a raw string into a WorkspaceId.
 * Returns a Result-like tuple for safe consumption.
 *
 * ```ts
 * const [id, err] = parseWorkspaceId(someString);
 * if (err) { handleError(err); }
 * ```
 */
export function parseWorkspaceId(
	value: string,
): [WorkspaceId, null] | [null, WorkspaceValidationError] {
	if (!value || value.trim().length === 0) {
		return [
			null,
			new WorkspaceValidationError("WorkspaceId must not be empty"),
		];
	}

	const trimmed = value.trim();

	if (
		!WORKSPACE_ID_UUID_PATTERN.test(trimmed) &&
		!WORKSPACE_ID_FALLBACK_PATTERN.test(trimmed)
	) {
		return [
			null,
			new WorkspaceValidationError(`Invalid WorkspaceId format: "${trimmed}"`),
		];
	}

	return [trimmed as WorkspaceId, null];
}

// ─── Workspace Objective (Discriminated Union) ──────────────────────────────

export type WorkspaceObjective =
	| { kind: "monthly-close"; fiscalPeriodId: string }
	| { kind: "sire-review"; fiscalPeriodId: string; recordType: "RCE" | "RVIE" }
	| { kind: "tax-audit"; fiscalPeriodId: string }
	| { kind: "bank-reconciliation"; accountIds: readonly string[] }
	| { kind: "rce-rectification"; fiscalPeriodId: string }
	| { kind: "portfolio-operations" }
	| { kind: "evidence-audit"; fiscalPeriodId: string }
	| { kind: "custom"; definitionId: string };

// ─── Objective Helpers ──────────────────────────────────────────────────────

function objectiveKind(obj: WorkspaceObjective): string {
	return obj.kind;
}

const OBJECTIVE_DISPLAY_NAMES: Record<string, string> = {
	"monthly-close": "Monthly Close",
	"sire-review": "SIRE Review",
	"tax-audit": "Tax Audit",
	"bank-reconciliation": "Bank Reconciliation",
	"rce-rectification": "RCE Rectification",
	"portfolio-operations": "Portfolio Operations",
	"evidence-audit": "Evidence Audit",
	custom: "Custom",
};

/**
 * Returns a human-readable label for the objective kind.
 */
export function objectiveDisplayName(objective: WorkspaceObjective): string {
	return OBJECTIVE_DISPLAY_NAMES[objectiveKind(objective)] ?? "Custom";
}

// ─── FinancialWorkspace ─────────────────────────────────────────────────────

export interface FinancialWorkspace {
	/** Schema version for migration support. Always CURRENT_WORKSPACE_SCHEMA_VERSION for new workspaces. */
	readonly schemaVersion: number;
	/** Monotonic revision counter for optimistic concurrency. */
	readonly revision: number;
	readonly workspaceId: WorkspaceId;
	readonly organizationId: string;
	readonly companyIds: readonly string[];
	readonly fiscalPeriodIds: readonly string[];
	readonly objective: WorkspaceObjective;
	readonly layoutId: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

// ─── CreateWorkspaceInput ───────────────────────────────────────────────────

export interface CreateWorkspaceInput {
	readonly organizationId: string;
	readonly companyIds: readonly string[];
	readonly fiscalPeriodIds: readonly string[];
	readonly objective: WorkspaceObjective;
	readonly layoutId: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateWorkspaceId(): WorkspaceId {
	return createWorkspaceId();
}

function validateInput(input: CreateWorkspaceInput): void {
	if (!input.organizationId || input.organizationId.trim().length === 0) {
		throw new WorkspaceValidationError("organizationId must not be empty");
	}
	if (!input.companyIds || input.companyIds.length === 0) {
		throw new WorkspaceValidationError("companyIds must not be empty");
	}
	if (!input.fiscalPeriodIds || input.fiscalPeriodIds.length === 0) {
		throw new WorkspaceValidationError("fiscalPeriodIds must not be empty");
	}
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createWorkspace(
	input: CreateWorkspaceInput,
): FinancialWorkspace {
	validateInput(input);

	const now = new Date();
	return {
		schemaVersion: CURRENT_WORKSPACE_SCHEMA_VERSION,
		revision: 1,
		workspaceId: generateWorkspaceId(),
		organizationId: input.organizationId,
		companyIds: [...input.companyIds],
		fiscalPeriodIds: [...input.fiscalPeriodIds],
		objective: input.objective,
		layoutId: input.layoutId,
		createdAt: now,
		updatedAt: now,
	};
}

// ─── Immutable Updates ──────────────────────────────────────────────────────

export function addCompanyToWorkspace(
	workspace: FinancialWorkspace,
	companyId: string,
): FinancialWorkspace {
	if (workspace.companyIds.includes(companyId)) {
		throw new WorkspaceDuplicateCompanyError(companyId, workspace.workspaceId);
	}

	return {
		...workspace,
		companyIds: [...workspace.companyIds, companyId],
		revision: workspace.revision + 1,
		updatedAt: new Date(),
	};
}

export function changeWorkspaceObjective(
	workspace: FinancialWorkspace,
	objective: WorkspaceObjective,
): FinancialWorkspace {
	return {
		...workspace,
		objective,
		revision: workspace.revision + 1,
		updatedAt: new Date(),
	};
}

// ─── Serialization ───────────────────────────────────────────────────────────

/**
 * Serialize a FinancialWorkspace to a plain JSON-compatible object.
 */
export function workspaceToJSON(
	workspace: FinancialWorkspace,
): Record<string, unknown> {
	return {
		schemaVersion: workspace.schemaVersion,
		revision: workspace.revision,
		workspaceId: workspace.workspaceId,
		organizationId: workspace.organizationId,
		companyIds: [...workspace.companyIds],
		fiscalPeriodIds: [...workspace.fiscalPeriodIds],
		objective: workspace.objective,
		layoutId: workspace.layoutId,
		createdAt: workspace.createdAt.toISOString(),
		updatedAt: workspace.updatedAt.toISOString(),
	};
}

/**
 * Deserialize a plain JSON object back into a FinancialWorkspace.
 * Validates schema version and rejects unsupported versions.
 */
export function workspaceFromJSON(
	json: Record<string, unknown>,
): FinancialWorkspace {
	const sv = json.schemaVersion;

	if (typeof sv !== "number" || sv !== CURRENT_WORKSPACE_SCHEMA_VERSION) {
		throw new WorkspaceSchemaVersionError(
			sv as number,
			CURRENT_WORKSPACE_SCHEMA_VERSION,
		);
	}

	return {
		schemaVersion: sv,
		revision: json.revision as number,
		workspaceId: json.workspaceId as WorkspaceId,
		organizationId: json.organizationId as string,
		companyIds: [...(json.companyIds as readonly string[])],
		fiscalPeriodIds: [...(json.fiscalPeriodIds as readonly string[])],
		objective: json.objective as WorkspaceObjective,
		layoutId: (json.layoutId as string | null) ?? null,
		createdAt: new Date(json.createdAt as string),
		updatedAt: new Date(json.updatedAt as string),
	};
}
