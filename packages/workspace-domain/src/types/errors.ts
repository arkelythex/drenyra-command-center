// ─── Error Codes ────────────────────────────────────────────────────────────

/**
 * Stable error codes used as contracts across layers.
 * Treat these as API surface — never change a code's meaning.
 */
export type WorkspaceErrorCode =
	| "WORKSPACE_NOT_FOUND"
	| "WORKSPACE_VALIDATION_ERROR"
	| "WORKSPACE_DUPLICATE_COMPANY"
	| "WORKSPACE_INVALID_STATE"
	| "WORKSPACE_SCHEMA_VERSION"
	| "WORKSPACE_UNKNOWN_ERROR";

// ─── Workspace Error Hierarchy ──────────────────────────────────────────────

export class WorkspaceError extends Error {
	readonly code: WorkspaceErrorCode;

	constructor(
		message: string,
		code: WorkspaceErrorCode = "WORKSPACE_UNKNOWN_ERROR",
	) {
		super(message);
		this.name = "WorkspaceError";
		this.code = code;
	}
}

export class WorkspaceNotFoundError extends WorkspaceError {
	constructor(workspaceId: string) {
		super(`Workspace not found: ${workspaceId}`, "WORKSPACE_NOT_FOUND");
		this.name = "WorkspaceNotFoundError";
	}
}

export class WorkspaceValidationError extends WorkspaceError {
	constructor(message: string) {
		super(message, "WORKSPACE_VALIDATION_ERROR");
		this.name = "WorkspaceValidationError";
	}
}

export class WorkspaceDuplicateCompanyError extends WorkspaceError {
	constructor(companyId: string, workspaceId: string) {
		super(
			`Company ${companyId} is already in workspace ${workspaceId}`,
			"WORKSPACE_DUPLICATE_COMPANY",
		);
		this.name = "WorkspaceDuplicateCompanyError";
	}
}

export class WorkspaceSchemaVersionError extends WorkspaceError {
	constructor(version: number, expected: number) {
		super(
			`Unsupported schema version ${version}. Expected ${expected}.`,
			"WORKSPACE_SCHEMA_VERSION",
		);
		this.name = "WorkspaceSchemaVersionError";
	}
}
