// ─── Error Codes ────────────────────────────────────────────────────────────

/**
 * Stable error codes used as contracts across layers.
 * Treat these as API surface — never change a code's meaning.
 */
export type LayoutErrorCode =
	| "LAYOUT_NOT_FOUND"
	| "LAYOUT_VALIDATION_ERROR"
	| "LAYOUT_SCHEMA_VERSION"
	| "LAYOUT_CONFLICT"
	| "LAYOUT_MIGRATION_ERROR"
	| "LAYOUT_UNKNOWN_ERROR";

// ─── Layout Error Hierarchy ──────────────────────────────────────────────────

export class LayoutError extends Error {
	readonly code: LayoutErrorCode;

	constructor(message: string, code: LayoutErrorCode = "LAYOUT_UNKNOWN_ERROR") {
		super(message);
		this.name = "LayoutError";
		this.code = code;
	}
}

export class LayoutNotFoundError extends LayoutError {
	constructor(layoutId: string) {
		super(`Layout not found: ${layoutId}`, "LAYOUT_NOT_FOUND");
		this.name = "LayoutNotFoundError";
	}
}

export class LayoutValidationError extends LayoutError {
	constructor(message: string) {
		super(message, "LAYOUT_VALIDATION_ERROR");
		this.name = "LayoutValidationError";
	}
}

export class LayoutConflictError extends LayoutError {
	constructor(layoutId: string, expected: number, actual: number) {
		super(
			`Layout conflict for ${layoutId}: expected revision ${expected}, got ${actual}`,
			"LAYOUT_CONFLICT",
		);
		this.name = "LayoutConflictError";
	}
}

export class LayoutSchemaVersionError extends LayoutError {
	constructor(version: number, expected: number) {
		super(
			`Unsupported schema version ${version}. Expected ${expected}.`,
			"LAYOUT_SCHEMA_VERSION",
		);
		this.name = "LayoutSchemaVersionError";
	}
}

export class LayoutMigrationError extends LayoutError {
	constructor(message: string) {
		super(message, "LAYOUT_MIGRATION_ERROR");
		this.name = "LayoutMigrationError";
	}
}
